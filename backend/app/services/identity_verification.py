# @AI-HINT: KYC/Identity verification service with document upload and validation
"""Identity Verification Service - KYC (Know Your Customer) implementation."""

import logging
import hashlib
import secrets
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from enum import Enum
import os

logger = logging.getLogger(__name__)


class DocumentType(str, Enum):
    """Supported document types for verification."""
    PASSPORT = "passport"
    NATIONAL_ID = "national_id"
    DRIVERS_LICENSE = "drivers_license"
    RESIDENCE_PERMIT = "residence_permit"
    UTILITY_BILL = "utility_bill"
    BANK_STATEMENT = "bank_statement"
    SELFIE = "selfie"


class VerificationStatus(str, Enum):
    """Verification status values."""
    NOT_STARTED = "not_started"
    PENDING = "pending"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"
    REQUIRES_UPDATE = "requires_update"


class VerificationTier(str, Enum):
    """Verification tiers with different privileges."""
    UNVERIFIED = "unverified"  # Can browse, limited actions
    BASIC = "basic"           # Email + phone verified
    STANDARD = "standard"     # ID document verified
    ENHANCED = "enhanced"     # ID + address verified
    PREMIUM = "premium"       # Full KYC + face match


class IdentityVerificationService:
    """
    Service for managing user identity verification (KYC).
    
    Handles document upload, validation, OCR, and verification workflow.
    """
    
    # Document requirements by type
    DOCUMENT_REQUIREMENTS = {
        DocumentType.PASSPORT: {
            "required_fields": ["full_name", "date_of_birth", "document_number", "expiry_date", "nationality"],
            "max_age_days": 3650,  # 10 years
            "supported_countries": ["*"],  # All countries
        },
        DocumentType.NATIONAL_ID: {
            "required_fields": ["full_name", "date_of_birth", "document_number"],
            "max_age_days": 3650,
            "supported_countries": ["*"],
        },
        DocumentType.DRIVERS_LICENSE: {
            "required_fields": ["full_name", "date_of_birth", "document_number", "expiry_date"],
            "max_age_days": 1825,  # 5 years
            "supported_countries": ["*"],
        },
        DocumentType.UTILITY_BILL: {
            "required_fields": ["name", "address"],
            "max_age_days": 90,  # 3 months
            "supported_countries": ["*"],
        },
        DocumentType.BANK_STATEMENT: {
            "required_fields": ["name", "address"],
            "max_age_days": 90,
            "supported_countries": ["*"],
        },
    }
    
    # Tier requirements
    TIER_REQUIREMENTS = {
        VerificationTier.BASIC: {
            "documents_required": [],
            "checks": ["email_verified", "phone_verified"],
        },
        VerificationTier.STANDARD: {
            "documents_required": [DocumentType.PASSPORT, DocumentType.NATIONAL_ID, DocumentType.DRIVERS_LICENSE],
            "checks": ["email_verified", "document_verified"],
            "requires_any_of": True,  # Any one of the document types
        },
        VerificationTier.ENHANCED: {
            "documents_required": [
                [DocumentType.PASSPORT, DocumentType.NATIONAL_ID, DocumentType.DRIVERS_LICENSE],  # Any one
                [DocumentType.UTILITY_BILL, DocumentType.BANK_STATEMENT]  # Plus any one
            ],
            "checks": ["email_verified", "document_verified", "address_verified"],
        },
        VerificationTier.PREMIUM: {
            "documents_required": [
                [DocumentType.PASSPORT, DocumentType.NATIONAL_ID, DocumentType.DRIVERS_LICENSE],
                [DocumentType.UTILITY_BILL, DocumentType.BANK_STATEMENT],
                [DocumentType.SELFIE]
            ],
            "checks": ["email_verified", "document_verified", "address_verified", "face_verified"],
        },
    }
    
    def __init__(self, storage_path: str = "uploads/verification"):
        self.storage_path = storage_path
        os.makedirs(storage_path, exist_ok=True)
        
        # In-memory verification store (would be in database in production)
        self._verifications: Dict[int, Dict] = {}
        self._documents: Dict[str, Dict] = {}
    
    async def get_verification_status(self, user_id: int) -> Dict[str, Any]:
        """
        Get current verification status for a user.
        
        Returns comprehensive verification information including
        current tier, submitted documents, and requirements.
        """
        from app.models.user import User
        
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        # Get or initialize verification record
        verification = self._verifications.get(user_id, {
            "user_id": user_id,
            "tier": VerificationTier.UNVERIFIED,
            "status": VerificationStatus.NOT_STARTED,
            "documents": [],
            "checks": {
                "email_verified": user.is_verified if hasattr(user, 'is_verified') else False,
                "phone_verified": False,
                "document_verified": False,
                "address_verified": False,
                "face_verified": False
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Recalculate tier
        calculated_tier = self._calculate_tier(verification["checks"], verification["documents"])
        verification["tier"] = calculated_tier
        
        # Get next tier requirements
        next_tier = self._get_next_tier(calculated_tier)
        next_tier_requirements = None
        if next_tier:
            next_tier_requirements = self._get_tier_requirements(next_tier, verification)
        
        return {
            **verification,
            "next_tier": next_tier,
            "next_tier_requirements": next_tier_requirements,
            "tier_benefits": self._get_tier_benefits(calculated_tier)
        }
    
    async def upload_document(
        self,
        user_id: int,
        document_type: DocumentType,
        file_data: bytes,
        filename: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Upload a verification document.
        
        Args:
            user_id: User uploading the document
            document_type: Type of document
            file_data: Raw file bytes
            filename: Original filename
            metadata: Additional metadata (country, issue_date, etc.)
            
        Returns:
            Document upload result with validation status
        """
        try:
            # Validate file
            validation_result = self._validate_file(file_data, filename)
            if not validation_result["valid"]:
                return {
                    "success": False,
                    "error": validation_result["error"],
                    "details": validation_result
                }
            
            # Generate document ID and secure filename
            document_id = secrets.token_urlsafe(16)
            secure_filename = f"{user_id}_{document_type.value}_{document_id}_{filename}"
            file_path = os.path.join(self.storage_path, secure_filename)
            
            # Save file
            with open(file_path, 'wb') as f:
                f.write(file_data)
            
            # Calculate file hash
            file_hash = hashlib.sha256(file_data).hexdigest()
            
            # Perform OCR and extract data (simulated)
            extracted_data = await self._extract_document_data(
                file_path, document_type, file_data
            )
            
            # Validate extracted data against requirements
            doc_validation = self._validate_document_data(
                document_type, extracted_data
            )
            
            # Create document record
            document = {
                "id": document_id,
                "user_id": user_id,
                "type": document_type.value,
                "filename": secure_filename,
                "original_filename": filename,
                "file_path": file_path,
                "file_hash": file_hash,
                "file_size": len(file_data),
                "mime_type": validation_result["mime_type"],
                "status": VerificationStatus.PENDING if doc_validation["valid"] else VerificationStatus.REJECTED,
                "extracted_data": extracted_data,
                "validation_result": doc_validation,
                "metadata": metadata or {},
                "uploaded_at": datetime.now(timezone.utc).isoformat(),
                "reviewed_at": None,
                "reviewer_id": None,
                "rejection_reason": doc_validation.get("error") if not doc_validation["valid"] else None
            }
            
            # Store document
            self._documents[document_id] = document
            
            # Update user verification record
            if user_id not in self._verifications:
                self._verifications[user_id] = {
                    "user_id": user_id,
                    "tier": VerificationTier.UNVERIFIED,
                    "status": VerificationStatus.PENDING,
                    "documents": [],
                    "checks": {
                        "email_verified": False,
                        "phone_verified": False,
                        "document_verified": False,
                        "address_verified": False,
                        "face_verified": False
                    },
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            
            self._verifications[user_id]["documents"].append(document_id)
            self._verifications[user_id]["status"] = VerificationStatus.PENDING
            self._verifications[user_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
            
            logger.info(f"Document uploaded: {document_id} for user {user_id}")
            
            return {
                "success": True,
                "document_id": document_id,
                "status": document["status"],
                "validation": doc_validation,
                "extracted_data": extracted_data
            }
            
        except Exception as e:
            logger.error(f"Document upload failed: {str(e)}")
            raise
    
    async def upload_selfie(
        self,
        user_id: int,
        file_data: bytes,
        filename: str
    ) -> Dict[str, Any]:
        """
        Upload selfie for face verification.
        
        Compares the selfie against the ID document photo.
        """
        # First upload the selfie document
        result = await self.upload_document(
            user_id=user_id,
            document_type=DocumentType.SELFIE,
            file_data=file_data,
            filename=filename
        )
        
        if not result["success"]:
            return result
        
        # Perform face matching against ID documents
        face_match_result = await self._perform_face_matching(
            user_id=user_id,
            selfie_document_id=result["document_id"]
        )
        
        # Update document with face match result
        document = self._documents[result["document_id"]]
        document["face_match_result"] = face_match_result
        
        if face_match_result["match"]:
            document["status"] = VerificationStatus.APPROVED
            # Update face verification check
            if user_id in self._verifications:
                self._verifications[user_id]["checks"]["face_verified"] = True
        else:
            document["status"] = VerificationStatus.REJECTED
            document["rejection_reason"] = "Face matching failed"
        
        result["face_match"] = face_match_result
        return result
    
    async def get_documents(
        self,
        user_id: int,
        document_type: Optional[DocumentType] = None,
        status: Optional[VerificationStatus] = None
    ) -> List[Dict[str, Any]]:
        """Get all documents for a user with optional filters."""
        documents = []
        
        verification = self._verifications.get(user_id, {})
        for doc_id in verification.get("documents", []):
            doc = self._documents.get(doc_id)
            if not doc:
                continue
            
            # Apply filters
            if document_type and doc["type"] != document_type.value:
                continue
            if status and doc["status"] != status:
                continue
            
            # Remove sensitive file path for response
            doc_copy = doc.copy()
            doc_copy.pop("file_path", None)
            documents.append(doc_copy)
        
        return documents
    
    async def admin_review_document(
        self,
        document_id: str,
        admin_id: int,
        approved: bool,
        notes: Optional[str] = None,
        rejection_reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Admin review of a verification document.
        
        Args:
            document_id: Document to review
            admin_id: Admin performing review
            approved: Whether to approve the document
            notes: Internal review notes
            rejection_reason: Reason if rejecting
        """
        if document_id not in self._documents:
            raise ValueError("Document not found")
        
        document = self._documents[document_id]
        user_id = document["user_id"]
        
        # Update document status
        document["status"] = VerificationStatus.APPROVED if approved else VerificationStatus.REJECTED
        document["reviewed_at"] = datetime.now(timezone.utc).isoformat()
        document["reviewer_id"] = admin_id
        document["review_notes"] = notes
        
        if not approved:
            document["rejection_reason"] = rejection_reason
        
        # Update user verification checks based on document type
        if approved and user_id in self._verifications:
            verification = self._verifications[user_id]
            doc_type = document["type"]
            
            if doc_type in [DocumentType.PASSPORT.value, DocumentType.NATIONAL_ID.value, 
                           DocumentType.DRIVERS_LICENSE.value]:
                verification["checks"]["document_verified"] = True
            elif doc_type in [DocumentType.UTILITY_BILL.value, DocumentType.BANK_STATEMENT.value]:
                verification["checks"]["address_verified"] = True
            elif doc_type == DocumentType.SELFIE.value:
                verification["checks"]["face_verified"] = True
            
            # Recalculate tier
            verification["tier"] = self._calculate_tier(
                verification["checks"], 
                verification["documents"]
            )
            verification["updated_at"] = datetime.now(timezone.utc).isoformat()
            
            # Update overall status
            all_docs_reviewed = all(
                self._documents.get(d, {}).get("status") in 
                [VerificationStatus.APPROVED, VerificationStatus.REJECTED]
                for d in verification["documents"]
            )
            if all_docs_reviewed:
                has_approved = any(
                    self._documents.get(d, {}).get("status") == VerificationStatus.APPROVED
                    for d in verification["documents"]
                )
                verification["status"] = VerificationStatus.APPROVED if has_approved else VerificationStatus.REJECTED
        
        logger.info(f"Document {document_id} reviewed by admin {admin_id}: {'approved' if approved else 'rejected'}")
        
        return {
            "document_id": document_id,
            "status": document["status"],
            "reviewed_at": document["reviewed_at"],
            "user_verification_tier": self._verifications.get(user_id, {}).get("tier")
        }
    
    async def get_pending_reviews(
        self,
        limit: int = 20,
        document_type: Optional[DocumentType] = None
    ) -> List[Dict[str, Any]]:
        """Get documents pending admin review."""
        pending = []
        
        for doc_id, doc in self._documents.items():
            if doc["status"] != VerificationStatus.PENDING:
                continue
            if document_type and doc["type"] != document_type.value:
                continue
            
            doc_copy = doc.copy()
            doc_copy.pop("file_path", None)
            pending.append(doc_copy)
            
            if len(pending) >= limit:
                break
        
        # Sort by upload date (oldest first)
        pending.sort(key=lambda x: x["uploaded_at"])
        return pending
    
    async def verify_phone(
        self,
        user_id: int,
        phone_number: str,
        verification_code: str
    ) -> Dict[str, Any]:
        """
        Verify phone number with SMS code.
        
        In production, would integrate with Twilio or similar.
        """
        # Verify against stored code
        stored_code = self._verifications.get(user_id, {}).get("pending_phone_code")
        if not stored_code or verification_code != stored_code:
            return {
                "success": False,
                "error": "Invalid verification code"
            }
        
        if user_id not in self._verifications:
            self._verifications[user_id] = {
                "user_id": user_id,
                "tier": VerificationTier.UNVERIFIED,
                "status": VerificationStatus.PENDING,
                "documents": [],
                "checks": {
                    "email_verified": False,
                    "phone_verified": False,
                    "document_verified": False,
                    "address_verified": False,
                    "face_verified": False
                },
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        
        self._verifications[user_id]["checks"]["phone_verified"] = True
        self._verifications[user_id]["phone_number"] = phone_number
        self._verifications[user_id]["phone_verified_at"] = datetime.now(timezone.utc).isoformat()
        
        # Recalculate tier
        verification = self._verifications[user_id]
        verification["tier"] = self._calculate_tier(
            verification["checks"],
            verification["documents"]
        )
        
        return {
            "success": True,
            "phone_verified": True,
            "new_tier": verification["tier"]
        }
    
    async def send_phone_verification(
        self,
        user_id: int,
        phone_number: str
    ) -> Dict[str, Any]:
        """
        Send phone verification code.
        
        In production, would send SMS via Twilio.
        """
        # Generate and store verification code
        code = str(secrets.randbelow(900000) + 100000)
        
        # Real Twilio Integration
        try:
            from twilio.rest import Client
            import os
            
            TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
            TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
            TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
            
            if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER:
                client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
                message = client.messages.create(
                    body=f"Your MegiLance verification code is: {code} \nValid for 15 minutes.",
                    from_=TWILIO_PHONE_NUMBER,
                    to=phone_number
                )
                logger.info(f"SMS sent successfully via Twilio to {phone_number}. SID: {message.sid}")
            else:
                logger.info(f"Twilio not configured. MOCK SMS: Code {code} for phone {phone_number}")
                
        except Exception as e:
            logger.error(f"Failed to send SMS using Twilio: {str(e)}")
            # Fallback to mock behavior on exception so UI doesn't crash during dev
            pass
        
        # Store pending verification
        if user_id not in self._verifications:
            self._verifications[user_id] = {
                "user_id": user_id,
                "tier": VerificationTier.UNVERIFIED,
                "status": VerificationStatus.NOT_STARTED,
                "documents": [],
                "checks": {},
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        
        self._verifications[user_id]["pending_phone_code"] = code
        self._verifications[user_id]["pending_phone_number"] = phone_number
        self._verifications[user_id]["code_sent_at"] = datetime.now(timezone.utc).isoformat()
        
        logger.info(f"Phone verification code sent to user {user_id}")
        
        return {
            "success": True,
            "message": "Verification code sent",
            "phone_masked": self._mask_phone(phone_number)
        }
    
    def _validate_file(
        self,
        file_data: bytes,
        filename: str
    ) -> Dict[str, Any]:
        """Validate uploaded file."""
        # Check file size (max 10MB)
        max_size = 10 * 1024 * 1024
        if len(file_data) > max_size:
            return {"valid": False, "error": "File too large (max 10MB)"}
        
        # Check file extension
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.pdf'}
        ext = os.path.splitext(filename)[1].lower()
        if ext not in allowed_extensions:
            return {"valid": False, "error": f"Invalid file type. Allowed: {allowed_extensions}"}
        
        # Check magic bytes (file signature)
        magic_bytes = {
            b'\xff\xd8\xff': ('image/jpeg', '.jpg'),
            b'\x89PNG': ('image/png', '.png'),
            b'%PDF': ('application/pdf', '.pdf'),
        }
        
        mime_type = None
        for magic, (mtype, _) in magic_bytes.items():
            if file_data[:len(magic)] == magic:
                mime_type = mtype
                break
        
        if not mime_type:
            return {"valid": False, "error": "Invalid file format"}
        
        return {
            "valid": True,
            "mime_type": mime_type,
            "extension": ext,
            "size": len(file_data)
        }
    
    async def _extract_document_data(
        self,
        file_path: str,
        document_type: DocumentType,
        file_data: bytes
    ) -> Dict[str, Any]:
        """
        Extract data from document using OCR.
        
        In production, would use Google Vision, AWS Textract, or similar.
        """
        # Simulated OCR extraction
        extracted = {
            "extraction_method": "simulated_ocr",
            "confidence": 0.85,
            "extracted_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Add document-specific fields based on type
        if document_type == DocumentType.PASSPORT:
            extracted.update({
                "full_name": "EXTRACTED NAME",
                "date_of_birth": "1990-01-15",
                "document_number": "AB123456",
                "expiry_date": "2030-01-15",
                "nationality": "US",
                "mrz_line1": "P<USAEXAMPLE<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<",
                "mrz_line2": "AB1234567US9001154M3001157<<<<<<<<<<<<<<00"
            })
        elif document_type == DocumentType.DRIVERS_LICENSE:
            extracted.update({
                "full_name": "EXTRACTED NAME",
                "date_of_birth": "1990-01-15",
                "document_number": "D123456789",
                "expiry_date": "2028-01-15",
                "address": "123 Main St, City, State 12345"
            })
        elif document_type in [DocumentType.UTILITY_BILL, DocumentType.BANK_STATEMENT]:
            extracted.update({
                "name": "EXTRACTED NAME",
                "address": "123 Main Street, City, State 12345",
                "date": "2024-01-15"
            })
        
        return extracted
    
    def _validate_document_data(
        self,
        document_type: DocumentType,
        extracted_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate extracted document data against requirements."""
        requirements = self.DOCUMENT_REQUIREMENTS.get(document_type, {})
        required_fields = requirements.get("required_fields", [])
        
        missing_fields = []
        for field in required_fields:
            if field not in extracted_data or not extracted_data[field]:
                missing_fields.append(field)
        
        if missing_fields:
            return {
                "valid": False,
                "error": f"Missing required fields: {missing_fields}",
                "missing_fields": missing_fields
            }
        
        # Check expiry date if applicable
        if "expiry_date" in extracted_data:
            try:
                expiry = datetime.strptime(extracted_data["expiry_date"], "%Y-%m-%d")
                if expiry < datetime.now(timezone.utc):
                    return {
                        "valid": False,
                        "error": "Document has expired"
                    }
            except ValueError:
                pass
        
        return {
            "valid": True,
            "fields_validated": required_fields,
            "confidence": extracted_data.get("confidence", 0)
        }
    
    async def _perform_face_matching(
        self,
        user_id: int,
        selfie_document_id: str
    ) -> Dict[str, Any]:
        """
        Perform face matching between selfie and ID document.
        
        In production, would use AWS Rekognition, Azure Face API, or similar.
        """
        # Get ID document with photo
        verification = self._verifications.get(user_id, {})
        id_document = None
        
        for doc_id in verification.get("documents", []):
            doc = self._documents.get(doc_id)
            if doc and doc["type"] in [DocumentType.PASSPORT.value, 
                                       DocumentType.NATIONAL_ID.value,
                                       DocumentType.DRIVERS_LICENSE.value]:
                if doc["status"] == VerificationStatus.APPROVED:
                    id_document = doc
                    break
        
        if not id_document:
            return {
                "match": False,
                "error": "No approved ID document found for comparison",
                "confidence": 0
            }
        
        # Simulated face matching (in production, use real face recognition API)
        # For demo, assume 90% match
        similarity_score = 0.90
        
        return {
            "match": similarity_score > 0.8,
            "confidence": similarity_score,
            "id_document_id": id_document["id"],
            "matched_at": datetime.now(timezone.utc).isoformat(),
            "method": "simulated_face_api"
        }
    
    def _calculate_tier(
        self,
        checks: Dict[str, bool],
        documents: List[str]
    ) -> VerificationTier:
        """Calculate verification tier based on completed checks."""
        if checks.get("email_verified") and checks.get("document_verified") and \
           checks.get("address_verified") and checks.get("face_verified"):
            return VerificationTier.PREMIUM
        
        if checks.get("email_verified") and checks.get("document_verified") and \
           checks.get("address_verified"):
            return VerificationTier.ENHANCED
        
        if checks.get("email_verified") and checks.get("document_verified"):
            return VerificationTier.STANDARD
        
        if checks.get("email_verified") and checks.get("phone_verified"):
            return VerificationTier.BASIC
        
        return VerificationTier.UNVERIFIED
    
    def _get_next_tier(self, current_tier: VerificationTier) -> Optional[VerificationTier]:
        """Get the next tier level."""
        tier_order = [
            VerificationTier.UNVERIFIED,
            VerificationTier.BASIC,
            VerificationTier.STANDARD,
            VerificationTier.ENHANCED,
            VerificationTier.PREMIUM
        ]
        
        try:
            current_index = tier_order.index(current_tier)
            if current_index < len(tier_order) - 1:
                return tier_order[current_index + 1]
        except ValueError:
            pass
        
        return None
    
    def _get_tier_requirements(
        self,
        tier: VerificationTier,
        current_verification: Dict
    ) -> Dict[str, Any]:
        """Get remaining requirements for a tier."""
        requirements = self.TIER_REQUIREMENTS.get(tier, {})
        checks = current_verification.get("checks", {})
        
        missing_checks = []
        for check in requirements.get("checks", []):
            if not checks.get(check, False):
                missing_checks.append(check)
        
        return {
            "tier": tier.value,
            "missing_checks": missing_checks,
            "documents_needed": requirements.get("documents_required", [])
        }
    
    def _get_tier_benefits(self, tier: VerificationTier) -> Dict[str, Any]:
        """Get benefits for a verification tier."""
        benefits = {
            VerificationTier.UNVERIFIED: {
                "max_project_value": 100,
                "withdrawal_limit": 0,
                "can_message": True,
                "can_propose": False,
                "verified_badge": False
            },
            VerificationTier.BASIC: {
                "max_project_value": 500,
                "withdrawal_limit": 100,
                "can_message": True,
                "can_propose": True,
                "verified_badge": False
            },
            VerificationTier.STANDARD: {
                "max_project_value": 5000,
                "withdrawal_limit": 1000,
                "can_message": True,
                "can_propose": True,
                "verified_badge": True
            },
            VerificationTier.ENHANCED: {
                "max_project_value": 25000,
                "withdrawal_limit": 5000,
                "can_message": True,
                "can_propose": True,
                "verified_badge": True,
                "priority_support": True
            },
            VerificationTier.PREMIUM: {
                "max_project_value": None,  # Unlimited
                "withdrawal_limit": None,
                "can_message": True,
                "can_propose": True,
                "verified_badge": True,
                "priority_support": True,
                "featured_profile": True
            }
        }
        
        return benefits.get(tier, benefits[VerificationTier.UNVERIFIED])
    
    def _mask_phone(self, phone: str) -> str:
        """Mask phone number for display."""
        if len(phone) < 4:
            return "****"
        return f"****{phone[-4:]}"


# Singleton instance
_verification_service: Optional[IdentityVerificationService] = None
