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

def import_vip_customers(csv_filename='vip_customers2.csv'):
    """Import VIP customers from CSV file"""
    csv_file = os.path.join(os.path.dirname(__file__), '..', 'data', csv_filename)

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
            # Get name if exists, otherwise use empty string
            name = row.get('Name', '').strip() if row.get('Name') else ''

            # Add leading 0 if not present
            if phone and not phone.startswith('0'):
                phone = '0' + phone

            if not phone:
                continue

            # Check if phone already exists
            existing = VIPPhone.objects.filter(phone=phone).first()

            if existing:
                # Update the name if provided and different
                if name and existing.full_name != name:
                    existing.full_name = name
                    existing.save()
                    print(f"✏️  Updated: {phone} - {name}")
                    updated += 1
                else:
                    display_name = existing.full_name or phone
                    print(f"⏭️  Skipped (exists): {phone} - {display_name}")
                    skipped += 1
            else:
                # Create new entry
                VIPPhone.objects.create(
                    phone=phone,
                    full_name=name,
                    booked=False
                )
                display_name = name if name else phone
                print(f"✅ Added: {phone} - {display_name}")
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

    # Get CSV filename from command line argument, or use default
    csv_filename = sys.argv[1] if len(sys.argv) > 1 else 'vip_customers2.csv'

    import_vip_customers(csv_filename)
    print("✨ Import completed!")
