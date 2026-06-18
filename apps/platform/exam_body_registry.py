"""
Exam Body Registry — Backend-driven cascading mapping data.

Defines the complete mapping for each examining body's qualification families,
official levels, course presets, and auto-fill values. This data is served to
the frontend as props so cascading dropdowns work without hardcoding in React.

Usage:
    from apps.platform.exam_body_registry import EXAM_BODY_REGISTRY, get_registry_for_frontend
"""

EXAM_BODY_REGISTRY = {
    "KASNEB": {
        "label": "KASNEB",
        "regulatory_body": "KASNEB",
        "blueprint_code": "kasneb",
        "families": {
            "Certificate": {
                "courses": [
                    {"code": "CAMS", "name": "Certificate in Accounting and Management Skills"},
                ],
                "levels": ["Level I", "Level II"],
                "broad_category": "certificate",
                "award_type": "Certificate",
                "assessment_mode": "Exam",
            },
            "Diploma": {
                "courses": [
                    {"code": "ATD", "name": "Accounting Technicians Diploma"},
                    {"code": "DDMA", "name": "Diploma in Data Management and Analytics"},
                    {"code": "DCNSA", "name": "Diploma in Computer Networks and Systems Administration"},
                ],
                "levels": ["Level I", "Level II", "Level III"],
                "broad_category": "diploma",
                "award_type": "Diploma",
                "assessment_mode": "Exam",
            },
            "Diploma (DQM)": {
                "courses": [
                    {"code": "DQM", "name": "Diploma in Quality Management"},
                ],
                "levels": [
                    "Basic Units",
                    "Common Units",
                    "Industrial Attachment",
                    "Core Units",
                ],
                "broad_category": "diploma",
                "award_type": "Diploma",
                "assessment_mode": "Exam",
            },
            "Professional": {
                "courses": [
                    {"code": "CPA", "name": "Certified Public Accountants"},
                    {"code": "CS", "name": "Certified Secretaries"},
                    {"code": "CIFA", "name": "Certified Investment and Financial Analysts"},
                    {"code": "CCP", "name": "Certified Credit Professionals"},
                    {"code": "CISSE", "name": "Certified Information Systems Solutions Expert"},
                    {"code": "CQP", "name": "Certified Quality Professional"},
                ],
                "levels": ["Foundation", "Intermediate", "Advanced"],
                "broad_category": "professional",
                "award_type": "Professional Qualification",
                "assessment_mode": "Exam",
            },
            "Post-Professional": {
                "courses": [
                    {"code": "CFFE", "name": "Certified Forensic Fraud Examiner"},
                ],
                "levels": ["Module One", "Module Two", "Module Three"],
                "broad_category": "post_professional",
                "award_type": "Post-Professional Qualification",
                "assessment_mode": "Exam",
            },
            "Post-Professional (CPFM)": {
                "courses": [
                    {"code": "CPFM", "name": "Certified Public Finance Manager"},
                ],
                "levels": ["Module One", "Module Two", "Integrated Case Study"],
                "broad_category": "post_professional",
                "award_type": "Post-Professional Qualification",
                "assessment_mode": "Exam",
            },
        },
    },
    "CDACC": {
        "label": "CDACC",
        "regulatory_body": "CDACC",
        "blueprint_code": "cdacc",
        "families": {
            "Artisan / Entry Occupational": {
                "courses": [],
                "levels": ["Level 4"],
                "broad_category": "foundation",
                "award_type": "Artisan / Occupational Certificate",
                "assessment_mode": "CBET",
            },
            "Craft Certificate": {
                "courses": [],
                "levels": ["Level 5"],
                "broad_category": "certificate",
                "award_type": "Craft Certificate",
                "assessment_mode": "CBET",
            },
            "Diploma": {
                "courses": [],
                "levels": ["Level 6"],
                "broad_category": "diploma",
                "award_type": "Diploma",
                "assessment_mode": "CBET",
            },
            "Higher Diploma / Advanced Specialist": {
                "courses": [],
                "levels": ["Level 7"],
                "broad_category": "advanced",
                "award_type": "Higher Diploma / Advanced Certificate",
                "assessment_mode": "CBET",
            },
        },
    },
    "KNEC": {
        "label": "KNEC",
        "regulatory_body": "KNEC",
        "blueprint_code": "knec",
        "families": {
            "Entry": {
                "courses": [],
                "levels": ["NVCET"],
                "broad_category": "entry",
                "award_type": "NVCET Certificate",
                "assessment_mode": "Exam",
            },
            "Artisan": {
                "courses": [],
                "levels": ["Artisan"],
                "broad_category": "foundation",
                "award_type": "Artisan Certificate",
                "assessment_mode": "Exam",
            },
            "Certificate": {
                "courses": [],
                "levels": ["Craft"],
                "broad_category": "certificate",
                "award_type": "Craft Certificate",
                "assessment_mode": "Exam",
            },
            "Diploma": {
                "courses": [],
                "levels": ["Diploma"],
                "broad_category": "diploma",
                "award_type": "Diploma",
                "assessment_mode": "Exam",
            },
            "Advanced": {
                "courses": [],
                "levels": ["Higher Diploma"],
                "broad_category": "advanced",
                "award_type": "Higher Diploma",
                "assessment_mode": "Exam",
            },
        },
    },
    "NITA": {
        "label": "NITA",
        "regulatory_body": "NITA",
        "blueprint_code": "nita_trade",
        "families": {
            "Craft Proficiency": {
                "courses": [],
                "levels": [
                    "Craft Proficiency — Preliminary",
                    "Craft Proficiency — Intermediate",
                    "Craft Proficiency — Final",
                ],
                "broad_category": "foundation",
                "award_type": "NITA Certificate",
                "assessment_mode": "Trade Test",
            },
            "Skill Upgrading": {
                "courses": [],
                "levels": ["Skill Upgrading Course"],
                "broad_category": "skill_upgrade",
                "award_type": "NITA Certificate",
                "assessment_mode": "Trade Test",
            },
            "Industrial Artisan": {
                "courses": [],
                "levels": [
                    "Industrial Artisan — Basic",
                    "Industrial Artisan — Intermediate",
                    "Industrial Artisan — Advanced",
                ],
                "broad_category": "artisan",
                "award_type": "NITA Certificate",
                "assessment_mode": "Trade Test",
            },
            "Trade Test": {
                "courses": [],
                "levels": [
                    "Trade Test Grade III",
                    "Trade Test Grade II",
                    "Trade Test Grade I",
                ],
                "broad_category": "trade_test",
                "award_type": "Government Trade Test Certificate",
                "assessment_mode": "Trade Test",
            },
        },
    },
    "ICM": {
        "label": "ICM",
        "regulatory_body": "ICM",
        "blueprint_code": "icm_exam",
        "families": {
            "Foundation": {
                "courses": [],
                "levels": ["Level 3"],
                "broad_category": "foundation",
                "award_type": "Award / Certificate / Diploma",
                "assessment_mode": "Exam",
            },
            "Certificate": {
                "courses": [],
                "levels": ["Level 4"],
                "broad_category": "certificate",
                "award_type": "Certificate",
                "assessment_mode": "Exam",
            },
            "Diploma": {
                "courses": [],
                "levels": ["Level 5"],
                "broad_category": "diploma",
                "award_type": "Diploma",
                "assessment_mode": "Exam",
            },
            "Advanced Diploma / Graduate Diploma": {
                "courses": [],
                "levels": ["Level 6"],
                "broad_category": "advanced",
                "award_type": "Advanced Diploma / Graduate Diploma",
                "assessment_mode": "Exam",
            },
            "Post Graduate Diploma": {
                "courses": [],
                "levels": ["Level 7"],
                "broad_category": "professional",
                "award_type": "Post Graduate Diploma",
                "assessment_mode": "Exam",
                "blueprint_code_override": "icm_professional",
            },
        },
    },
    "Internal": {
        "label": "Internal",
        "regulatory_body": "Internal",
        "blueprint_code": "tvet",
        "families": {
            "Short Course": {
                "courses": ["AI Fundamentals", "Computer Packages", "Web Design"],
                "levels": ["Beginner", "Intermediate", "Advanced"],
                "broad_category": "skill_upgrade",
                "award_type": "Internal Certificate of Completion",
                "assessment_mode": "Practical / Project",
            },
            "Certificate of Participation": {
                "courses": ["Seminars", "Workshops", "Guest Lectures"],
                "levels": ["General"],
                "broad_category": "entry",
                "award_type": "Certificate of Participation",
                "assessment_mode": "Attendance-Based",
            },
        },
    },
}


def get_registry_for_frontend():
    """
    Transform the registry into a frontend-friendly format
    that can be passed as an Inertia prop.
    """
    result = {}
    for body_key, body_data in EXAM_BODY_REGISTRY.items():
        families = {}
        for family_key, family_data in body_data["families"].items():
            families[family_key] = {
                "courses": family_data["courses"],
                "levels": family_data["levels"],
                "broadCategory": family_data["broad_category"],
                "awardType": family_data["award_type"],
                "assessmentMode": family_data["assessment_mode"],
                "blueprintCode": family_data.get(
                    "blueprint_code_override", body_data["blueprint_code"]
                ),
            }
        result[body_key] = {
            "label": body_data["label"],
            "blueprintCode": body_data["blueprint_code"],
            "families": families,
        }
    return result
