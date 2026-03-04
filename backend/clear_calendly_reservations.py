#!/usr/bin/env python3
"""
Clear all Calendly reservations from the database
Run with: docker compose exec -T backend python /app/clear_calendly_reservations.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lodore.settings')
django.setup()

from lodore.calendly_app.models import BookingLog
from lodore.auth_app.models import VIPPhone

def clear_calendly_data():
    print("=" * 80)
    print("Clearing Calendly Reservations from Database")
    print("=" * 80)

    # Count existing records
    booking_count = BookingLog.objects.filter(provider='calendly').count()

    print(f"\nFound {booking_count} Calendly reservations in database")

    if booking_count == 0:
        print("No Calendly reservations to clear!")
        return

    # Ask for confirmation
    print("\n⚠️  WARNING: This will delete all Calendly booking logs!")
    print("VIP phone records will NOT be deleted, only booking logs.")
    response = input("\nType 'yes' to confirm deletion: ")

    if response.lower() != 'yes':
        print("Cancelled. No data was deleted.")
        return

    # Delete all Calendly booking logs
    deleted_count, _ = BookingLog.objects.filter(provider='calendly').delete()

    print(f"\n✓ Deleted {deleted_count} Calendly reservations")
    print(f"✓ Remaining booking logs: {BookingLog.objects.count()}")
    print(f"✓ Total VIP customers: {VIPPhone.objects.count()}")

    print("\n" + "=" * 80)
    print("Calendly reservations cleared successfully!")
    print("=" * 80)
    print("\nNext steps:")
    print("1. Run sync_calendly.py to fetch fresh data from Calendly")
    print("2. Run import_calendly_data.py to import the data into database")

if __name__ == '__main__':
    clear_calendly_data()
