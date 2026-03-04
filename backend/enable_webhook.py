#!/usr/bin/env python3
"""
Enable Calendly webhook subscription
"""
import requests

CALENDLY_TOKEN = "eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzcyMjM1OTcwLCJqdGkiOiIzNWI4MGUzNi05NmExLTRkMWQtYTZjOS1hZWQwMjg1Zjc0NzQiLCJ1c2VyX3V1aWQiOiIwYmJmZGEzNC1kMzUzLTQ1ZjYtYjM4ZC0xZmMwMDA3ZDI2NTEifQ.KhwuUp3FiWXeQgF_wnyGONRITOeLAHcnafvejalRKvcimHaaqliccfkppFM2-m6X0xyj7iUWNnWp4Jf5WJ7WYA"

WEBHOOK_URI = "https://api.calendly.com/webhook_subscriptions/2c680791-d8c7-4a46-baa4-43063b59ab7b"

def enable_webhook():
    """Enable webhook subscription"""
    headers = {
        "Authorization": f"Bearer {CALENDLY_TOKEN}",
        "Content-Type": "application/json"
    }

    # Get webhook UUID from URI
    webhook_uuid = WEBHOOK_URI.split("/")[-1]

    print("=" * 80)
    print("Enabling Calendly Webhook")
    print("=" * 80)
    print(f"\nWebhook UUID: {webhook_uuid}")

    # Delete and recreate the webhook (Calendly doesn't have enable/disable API)
    # First, delete the old one
    print("\n1. Deleting disabled webhook...")
    delete_response = requests.delete(WEBHOOK_URI, headers=headers)

    if delete_response.status_code == 204:
        print("   ✓ Deleted successfully")
    else:
        print(f"   ⚠ Delete failed: {delete_response.status_code}")
        print(f"   Response: {delete_response.text}")

    # Get organization URI
    print("\n2. Getting organization info...")
    user_response = requests.get("https://api.calendly.com/users/me", headers=headers)
    user_response.raise_for_status()
    org_uri = user_response.json()["resource"]["current_organization"]
    print(f"   Organization: {org_uri}")

    # Create new webhook
    print("\n3. Creating new webhook subscription...")
    webhook_data = {
        "url": "https://villa.lodore.com/api/calendly/webhook",
        "events": [
            "invitee.created",
            "invitee.canceled"
        ],
        "organization": org_uri,
        "scope": "organization"
    }

    create_response = requests.post(
        "https://api.calendly.com/webhook_subscriptions",
        headers=headers,
        json=webhook_data
    )

    if create_response.status_code == 201:
        webhook = create_response.json()["resource"]
        print("   ✓ Webhook created successfully!")
        print(f"\n   ID: {webhook['uri']}")
        print(f"   URL: {webhook['callback_url']}")
        print(f"   State: {webhook['state']}")
        print(f"   Events: {', '.join(webhook['events'])}")
    else:
        print(f"   ✗ Creation failed: {create_response.status_code}")
        print(f"   Response: {create_response.text}")

    print("\n" + "=" * 80)
    print("Done!")
    print("=" * 80)

if __name__ == "__main__":
    enable_webhook()
