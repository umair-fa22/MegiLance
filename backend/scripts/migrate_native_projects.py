# @AI-HINT: One-time migration script to convert existing externally-linked
# projects into native MegiLance projects by removing external apply URLs
# and replacing them with native proposal CTAs.
"""
Migrate Existing Projects to Native MegiLance Format
=====================================================
Removes external apply URLs (RemoteOK, Remotive, Freelancer.com)
from project descriptions and replaces them with native MegiLance
"Submit Proposal" calls-to-action.

Run once:
  cd backend && python scripts/migrate_native_projects.py
"""
import re
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.turso_http import execute_query


def migrate():
    """Update all projects that have external apply URLs."""
    # Find projects with external apply link patterns
    patterns = [
        "%APPLY HERE (REAL LINK)%",
        "%LIVE LISTING%from RemoteOK%",
        "%LIVE LISTING%from Remotive%",
        "%LIVE LISTING%from Freelancer%",
    ]

    total_updated = 0

    for pattern in patterns:
        result = execute_query(
            "SELECT id, title, description FROM projects WHERE description LIKE ?",
            [pattern],
        )
        rows = result.get("rows", []) if result else []
        if not rows:
            continue

        print(f"  Found {len(rows)} projects matching '{pattern[:40]}...'")

        for row in rows:
            pid = row[0]
            pid = int(pid.get("value") if isinstance(pid, dict) else pid)
            title_val = row[1]
            title = title_val.get("value") if isinstance(title_val, dict) else str(title_val)
            desc_val = row[2]
            desc = desc_val.get("value") if isinstance(desc_val, dict) else str(desc_val)

            new_desc = _clean_description(desc)
            if new_desc != desc:
                execute_query(
                    "UPDATE projects SET description = ? WHERE id = ?",
                    [new_desc, pid],
                )
                total_updated += 1
                print(f"    Updated #{pid}: {title[:60]}")

    print(f"\n  Total projects migrated: {total_updated}")
    return total_updated


def _clean_description(desc: str) -> str:
    """Remove external links and source attribution, add native CTA."""
    # Remove "**LIVE LISTING** from <source>" header
    desc = re.sub(
        r'\*\*LIVE LISTING\*\*\s*from\s+(RemoteOK\.com|Remotive\.com|Freelancer\.com)\s*\n*',
        '', desc
    )

    # Remove "**APPLY HERE (REAL LINK):**\n<url>" blocks
    desc = re.sub(
        r'\*\*APPLY HERE \(REAL LINK\):\*\*\s*\n\s*https?://[^\s\n]+\s*\n*',
        '', desc
    )

    # Remove "**Source:** RemoteOK Job #123" / "Remotive Job #123" / "Freelancer.com Project #123"
    desc = re.sub(
        r'\*\*Source:\*\*\s*(RemoteOK Job|Remotive Job|Freelancer\.com Project)\s*#\S+\s*',
        '', desc
    )

    # Remove "**Project ID:** 12345" from Freelancer descriptions
    desc = re.sub(r'\*\*Project ID:\*\*\s*\d+\s*\n*', '', desc)

    # Remove "**Bids:** ..." lines
    desc = re.sub(r'\*\*Bids:\*\*\s*[^\n]+\n*', '', desc)

    # Clean up excessive blank lines
    desc = re.sub(r'\n{3,}', '\n\n', desc)
    desc = desc.strip()

    # Add native CTA if not already present
    if "Submit your proposal through MegiLance" not in desc:
        desc += (
            "\n\n**How to Apply:** Submit your proposal through MegiLance. "
            "Include your relevant experience, portfolio links, and availability.\n\n"
            "_Project sourced from verified market data._"
        )

    return desc


if __name__ == "__main__":
    print("=" * 70)
    print("  MegiLance: Migrating projects to native format")
    print("  Removing external apply URLs, adding native CTAs")
    print("=" * 70)
    migrate()
    print("\nDone!")
