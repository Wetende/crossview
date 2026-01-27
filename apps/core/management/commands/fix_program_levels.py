from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.core.models import Program
from apps.platform.models import PlatformSettings


class Command(BaseCommand):
    help = "Normalize Program.level values to match configured course levels."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show changes without saving.",
        )
        parser.add_argument(
            "--default",
            dest="default_level",
            help="Fallback level value to use for missing/invalid levels.",
        )
        parser.add_argument(
            "--only-missing",
            action="store_true",
            help="Only fix programs with missing/blank levels.",
        )
        parser.add_argument(
            "--only-invalid",
            action="store_true",
            help="Only fix programs with invalid levels.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Maximum number of programs to process.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        default_level = (options.get("default_level") or "").strip()
        only_missing = options["only_missing"]
        only_invalid = options["only_invalid"]
        limit = options["limit"]

        if only_missing and only_invalid:
            raise CommandError("Use either --only-missing or --only-invalid, not both.")

        settings = PlatformSettings.get_settings()
        course_levels = settings.get_course_levels() or []
        valid_values = [lvl.get("value") for lvl in course_levels if lvl.get("value")]

        if not valid_values:
            raise CommandError(
                "No course levels configured. Configure levels before running."
            )

        valid_set = set(valid_values)
        value_map = {value.lower(): value for value in valid_values}
        label_map = {
            (lvl.get("label") or "").strip().lower(): lvl.get("value")
            for lvl in course_levels
            if lvl.get("label") and lvl.get("value")
        }

        if default_level:
            if default_level not in valid_set:
                raise CommandError(
                    f"Default level '{default_level}' is not a valid level value."
                )
            fallback_level = default_level
        else:
            fallback_level = valid_values[0]

        qs = Program.objects.all().order_by("id")
        if limit:
            qs = qs[:limit]

        counts = {
            "total": 0,
            "ok": 0,
            "missing": 0,
            "invalid": 0,
            "fixed": 0,
            "skipped": 0,
        }

        changes = []

        for program in qs:
            counts["total"] += 1
            current = (program.level or "").strip()

            if not current:
                counts["missing"] += 1
                if only_invalid:
                    counts["skipped"] += 1
                    continue
                target = fallback_level
            elif current in valid_set:
                counts["ok"] += 1
                continue
            else:
                counts["invalid"] += 1
                if only_missing:
                    counts["skipped"] += 1
                    continue
                lower = current.lower()
                if lower in value_map:
                    target = value_map[lower]
                elif lower in label_map:
                    target = label_map[lower]
                else:
                    target = fallback_level

            changes.append((program, current, target))

        if not changes:
            self.stdout.write(self.style.SUCCESS("No programs require updates."))
            self.stdout.write(self._summary(counts))
            return

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run: no changes will be saved."))
            for program, current, target in changes:
                self.stdout.write(
                    f"[DRY RUN] Program {program.id} '{program.name}': "
                    f"'{current or '(blank)'}' -> '{target}'"
                )
            self.stdout.write(self._summary(counts, fixed=len(changes)))
            return

        with transaction.atomic():
            for program, current, target in changes:
                program.level = target
                program.save(update_fields=["level"])
                counts["fixed"] += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Updated Program {program.id} '{program.name}': "
                        f"'{current or '(blank)'}' -> '{target}'"
                    )
                )

        self.stdout.write(self._summary(counts))

    def _summary(self, counts, fixed=None):
        fixed_count = counts["fixed"] if fixed is None else fixed
        return (
            "Summary: "
            f"total={counts['total']}, "
            f"ok={counts['ok']}, "
            f"missing={counts['missing']}, "
            f"invalid={counts['invalid']}, "
            f"fixed={fixed_count}, "
            f"skipped={counts['skipped']}"
        )
