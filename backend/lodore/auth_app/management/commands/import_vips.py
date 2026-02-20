"""
Management command: import_vips

Usage:
  python manage.py import_vips --file /data/vips.csv

CSV format (exported from Excel):
  phone,full_name
  0512345678,محمد علي
  9665xxxxxxxx,سارة أحمد
  ...

The 'full_name' column is optional.
Phone numbers are normalized to 05xxxxxxxx during import.
Duplicate phones are skipped (upsert by phone).
"""
import csv
import os
import logging
from django.core.management.base import BaseCommand, CommandError
from lodore.auth_app.models import VIPPhone
from lodore.auth_app.utils import normalize_phone

logger = logging.getLogger("lodore")


class Command(BaseCommand):
    help = "Import VIP phone numbers from a CSV file into the database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            required=True,
            help="Path to the CSV file (must have a 'phone' column).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Parse and validate without saving to the database.",
        )
        parser.add_argument(
            "--reset-booked",
            action="store_true",
            help="Reset booked=False and bookings_count=0 for all imported records.",
        )

    def handle(self, *args, **options):
        filepath = options["file"]
        dry_run = options["dry_run"]
        reset_booked = options["reset_booked"]

        if not os.path.isfile(filepath):
            raise CommandError(f"File not found: {filepath}")

        created_count = 0
        updated_count = 0
        skipped_count = 0
        error_count = 0

        self.stdout.write(f"Reading VIPs from: {filepath}")
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN — no changes will be saved."))

        with open(filepath, newline="", encoding="utf-8-sig") as csvfile:
            # Detect delimiter (comma or semicolon)
            sample = csvfile.read(2048)
            csvfile.seek(0)
            try:
                dialect = csv.Sniffer().sniff(sample, delimiters=",;\t")
                csvfile.seek(0)
                reader = csv.DictReader(csvfile, dialect=dialect)
            except csv.Error:
                # If sniffer fails, use default comma delimiter
                csvfile.seek(0)
                reader = csv.DictReader(csvfile)

            # Normalize column names to lowercase, strip whitespace
            if reader.fieldnames is None:
                raise CommandError("CSV file appears to be empty or has no header row.")

            reader.fieldnames = [f.strip().lower() for f in reader.fieldnames]

            if "phone" not in reader.fieldnames and "mobile" not in reader.fieldnames:
                raise CommandError(
                    f"CSV must contain a 'phone' or 'mobile' column. Found: {reader.fieldnames}"
                )

            for row_num, row in enumerate(reader, start=2):
                raw_phone = (row.get("phone") or row.get("mobile") or "").strip()
                full_name = (row.get("full_name") or row.get("name") or "").strip()

                if not raw_phone:
                    self.stdout.write(
                        self.style.WARNING(f"  Row {row_num}: empty phone, skipping.")
                    )
                    skipped_count += 1
                    continue

                normalized = normalize_phone(raw_phone)
                if not normalized:
                    self.stdout.write(
                        self.style.ERROR(
                            f"  Row {row_num}: cannot normalize '{raw_phone}', skipping."
                        )
                    )
                    error_count += 1
                    continue

                if dry_run:
                    self.stdout.write(f"  [DRY] Would import: {normalized} ({full_name})")
                    created_count += 1
                    continue

                try:
                    obj, created = VIPPhone.objects.get_or_create(
                        phone=normalized,
                        defaults={"full_name": full_name},
                    )

                    if created:
                        created_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(f"  Created: {normalized} ({full_name})")
                        )
                    else:
                        # Update name if it was blank
                        changed = False
                        if full_name and not obj.full_name:
                            obj.full_name = full_name
                            changed = True
                        if reset_booked:
                            obj.booked = False
                            obj.bookings_count = 0
                            changed = True
                        if changed:
                            obj.save()
                            updated_count += 1
                            self.stdout.write(f"  Updated: {normalized}")
                        else:
                            skipped_count += 1
                            self.stdout.write(f"  Skipped (exists): {normalized}")

                except Exception as exc:
                    logger.exception("Error importing row %s: %s", row_num, exc)
                    error_count += 1
                    self.stdout.write(
                        self.style.ERROR(f"  Row {row_num}: error — {exc}")
                    )

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                f"Import complete: {created_count} created, "
                f"{updated_count} updated, "
                f"{skipped_count} skipped, "
                f"{error_count} errors."
            )
        )
