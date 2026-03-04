#!/usr/bin/env python3
"""
Sync all Calendly scheduled events to the database

This script:
1. DELETES all existing Calendly BookingLog records
2. Fetches fresh data from Calendly API
3. Imports directly into Django database
"""
import os
import sys
import django
import requests
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lodore.settings')
django.setup()

from lodore.calendly_app.models import BookingLog
from lodore.auth_app.models import VIPPhone
from lodore.auth_app.utils import normalize_phone

CALENDLY_TOKEN = "eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzcyMjM1OTcwLCJqdGkiOiIzNWI4MGUzNi05NmExLTRkMWQtYTZjOS1hZWQwMjg1Zjc0NzQiLCJ1c2VyX3V1aWQiOiIwYmJmZGEzNC1kMzUzLTQ1ZjYtYjM4ZC0xZmMwMDA3ZDI2NTEifQ.KhwuUp3FiWXeQgF_wnyGONRITOeLAHcnafvejalRKvcimHaaqliccfkppFM2-m6X0xyj7iUWNnWp4Jf5WJ7WYA"

def get_calendly_user():
    """Get current Calendly user"""
    headers = {
        "Authorization": f"Bearer {CALENDLY_TOKEN}",
        "Content-Type": "application/json"
    }

    response = requests.get("https://api.calendly.com/users/me", headers=headers)
    response.raise_for_status()
    return response.json()

def get_scheduled_events(user_uri, max_results=100):
    """Fetch all scheduled events for a user"""
    headers = {
        "Authorization": f"Bearer {CALENDLY_TOKEN}",
        "Content-Type": "application/json"
    }

    all_events = []
    next_page = f"https://api.calendly.com/scheduled_events?user={user_uri}&count={max_results}&status=active"

    while next_page:
        print(f"Fetching: {next_page}")
        response = requests.get(next_page, headers=headers)
        response.raise_for_status()
        data = response.json()

        all_events.extend(data.get("collection", []))

        # Get next page
        pagination = data.get("pagination", {})
        next_page = pagination.get("next_page_token")
        if next_page:
            next_page = f"https://api.calendly.com/scheduled_events?user={user_uri}&count={max_results}&page_token={next_page}&status=active"

        print(f"  Fetched {len(data.get('collection', []))} events, total so far: {len(all_events)}")

    return all_events

def get_event_invitees(event_uri):
    """Get invitees for a specific event"""
    headers = {
        "Authorization": f"Bearer {CALENDLY_TOKEN}",
        "Content-Type": "application/json"
    }

    response = requests.get(f"{event_uri}/invitees", headers=headers)
    response.raise_for_status()
    data = response.json()

    return data.get("collection", [])

def extract_phone_from_invitee(invitee):
    """Extract phone from invitee data"""
    # Try questions_and_answers
    qa = invitee.get("questions_and_answers", [])
    for q in qa:
        question = q.get("question", "").lower()
        answer = q.get("answer", "")
        if "phone" in question or "mobile" in question or "جوال" in question or "هاتف" in question:
            phone = normalize_phone(answer)
            if phone:
                return phone

    # Try tracking.utm_content
    tracking = invitee.get("tracking", {})
    utm_content = tracking.get("utm_content", "")
    if utm_content:
        phone = normalize_phone(utm_content)
        if phone:
            return phone

    return ""

