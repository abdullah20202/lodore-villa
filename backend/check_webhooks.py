#!/usr/bin/env python3
"""
Check Calendly webhook subscriptions
"""
import requests

CALENDLY_TOKEN = "eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzcyMjM1OTcwLCJqdGkiOiIzNWI4MGUzNi05NmExLTRkMWQtYTZjOS1hZWQwMjg1Zjc0NzQiLCJ1c2VyX3V1aWQiOiIwYmJmZGEzNC1kMzUzLTQ1ZjYtYjM4ZC0xZmMwMDA3ZDI2NTEifQ.KhwuUp3FiWXeQgF_wnyGONRITOeLAHcnafvejalRKvcimHaaqliccfkppFM2-m6X0xyj7iUWNnWp4Jf5WJ7WYA"

def get_user():
    """Get current Calendly user"""
    headers = {
        "Authorization": f"Bearer {CALENDLY_TOKEN}",
        "Content-Type": "application/json"
    }
    response = requests.get("https://api.calendly.com/users/me", headers=headers)
    response.raise_for_status()
    return response.json()

def get_webhooks(organization_uri):
    """Get all webhook subscriptions for organization"""
    headers = {
        "Authorization": f"Bearer {CALENDLY_TOKEN}",
        "Content-Type": "application/json"
    }

    response = requests.get(
        f"https://api.calendly.com/webhook_subscriptions?organization={organization_uri}&scope=organization",
        headers=headers
    )
    response.raise_for_status()
    return response.json()

def main():
    print("=" * 80)
    print("Checking Calendly Webhook Subscriptions")
    print("=" * 80)

    # Get user and organization
    user_data = get_user()
    user_uri = user_data["resource"]["uri"]
    org_uri = user_data["resource"]["current_organization"]

    print(f"\nUser: {user_data['resource']['name']}")
    print(f"Email: {user_data['resource']['email']}")
    print(f"Organization: {org_uri}")

    # Get webhooks
    print("\n" + "=" * 80)
    print("Webhook Subscriptions")
    print("=" * 80)

    webhooks_data = get_webhooks(org_uri)
    webhooks = webhooks_data.get("collection", [])

    if not webhooks:
        print("\n⚠️  NO WEBHOOKS CONFIGURED!")
        print("\nYou need to create a webhook subscription in Calendly.")
        print("\nWebhook URL should be: https://villa.lodore.com/api/calendly/webhook")
    else:
        for webhook in webhooks:
            print(f"\nWebhook ID: {webhook.get('uri', 'N/A')}")
            print(f"URL: {webhook.get('callback_url', 'N/A')}")
            print(f"State: {webhook.get('state', 'N/A')}")
            print(f"Events: {', '.join(webhook.get('events', []))}")
            print(f"Scope: {webhook.get('scope', 'N/A')}")
            print(f"Created: {webhook.get('created_at', 'N/A')}")

    print(f"\nTotal webhooks: {len(webhooks)}")

if __name__ == "__main__":
    main()
