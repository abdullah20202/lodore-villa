#!/usr/bin/env python3
"""
Clean up duplicate BookingLog records
Find records with same calendly_event_uri but different event_type (created vs canceled)
Keep only the canceled one, delete the scheduled one
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lodore.settings')
django.setup()

from lodore.calendly_app.models import BookingLog
from collections import defaultdict

def cleanup_duplicates():
    print("=" * 80)
    print("Cleaning up duplicate BookingLog records")
    print("=" * 80)

    # Get all Calendly records
    all_records = BookingLog.objects.filter(provider=BookingLog.PROVIDER_CALENDLY).order_by('calendly_event_uri', '-received_at')

    # Group by calendly_event_uri
    uri_groups = defaultdict(list)
    for record in all_records:
        if record.calendly_event_uri:
            uri_groups[record.calendly_event_uri].append(record)

    # Find duplicates
    duplicates_found = 0
    records_to_delete = []

    for uri, records in uri_groups.items():
        if len(records) > 1:
            duplicates_found += 1
            print(f"\nDuplicate found for URI: {uri}")
            for record in records:
                print(f"  ID {record.id}: {record.event_type} - {record.status} - {record.guest_name} - {record.phone}")

            # Keep the most recent one (or the canceled one if exists)
            canceled_records = [r for r in records if r.status == BookingLog.STATUS_CANCELED]
            if canceled_records:
                # Keep the canceled record, delete the others
                keep_record = canceled_records[0]
                delete_records = [r for r in records if r.id != keep_record.id]
            else:
                # Keep the most recent, delete the others
                keep_record = records[0]
                delete_records = records[1:]

            print(f"  → Keeping ID {keep_record.id} ({keep_record.event_type} - {keep_record.status})")
            for record in delete_records:
                print(f"  → Deleting ID {record.id} ({record.event_type} - {record.status})")
                records_to_delete.append(record)

    # Ask for confirmation
    if records_to_delete:
        print(f"\n{'-' * 80}")
        print(f"Found {duplicates_found} duplicate groups")
        print(f"Will delete {len(records_to_delete)} duplicate records")
        print(f"{'-' * 80}")

        # Delete the duplicates
        for record in records_to_delete:
            record.delete()
            print(f"✓ Deleted ID {record.id}")

        print(f"\n✓ Cleanup completed!")
        print(f"   Deleted {len(records_to_delete)} duplicate records")
    else:
        print("\n✓ No duplicates found!")

    print(f"\nTotal BookingLog records: {BookingLog.objects.count()}")
    print(f"Calendly records: {BookingLog.objects.filter(provider=BookingLog.PROVIDER_CALENDLY).count()}")

if __name__ == "__main__":
    cleanup_duplicates()
