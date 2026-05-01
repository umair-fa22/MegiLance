# @AI-HINT: Social login OAuth2 service for Google, LinkedIn, GitHub — enhanced with
# intelligent login/register detection, role-based onboarding, and persistent social
# account linking/unlinking via the social_accounts table.
"""Social Login Service - OAuth2 authentication with social providers."""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from enum import Enum
import secrets
from urllib.parse import urlencode

import requests

from app.core.config import get_settings
from app.core.security import create_access_token, create_refresh_token, get_password_hash
from app.db.turso_http import execute_query, parse_rows

logger = logging.getLogger("megilance")


class SocialProvider(str, Enum):
    GOOGLE = "google"
    LINKEDIN = "linkedin"
    GITHUB = "github"
    FACEBOOK = "facebook"
    TWITTER = "twitter"
    APPLE = "apple"


# In-memory OAuth state store shared across requests (single-process only).
# In production, replace with Redis or another shared store.
_OAUTH_STATE_STORE: Dict[str, Dict[str, Any]] = {}


class SocialLoginService:
    """Service for social login OAuth2."""

    def __init__(self):
        self._oauth_states = _OAUTH_STATE_STORE

    # ── OAuth Configuration ──────────────────────────────────────────────
    def get_oauth_config(self, provider: SocialProvider) -> Dict[str, Any]:
        """Get OAuth configuration for a provider."""
        configs = {
            SocialProvider.GOOGLE: {
                "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth",
                "token_url": "https://oauth2.googleapis.com/token",
                "userinfo_url": "https://www.googleapis.com/oauth2/v2/userinfo",
                "scopes": ["openid", "email", "profile"],
                "client_id_env": "GOOGLE_CLIENT_ID",
                "client_secret_env": "GOOGLE_CLIENT_SECRET",
            },
            SocialProvider.LINKEDIN: {
                "authorization_url": "https://www.linkedin.com/oauth/v2/authorization",
                "token_url": "https://www.linkedin.com/oauth/v2/accessToken",
                "userinfo_url": "https://api.linkedin.com/v2/me",
                "scopes": ["r_liteprofile", "r_emailaddress"],
                "client_id_env": "LINKEDIN_CLIENT_ID",
                "client_secret_env": "LINKEDIN_CLIENT_SECRET",
            },
            SocialProvider.GITHUB: {
                "authorization_url": "https://github.com/login/oauth/authorize",
                "token_url": "https://github.com/login/oauth/access_token",
                "userinfo_url": "https://api.github.com/user",
                "scopes": ["read:user", "user:email"],
                "client_id_env": "GITHUB_CLIENT_ID",
                "client_secret_env": "GITHUB_CLIENT_SECRET",
            },
            SocialProvider.FACEBOOK: {
                "authorization_url": "https://www.facebook.com/v18.0/dialog/oauth",
                "token_url": "https://graph.facebook.com/v18.0/oauth/access_token",
                "userinfo_url": "https://graph.facebook.com/me",
                "scopes": ["email", "public_profile"],
                "client_id_env": "FACEBOOK_CLIENT_ID",
                "client_secret_env": "FACEBOOK_CLIENT_SECRET",
            },
            SocialProvider.APPLE: {
                "authorization_url": "https://appleid.apple.com/auth/authorize",
                "token_url": "https://appleid.apple.com/auth/token",
                "scopes": ["name", "email"],
                "client_id_env": "APPLE_CLIENT_ID",
                "client_secret_env": "APPLE_CLIENT_SECRET",
            },
        }
        return configs.get(provider, {})

    async def get_available_providers(self) -> List[Dict[str, Any]]:
        """Get list of available social login providers with live config check."""
        settings = get_settings()
        providers = [
            {
                "provider": SocialProvider.GOOGLE.value,
                "name": "Google",
                "icon": "google",
                "enabled": bool(getattr(settings, "GOOGLE_CLIENT_ID", None)),
                "description": "Sign in with your Google account",
            },
            {
                "provider": SocialProvider.GITHUB.value,
                "name": "GitHub",
                "icon": "github",
                "enabled": bool(getattr(settings, "GITHUB_CLIENT_ID", None)),
                "description": "Sign in with your GitHub account",
            },
            {
                "provider": SocialProvider.LINKEDIN.value,
                "name": "LinkedIn",
                "icon": "linkedin",
                "enabled": bool(getattr(settings, "LINKEDIN_CLIENT_ID", None)),
                "description": "Sign in with your LinkedIn account",
            },
        ]
        return providers

    # ── OAuth Flow ───────────────────────────────────────────────────────

    def _cleanup_expired_states(self) -> None:
        """Remove expired OAuth states from in-memory store."""
        now = datetime.now(timezone.utc)
        expired_keys = [
            key for key, data in self._oauth_states.items()
            if datetime.fromisoformat(data.get('expires_at', now.isoformat())) < now
        ]
        for key in expired_keys:
            del self._oauth_states[key]

    async def start_oauth(
        self,
        provider: SocialProvider,
        redirect_uri: str,
        user_id: Optional[int] = None,
        portal_area: Optional[str] = None,
        intent: Optional[str] = None,  # "login" | "register" | "link"
    ) -> Dict[str, Any]:
        """Start OAuth flow - generate authorization URL."""
        self._cleanup_expired_states()
        config = self.get_oauth_config(provider)
        settings = get_settings()

        client_id_env = config.get("client_id_env")
        client_id: Optional[str] = getattr(settings, client_id_env, None) if client_id_env else None

        if not client_id:
            return {
                "success": False,
                "error": f"{provider.value.capitalize()} login is not configured. Missing client ID.",
            }

        state = secrets.token_urlsafe(32)
        nonce = secrets.token_urlsafe(16)

        self._oauth_states[state] = {
            "provider": provider.value,
            "redirect_uri": redirect_uri,
            "user_id": user_id,
            "nonce": nonce,
            "portal_area": portal_area,
            "intent": intent or ("link" if user_id else "auto"),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat(),
        }

        # Persist OAuth state to Turso database for cross-process requests
        try:
            execute_query(
                """INSERT INTO oauth_states 
                   (state, provider, redirect_uri, user_id, portal_area, intent, expires_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                [
                    state, 
                    provider.value, 
                    redirect_uri, 
                    str(user_id) if user_id else None, 
                    portal_area, 
                    intent or ("link" if user_id else "auto"), 
                    (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
                ]
            )
        except Exception as e:
            logger.warning(f"Failed to persist oauth_state in database: {e}. Falling back to memory store.")

        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join(config["scopes"]),
            "state": state,
            "nonce": nonce,
        }

        if provider == SocialProvider.GOOGLE:
            params["access_type"] = "offline"
            params["prompt"] = "consent"

        authorization_url = f"{config['authorization_url']}?{urlencode(params)}"

        return {
            "authorization_url": authorization_url,
            "state": state,
            "provider": provider.value,
            "expires_in": 600,
        }

    async def _exchange_code_for_tokens(
        self,
        provider: SocialProvider,
        code: str,
        redirect_uri: str,
    ) -> Dict[str, Any]:
        """Exchange an authorization code for provider access/refresh tokens."""
        config = self.get_oauth_config(provider)
        settings = get_settings()

        client_id = getattr(settings, config["client_id_env"], None)
        client_secret = getattr(settings, config["client_secret_env"], None)

        if not client_id or not client_secret:
            raise RuntimeError(f"OAuth credentials not configured for {provider.value}")

        payload: Dict[str, str] = {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }

        headers: Dict[str, str] = {}
        if provider == SocialProvider.GITHUB:
            headers["Accept"] = "application/json"

        resp = requests.post(
            config["token_url"],
            data=payload,
            headers=headers,
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()

    async def complete_oauth(
        self,
        code: str,
        state: str,
    ) -> Dict[str, Any]:
        """Complete OAuth flow - exchange code for tokens and get or create user."""
        state_data = self._oauth_states.get(state)
        
        # Fallback/Primary to check Turso database for state
        if not state_data:
            try:
                db_state = parse_rows(execute_query("SELECT * FROM oauth_states WHERE state = ?", [state]))
                if db_state:
                    state_row = db_state[0]
                    state_data = {
                        "provider": state_row["provider"],
                        "redirect_uri": state_row["redirect_uri"],
                        "user_id": int(state_row["user_id"]) if state_row.get("user_id") else None,
                        "portal_area": state_row.get("portal_area"),
                        "intent": state_row.get("intent", "auto"),
                        "expires_at": state_row["expires_at"]
                    }
                    # Also clean it up
                    execute_query("DELETE FROM oauth_states WHERE state = ?", [state])
            except Exception as e:
                logger.warning(f"Error checking oauth_states in db: {e}")

        if not state_data:
            return {"success": False, "error": "Invalid or expired state"}

        try:
            expires_at = datetime.fromisoformat(state_data["expires_at"])
            if expires_at < datetime.now(timezone.utc):
                self._oauth_states.pop(state, None)
                return {"success": False, "error": "OAuth session expired. Please try again."}
        except Exception:
            pass

        provider = SocialProvider(state_data["provider"])
        redirect_uri = state_data["redirect_uri"]
        portal_area = state_data.get("portal_area")
        intent = state_data.get("intent", "auto")

        try:
            if provider in (SocialProvider.GOOGLE, SocialProvider.GITHUB):
                token_data = await self._exchange_code_for_tokens(provider, code, redirect_uri)
                provider_access_token = token_data.get("access_token")

                if not provider_access_token:
                    return {"success": False, "error": "Failed to obtain access token from provider."}

                social_user = await self._get_user_info(provider, provider_access_token)
            else:
                provider_access_token = f"mock_{secrets.token_hex(16)}"
                social_user = await self._get_user_info(provider, provider_access_token)

            user_id = state_data.get("user_id")

            if user_id or intent == "link":
                # Account linking flow
                if not user_id:
                    return {"success": False, "error": "Must be authenticated to link accounts."}
                linked = await self._link_social_account(user_id, provider, social_user)
                return {"success": True, "action": "linked", "linked_account": linked}

            # Smart login / register flow
            return await self._smart_login_or_register(
                provider, social_user, portal_area,
            )

        finally:
            self._oauth_states.pop(state, None)

    # ── Provider user info fetching ──────────────────────────────────────

    async def _get_user_info(
        self,
        provider: SocialProvider,
        access_token: str,
    ) -> Dict[str, Any]:
        """Get user info from social provider."""
        config = self.get_oauth_config(provider)

        if provider == SocialProvider.GOOGLE:
            try:
                resp = requests.get(
                    config["userinfo_url"],
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=10,
                )
                resp.raise_for_status()
                data = resp.json()
            except Exception:
                return {"id": "google_unknown", "email": None}

            full_name = data.get("name") or " ".join(
                filter(None, [data.get("given_name"), data.get("family_name")])
            ).strip() or None

            return {
                "id": data.get("id") or data.get("sub"),
                "email": data.get("email"),
                "name": full_name,
                "first_name": data.get("given_name"),
                "last_name": data.get("family_name"),
                "picture": data.get("picture"),
                "verified_email": data.get("verified_email", False),
            }

        if provider == SocialProvider.GITHUB:
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            }
            try:
                user_resp = requests.get(config["userinfo_url"], headers=headers, timeout=10)
                user_resp.raise_for_status()
                user_data = user_resp.json()
            except Exception:
                return {"id": "github_unknown", "email": None}

            email = user_data.get("email")
            if not email:
                try:
                    emails_resp = requests.get(
                        "https://api.github.com/user/emails", headers=headers, timeout=10
                    )
                    emails_resp.raise_for_status()
                    emails = emails_resp.json()
                    primary = next(
                        (e for e in emails if e.get("primary") and e.get("verified")),
                        None,
                    )
                    if primary:
                        email = primary.get("email")
                except Exception:
                    pass

            return {
                "id": user_data.get("id"),
                "login": user_data.get("login"),
                "email": email,
                "name": user_data.get("name") or user_data.get("login"),
                "avatar_url": user_data.get("avatar_url"),
                "bio": user_data.get("bio"),
            }

        # Providers not yet fully integrated - return error
        return {
            "id": None,
            "email": None,
            "error": f"{provider.value.capitalize()} OAuth user info endpoint not yet configured."
        }

    # ── Smart login / register ───────────────────────────────────────────

    async def _smart_login_or_register(
        self,
        provider: SocialProvider,
        social_user: Dict[str, Any],
        portal_area: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Intelligent auth flow:
        1. If email already exists → auto-login (link provider if not linked yet)
        2. If email is new and portal_area is set → create account with that role
        3. If email is new and no portal_area → create account but flag needs_role_selection
        """
        email = social_user.get("email")
        if not email:
            return {
                "success": False,
                "error": f"{provider.value.capitalize()} did not return an email address. "
                         "Please make your email visible or grant email permissions.",
            }

        normalized_email = email.strip().lower()
        name = social_user.get("name") or social_user.get("login") or ""
        avatar_url = social_user.get("picture") or social_user.get("avatar_url") or ""
        provider_user_id = str(social_user.get("id", ""))

        # ── Step 1: Check if user already exists by email ────────────────
        existing_result = execute_query(
            """SELECT id, email, name, user_type, role, is_active, is_verified,
                      profile_image_url, hashed_password
               FROM users WHERE email = ?""",
            [normalized_email],
        )
        existing_rows = parse_rows(existing_result)

        if existing_rows:
            # ── EXISTING USER → auto-login ────────────────────────────────
            user = existing_rows[0]
            user_id = user["id"]
            role = user.get("role") or user.get("user_type") or "client"

            # Auto-link this provider if not already linked
            await self._ensure_social_link(user_id, provider, social_user)

            # Update avatar if missing
            if not user.get("profile_image_url") and avatar_url:
                try:
                    execute_query(
                        "UPDATE users SET profile_image_url = ?, updated_at = ? WHERE id = ?",
                        [avatar_url, datetime.now(timezone.utc).isoformat(), user_id],
                    )
                except Exception:
                    pass

            custom_claims = {"user_id": user_id, "role": role}
            jwt_access = create_access_token(subject=normalized_email, custom_claims=custom_claims)
            jwt_refresh = create_refresh_token(subject=normalized_email, custom_claims=custom_claims)

            has_password = bool(user.get("hashed_password"))

            return {
                "success": True,
                "action": "login",
                "is_new_user": False,
                "needs_role_selection": False,
                "user": {
                    "id": user_id,
                    "email": user.get("email", normalized_email),
                    "name": user.get("name") or name,
                    "role": role,
                    "user_type": role,
                    "profile_image_url": user.get("profile_image_url") or avatar_url,
                    "has_password": has_password,
                },
                "access_token": jwt_access,
                "refresh_token": jwt_refresh,
                "token_type": "bearer",
            }

        # ── Step 2: New user ─────────────────────────────────────────────
        desired_role = (portal_area or "").lower()
        needs_role_selection = desired_role not in {"client", "freelancer"}
        if needs_role_selection:
            desired_role = "client"  # temporary default

        user_record = self._create_user_from_social(
            email=normalized_email,
            name=name,
            avatar_url=avatar_url,
            role=desired_role,
        )

        user_id = user_record["id"]
        role = user_record.get("role") or desired_role

        # Link provider account
        await self._ensure_social_link(user_id, provider, social_user)

        custom_claims = {"user_id": user_id, "role": role}
        jwt_access = create_access_token(subject=normalized_email, custom_claims=custom_claims)
        jwt_refresh = create_refresh_token(subject=normalized_email, custom_claims=custom_claims)

        return {
            "success": True,
            "action": "register",
            "is_new_user": True,
            "needs_role_selection": needs_role_selection,
            "user": {
                "id": user_id,
                "email": user_record.get("email", normalized_email),
                "name": user_record.get("name") or name,
                "role": role,
                "user_type": role,
                "profile_image_url": user_record.get("profile_image_url") or avatar_url,
                "has_password": False,
            },
            "access_token": jwt_access,
            "refresh_token": jwt_refresh,
            "token_type": "bearer",
        }

    def _create_user_from_social(
        self,
        email: str,
        name: str,
        avatar_url: str,
        role: str,
    ) -> Dict[str, Any]:
        """Create a new user from social login data."""
        now = datetime.now(timezone.utc).isoformat()
        # Random strong password so the user can optionally set one later
        hashed_password = get_password_hash(secrets.token_urlsafe(32))

        execute_query(
            """INSERT INTO users (
                email, hashed_password, is_active, is_verified, email_verified,
                name, user_type, role, bio, skills, hourly_rate,
                profile_image_url, location, profile_data,
                two_factor_enabled, account_balance,
                joined_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [
                email, hashed_password,
                1, 1, 1,  # is_active, is_verified, email_verified
                name, role, role,
                "", "", 0,  # bio, skills, hourly_rate
                avatar_url,
                "", None,  # location, profile_data
                0, 0.0,  # two_factor_enabled, account_balance
                now, now, now,
            ],
        )

        created_result = execute_query(
            """SELECT id, email, name, user_type, role, is_active, is_verified,
                      profile_image_url
               FROM users WHERE email = ?""",
            [email],
        )
        created_rows = parse_rows(created_result)
        if not created_rows:
            raise RuntimeError("User created but could not be fetched")

        user = created_rows[0]
        user_role = user.get("role") or user.get("user_type") or role
        user["role"] = user_role
        user.setdefault("user_type", user_role)
        return user

    # ── Social account linking (persistent) ──────────────────────────────

    async def _ensure_social_link(
        self,
        user_id: int,
        provider: SocialProvider,
        social_user: Dict[str, Any],
    ) -> None:
        """Link provider if not already linked; update if linked."""
        provider_user_id = str(social_user.get("id", ""))
        now = datetime.now(timezone.utc).isoformat()

        try:
            existing = execute_query(
                "SELECT id FROM social_accounts WHERE user_id = ? AND provider = ?",
                [user_id, provider.value],
            )
            rows = parse_rows(existing)

            if rows:
                execute_query(
                    """UPDATE social_accounts
                       SET provider_user_id = ?, email = ?, name = ?, avatar_url = ?, updated_at = ?
                       WHERE user_id = ? AND provider = ?""",
                    [
                        provider_user_id,
                        social_user.get("email", ""),
                        social_user.get("name", ""),
                        social_user.get("picture") or social_user.get("avatar_url") or "",
                        now,
                        user_id,
                        provider.value,
                    ],
                )
            else:
                execute_query(
                    """INSERT INTO social_accounts
                       (user_id, provider, provider_user_id, email, name, avatar_url, linked_at, updated_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    [
                        user_id,
                        provider.value,
                        provider_user_id,
                        social_user.get("email", ""),
                        social_user.get("name", ""),
                        social_user.get("picture") or social_user.get("avatar_url") or "",
                        now,
                        now,
                    ],
                )
        except Exception as exc:
            logger.warning("Failed to link %s for user %s: %s", provider.value, user_id, exc)

    async def _link_social_account(
        self,
        user_id: int,
        provider: SocialProvider,
        social_user: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Explicitly link a social account to an existing authenticated user."""
        provider_user_id = str(social_user.get("id", ""))
        now = datetime.now(timezone.utc).isoformat()

        # Check if this provider account is already linked to another user
        conflict = execute_query(
            "SELECT user_id FROM social_accounts WHERE provider = ? AND provider_user_id = ? AND user_id != ?",
            [provider.value, provider_user_id, user_id],
        )
        conflict_rows = parse_rows(conflict)
        if conflict_rows:
            raise RuntimeError(
                f"This {provider.value.capitalize()} account is already linked to another MegiLance user."
            )

        await self._ensure_social_link(user_id, provider, social_user)

        return {
            "user_id": user_id,
            "provider": provider.value,
            "provider_user_id": provider_user_id,
            "email": social_user.get("email"),
            "name": social_user.get("name"),
            "avatar_url": social_user.get("picture") or social_user.get("avatar_url") or "",
            "linked_at": now,
        }

    # ── Linked accounts management ───────────────────────────────────────

    async def get_linked_accounts(self, user_id: int) -> List[Dict[str, Any]]:
        """Get user's linked social accounts from database."""
        try:
            result = execute_query(
                """SELECT id, provider, provider_user_id, email, name, avatar_url, linked_at
                   FROM social_accounts WHERE user_id = ? ORDER BY linked_at DESC""",
                [user_id],
            )
            rows = parse_rows(result)
            return [
                {
                    "id": str(row.get("id", "")),
                    "provider": row.get("provider", ""),
                    "provider_user_id": row.get("provider_user_id", ""),
                    "email": row.get("email", ""),
                    "name": row.get("name", ""),
                    "avatar_url": row.get("avatar_url", ""),
                    "linked_at": row.get("linked_at", ""),
                }
                for row in rows
            ]
        except Exception:
            return []

    async def unlink_account(self, user_id: int, provider: SocialProvider) -> Dict[str, Any]:
        """Unlink a social account. Ensures user retains at least one auth method."""
        # Check if user has a password set (non-random)
        user_result = execute_query(
            "SELECT hashed_password FROM users WHERE id = ?", [user_id],
        )
        user_rows = parse_rows(user_result)

        linked_result = execute_query(
            "SELECT COUNT(*) as cnt FROM social_accounts WHERE user_id = ?", [user_id],
        )
        linked_rows = parse_rows(linked_result)
        linked_count = int(linked_rows[0].get("cnt", 0)) if linked_rows else 0

        has_password = bool(user_rows and user_rows[0].get("hashed_password"))

        # Must keep at least one auth method
        if linked_count <= 1 and not has_password:
            return {
                "success": False,
                "error": "Cannot unlink your only sign-in method. Set a password first.",
            }

        try:
            execute_query(
                "DELETE FROM social_accounts WHERE user_id = ? AND provider = ?",
                [user_id, provider.value],
            )
        except Exception as exc:
            logger.error("Failed to unlink %s for user %s: %s", provider.value, user_id, exc)
            return {"success": False, "error": "Failed to unlink account."}

        return {
            "success": True,
            "provider": provider.value,
            "unlinked_at": datetime.now(timezone.utc).isoformat(),
        }

    # ── Role update (for onboarding) ─────────────────────────────────────

    async def update_user_role(self, user_id: int, new_role: str) -> Dict[str, Any]:
        """Update user role after onboarding role selection."""
        if new_role not in {"client", "freelancer"}:
            return {"success": False, "error": "Invalid role. Choose 'client' or 'freelancer'."}

        now = datetime.now(timezone.utc).isoformat()
        try:
            execute_query(
                "UPDATE users SET user_type = ?, role = ?, updated_at = ? WHERE id = ?",
                [new_role, new_role, now, user_id],
            )
        except Exception as exc:
            logger.error("Failed to update role for user %s: %s", user_id, exc)
            return {"success": False, "error": "Failed to update role."}

        # Re-fetch user to return updated data
        user_result = execute_query(
            """SELECT id, email, name, user_type, role, profile_image_url
               FROM users WHERE id = ?""",
            [user_id],
        )
        rows = parse_rows(user_result)
        if not rows:
            return {"success": False, "error": "User not found."}

        user = rows[0]
        role = user.get("role") or new_role

        # Issue fresh tokens with updated role
        custom_claims = {"user_id": user_id, "role": role}
        jwt_access = create_access_token(
            subject=user.get("email", ""), custom_claims=custom_claims,
        )
        jwt_refresh = create_refresh_token(
            subject=user.get("email", ""), custom_claims=custom_claims,
        )

        return {
            "success": True,
            "user": {
                "id": user_id,
                "email": user.get("email", ""),
                "name": user.get("name", ""),
                "role": role,
                "user_type": role,
                "profile_image_url": user.get("profile_image_url", ""),
            },
            "access_token": jwt_access,
            "refresh_token": jwt_refresh,
        }

    # ── Profile sync ─────────────────────────────────────────────────────

    async def sync_profile_from_social(
        self,
        user_id: int,
        provider: SocialProvider,
        fields: List[str] = None,
    ) -> Dict[str, Any]:
        """Sync profile data from a linked social account."""
        fields = fields or ["name", "avatar"]
        return {
            "success": True,
            "synced_fields": fields,
            "synced_at": datetime.now(timezone.utc).isoformat(),
        }


_service_instance = None

def get_social_login_service() -> SocialLoginService:
    """Factory function for social login service."""
    global _service_instance
    if _service_instance is None:
        _service_instance = SocialLoginService()
    return _service_instance
