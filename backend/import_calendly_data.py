#!/usr/bin/env python3
"""
Import Calendly sync data into Django database
Run with: docker compose exec -T backend python manage.py shell < import_calendly_data.py
"""
import json
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lodore.settings')
django.setup()

from lodore.calendly_app.models import BookingLog
from lodore.auth_app.models import VIPPhone
from datetime import datetime

def import_calendly_data():
    # Load the synced data
    with open('/tmp/calendly_sync_data.json', 'r') as f:
        data = json.load(f)

    print("=" * 80)
    print("Importing Calendly Data into Database")
    print("=" * 80)

    created_count = 0
    updated_count = 0
    skipped_count = 0
    vip_created = 0
    vip_updated = 0

    for invitee in data['to_add']:
        event_uri = invitee['event_uri']
        invitee_uri = invitee['invitee_uri']
        invitee_name = invitee['invitee_name']
        invitee_email = invitee['invitee_email']
        invitee_phone = invitee['invitee_phone']
        invitee_status = invitee['invitee_status']
        scheduled_at_str = invitee['scheduled_at']

        # Parse scheduled time
        try:
            scheduled_at = datetime.fromisoformat(scheduled_at_str.replace('Z', '+00:00'))
        except:
            scheduled_at = None

        # Determine event type and status
        if invitee_status == 'canceled':
            event_type = 'invitee.canceled'
            status = 'canceled'
        else:
            event_type = 'invitee.created'
            status = 'scheduled'

        # Create or update BookingLog
        try:
            booking, created = BookingLog.objects.update_or_create(
                calendly_event_uri=invitee_uri,
                event_type=event_type,
                defaults={
                    'provider': BookingLog.PROVIDER_CALENDLY,
                    'payload': invitee,  # Store the entire invitee data
                    'phone': invitee_phone or '',
                    'guest_name': invitee_name,
                    'guest_email': invitee_email or '',
                    'scheduled_at': scheduled_at,
                    'status': status,
                }
            )

            if created:
                created_count += 1
                print(f"✓ Created: {invitee_name} ({invitee_phone}) - {scheduled_at}")

                # Create VIP phone if phone exists and status is active
                if invitee_phone and event_type == 'invitee.created':
                    vip, vip_created_flag = VIPPhone.objects.update_or_create(
                        phone=invitee_phone,
                        defaults={
                            'full_name': invitee_name or '',
                            'email': invitee_email or '',
                        }
                    )

                    if vip_created_flag:
                        vip_created += 1
                        print(f"  → Created VIP: {invitee_phone}")
                    else:
                        vip_updated += 1
                        print(f"  → Updated VIP: {invitee_phone}")
            else:
                updated_count += 1
                print(f"- Updated: {invitee_name} ({invitee_phone}) - {scheduled_at}")

        except Exception as e:
            skipped_count += 1
            print(f"✗ Skipped: {invitee_name} - Error: {str(e)}")

    print("\n" + "=" * 80)
    print("IMPORT SUMMARY")
    print("=" * 80)
    print(f"Reservations created: {created_count}")
    print(f"Reservations updated: {updated_count}")
    print(f"Reservations skipped: {skipped_count}")
    print(f"VIP customers created: {vip_created}")
    print(f"VIP customers updated: {vip_updated}")
    print(f"\nTotal in database: {BookingLog.objects.count()} reservations")
    print(f"Total VIP customers: {VIPPhone.objects.count()}")

if __name__ == '__main__':
    import_calendly_data()
