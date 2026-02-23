#!/usr/bin/env python
"""
Import VIP customers from CSV file to database
Usage: python import_vip_customers.py
"""
import os
import sys
import django
import csv

# Setup Django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lodore.settings')
django.setup()

from lodore.auth_app.models import VIPPhone

def import_vip_customers():
    """Import VIP customers from vip_customers2.csv"""
    csv_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'vip_customers2.csv')

    if not os.path.exists(csv_file):
        print(f"❌ File not found: {csv_file}")
        return

    print(f"📂 Reading from: {csv_file}\n")

    added = 0
    updated = 0
    skipped = 0

    with open(csv_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)

        for row in reader:
            phone = row['Phone'].strip()
            name = row['Name'].strip()

            if not phone:
                continue

            # Check if phone already exists
            existing = VIPPhone.objects.filter(phone=phone).first()

            if existing:
                # Update the name if it's different
                if existing.full_name != name:
                    existing.full_name = name
                    existing.save()
                    print(f"✏️  Updated: {phone} - {name}")
                    updated += 1
                else:
                    print(f"⏭️  Skipped (exists): {phone} - {name}")
                    skipped += 1
            else:
                # Create new entry
                VIPPhone.objects.create(
                    phone=phone,
                    full_name=name,
                    booked=False
                )
                print(f"✅ Added: {phone} - {name}")
                added += 1

    print(f"\n{'='*60}")
    print(f"📊 Summary:")
    print(f"   ✅ Added: {added}")
    print(f"   ✏️  Updated: {updated}")
    print(f"   ⏭️  Skipped: {skipped}")
    print(f"   📝 Total in CSV: {added + updated + skipped}")
    print(f"   💾 Total in DB: {VIPPhone.objects.count()}")
    print(f"{'='*60}\n")

if __name__ == '__main__':
    print("🚀 Starting VIP Customers Import...\n")
    import_vip_customers()
    print("✨ Import completed!")
