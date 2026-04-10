"""
Seed script: Create the 7 DigikaTech Africa core programs.

Usage:
    python manage.py shell < scripts/seed_programs.py

Idempotent — safe to run multiple times. Uses program `code` as the
unique key so existing records are updated rather than duplicated.
"""
import django, os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.core.models import Program

PROGRAMS = [
    {
        "code": "DIGI-ROB",
        "name": "Robotics & IoT",
        "description": (
            "Build intelligent robots and Internet of Things (IoT) devices. "
            "Master sensors, automation, and embedded systems. This flagship "
            "program combines hardware, programming, and real-world "
            "problem-solving — perfect for students aged 8–18."
        ),
        "category": "STEM",
        "level": "beginner",
        "badge_type": "hot",
        "is_published": True,
    },
    {
        "code": "DIGI-CODE",
        "name": "Coding & Algorithms",
        "description": (
            "From Python to JavaScript, learn programming languages used by "
            "tech giants globally. Solve complex problems with algorithms. "
            "Build games, applications, and software with real portfolio projects."
        ),
        "category": "STEM",
        "level": "beginner",
        "is_published": True,
    },
    {
        "code": "DIGI-AI",
        "name": "AI & Machine Learning",
        "description": (
            "Explore AI, neural networks, and machine learning. Understand "
            "how AI is reshaping healthcare, finance, agriculture, and "
            "education in Africa. Build AI applications that solve real-world problems."
        ),
        "category": "STEM",
        "level": "intermediate",
        "is_published": True,
    },
    {
        "code": "DIGI-WEB",
        "name": "Web Design & Development",
        "description": (
            "Create beautiful, responsive websites. Learn HTML, CSS, "
            "JavaScript, and modern web frameworks. Build portfolios and "
            "real projects for careers in tech and entrepreneurship."
        ),
        "category": "STEM",
        "level": "beginner",
        "is_published": True,
    },
    {
        "code": "DIGI-MOB",
        "name": "Mobile App Development",
        "description": (
            "Develop iOS and Android applications. Learn mobile-first design "
            "and app development frameworks. Create apps that make a difference "
            "in African communities."
        ),
        "category": "STEM",
        "level": "intermediate",
        "is_published": True,
    },
    {
        "code": "DIGI-GFX",
        "name": "Graphics & 3D Design",
        "description": (
            "Master digital art, animation, and 3D modeling. Learn "
            "industry-standard software. Develop skills for careers in "
            "game design, film production, architecture visualization, "
            "and digital media."
        ),
        "category": "Creative",
        "level": "beginner",
        "is_published": True,
    },
    {
        "code": "DIGI-SCR",
        "name": "Scratch & Block Coding",
        "description": (
            "Visual, drag-and-drop programming for ages 5–11. Build "
            "animated stories, simple games, and interactive art in "
            "Scratch before graduating to Python and JavaScript."
        ),
        "category": "STEM",
        "level": "beginner",
        "is_published": True,
    },
]

created = 0
updated = 0

for data in PROGRAMS:
    code = data.pop("code")
    obj, was_created = Program.objects.update_or_create(
        code=code, defaults=data
    )
    if was_created:
        created += 1
    else:
        updated += 1
    print(f"{'Created' if was_created else 'Updated'}: {obj.name} ({code})")

print(f"\nDone! Created {created}, updated {updated}.")