def main():
    print("=" * 80)
    print("Calendly Reservation Sync Script")
    print("=" * 80)

    # STEP 1: Delete existing Calendly records
    print("\n1. Deleting existing Calendly BookingLog records...")
    deleted_count = BookingLog.objects.filter(provider=BookingLog.PROVIDER_CALENDLY).delete()[0]
    print(f"   Deleted {deleted_count} existing Calendly records")

    # STEP 2: Get user info
    print("\n2. Fetching Calendly user information...")
    user_data = get_calendly_user()
    user_uri = user_data["resource"]["uri"]
    user_name = user_data["resource"]["name"]
    user_email = user_data["resource"]["email"]

    print(f"   User: {user_name} ({user_email})")
    print(f"   URI: {user_uri}")

    # STEP 3: Get all scheduled events
    print("\n3. Fetching all scheduled events from Calendly...")
    events = get_scheduled_events(user_uri)
    print(f"   Found {len(events)} scheduled events")

    # STEP 4: Process each event and import to database
    print("\n4. Processing events and importing to database...")
    stats = {
        "events_processed": 0,
        "invitees_found": 0,
        "bookings_created": 0,
        "vips_updated": 0,
        "errors": []
    }

    for event in events:
        stats["events_processed"] += 1
        event_name = event.get("name", "Unknown")
        event_start = event.get("start_time", "")
        event_status = event.get("status", "")
        event_uri = event.get("uri", "")

        print(f"\n   Event: {event_name}")
        print(f"   Start: {event_start}")
        print(f"   Status: {event_status}")

        # Parse scheduled time
        scheduled_at = None
        if event_start:
            try:
                scheduled_at = datetime.fromisoformat(event_start.replace('Z', '+00:00'))
            except Exception as e:
                print(f"   Warning: Failed to parse time: {e}")

        # Get invitees for this event
        try:
            invitees = get_event_invitees(event_uri)
            print(f"   Invitees: {len(invitees)}")

            for invitee in invitees:
                stats["invitees_found"] += 1

                invitee_name = invitee.get("name", "")
                invitee_email = invitee.get("email", "")
                invitee_uri = invitee.get("uri", "")
                invitee_status = invitee.get("status", "")

                # Extract phone
                phone = extract_phone_from_invitee(invitee)

                # Determine booking status
                if invitee_status == "canceled":
                    booking_status = BookingLog.STATUS_CANCELED
                    event_type = "invitee.canceled"
                else:
                    booking_status = BookingLog.STATUS_SCHEDULED
                    event_type = "invitee.created"

                # Create BookingLog entry
                try:
                    booking = BookingLog.objects.create(
                        provider=BookingLog.PROVIDER_CALENDLY,
                        event_type=event_type,
                        calendly_event_uri=invitee_uri,
                        payload={
                            "event": {
                                "name": event_name,
                                "uri": event_uri,
                                "start_time": event_start,
                                "status": event_status,
                            },
                            "invitee": invitee,
                        },
                        phone=phone or "",
                        guest_name=invitee_name,
                        guest_email=invitee_email,
                        scheduled_at=scheduled_at,
                        status=booking_status,
                    )
                    stats["bookings_created"] += 1
                    print(f"      ✓ {invitee_name} ({phone or 'no phone'}) [{invitee_status}]")

                    # Update VIP if phone exists and booking is active
                    if phone and event_type == "invitee.created":
                        try:
                            vip, created = VIPPhone.objects.update_or_create(
                                phone=phone,
                                defaults={
                                    'full_name': invitee_name or '',
                                    'email': invitee_email or '',
                                    'booked': True,
                                }
                            )
                            # Increment bookings_count
                            if not created:
                                vip.bookings_count = max(1, vip.bookings_count)
                                vip.save(update_fields=['bookings_count'])
                            else:
                                vip.bookings_count = 1
                                vip.save(update_fields=['bookings_count'])

                            stats["vips_updated"] += 1
                            action = "Created" if created else "Updated"
                            print(f"        → {action} VIP: {phone}")
                        except Exception as e:
                            print(f"        ! VIP update failed: {e}")

                except Exception as e:
                    error_msg = f"Failed to create booking for {invitee_name}: {str(e)}"
                    print(f"      ✗ {error_msg}")
                    stats["errors"].append(error_msg)

        except Exception as e:
            error_msg = f"Failed to get invitees for event {event_name}: {str(e)}"
            print(f"   ERROR: {error_msg}")
            stats["errors"].append(error_msg)

    # Summary
    print("\n" + "=" * 80)
    print("SYNC SUMMARY")
    print("=" * 80)
    print(f"Old records deleted: {deleted_count}")
    print(f"Events processed: {stats['events_processed']}")
    print(f"Invitees found: {stats['invitees_found']}")
    print(f"Bookings created: {stats['bookings_created']}")
    print(f"VIPs updated: {stats['vips_updated']}")
    print(f"Errors: {len(stats['errors'])}")

    if stats["errors"]:
        print("\nErrors:")
        for error in stats["errors"]:
            print(f"  - {error}")

    print(f"\nTotal BookingLog records in DB: {BookingLog.objects.count()}")
    print(f"Total Calendly records: {BookingLog.objects.filter(provider=BookingLog.PROVIDER_CALENDLY).count()}")
    print(f"Total VIP customers: {VIPPhone.objects.count()}")
    print("\n✓ Sync completed!")

if __name__ == "__main__":
    main()
