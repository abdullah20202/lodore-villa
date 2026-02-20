# لودور فيلا — Lodore Villa VIP Booking System

A production-ready VIP phone verification + Calendly booking system for an exclusive Ramadan event.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Docker Compose                  │
│                                                  │
│  ┌──────────┐   ┌──────────────┐   ┌──────────┐ │
│  │ postgres │   │   backend    │   │ frontend │ │
│  │  :5432   │◄──│  Django/DRF  │   │  React   │ │
│  │          │   │   :8000      │◄──│  Vite    │ │
│  └──────────┘   └──────────────┘   │  :5173   │ │
│                        ▲           └──────────┘ │
│                        │ webhooks                │
│                   Calendly / Unifonic            │
└─────────────────────────────────────────────────┘
```

**User Flow:**
```
/verify → (phone check + OTP sent) → /otp → (OTP verified + JWT issued) → /book (Calendly embed)
                                       ↓
                                    /sorry (not eligible)
```

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) + [Docker Compose](https://docs.docker.com/compose/)
- [Unifonic account](https://www.unifonic.com/) (Verify API)
- [Calendly account](https://calendly.com/) with an event URL

---

## Quick Start (One Command)

### 1. Clone and configure

```bash
git clone <your-repo>
cd lodore-villa

# Backend config
cp backend/.env.example backend/.env
# Edit backend/.env and fill in:
#   DJANGO_SECRET_KEY, UNIFONIC_APP_SID, CALENDLY_WEBHOOK_SECRET, etc.

# Frontend config
cp frontend/.env.example frontend/.env
# Edit frontend/.env and fill in:
#   VITE_CALENDLY_EVENT_URL=https://calendly.com/your-username/your-event
```

### 2. Start everything

```bash
docker compose up --build
```

This starts:
- **PostgreSQL** on port `5432`
- **Django backend** on `http://localhost:8000` (auto-migrates)
- **React frontend** on `http://localhost:5173`

### 3. Create a superuser (Django Admin)

```bash
docker compose exec backend python manage.py createsuperuser
```

Then visit `http://localhost:8000/admin`

---

## Import VIP Phone Numbers

Prepare a CSV file with at minimum a `phone` column:

```csv
phone,full_name
0512345678,محمد علي
9665xxxxxxxx,سارة أحمد
+966512345679,عبدالله محمد
5598765432,خالد عمر
```

Place it in the `data/` folder and run:

```bash
# Import from within the running container
docker compose exec backend python manage.py import_vips --file /data/vips.csv

# Dry run (validate without saving)
docker compose exec backend python manage.py import_vips --file /data/vips.csv --dry-run

# Reset booked status for all imported phones
docker compose exec backend python manage.py import_vips --file /data/vips.csv --reset-booked
```

---

## API Reference

Base URL: `http://localhost:8000`

### POST `/api/auth/request-otp`

Request an OTP for a phone number.

```json
// Request
{ "phone": "0512345678" }

// Response 200 (VIP + not booked)
{ "ok": true, "requestId": "unifonic-ref-id" }

// Response 403 (not eligible — generic, no VIP leak)
{ "ok": false, "message": "عذراً..." }

// Response 429 (resend cooldown)
{ "ok": false, "cooldownRemaining": 45 }
```

### POST `/api/auth/verify-otp`

Verify the OTP code, get JWT tokens.

```json
// Request
{ "phone": "0512345678", "requestId": "unifonic-ref-id", "code": "1234" }

// Response 200
{ "ok": true, "access": "eyJ...", "refresh": "eyJ..." }

// Response 400 (wrong code)
{ "ok": false, "message": "...", "attemptsRemaining": 4 }
```

### POST `/api/auth/token/refresh`

```json
// Request
{ "refresh": "eyJ..." }

// Response 200
{ "ok": true, "access": "eyJ...", "refresh": "eyJ..." }
```

### GET `/api/auth/me`

Requires `Authorization: Bearer <access_token>`

```json
// Response 200
{ "ok": true, "phone": "0512345678" }
```

### POST `/api/calendly/webhook`

Requires `X-Webhook-Secret: <CALENDLY_WEBHOOK_SECRET>`

```json
// Response 200
{ "received": true }
```

---

## Testing with Postman

### Setup

1. Open Postman
2. Import **both** files from the `/postman` folder:
   - `LodoreVilla.postman_collection.json`
   - `LodoreVilla.postman_environment.json`
3. Select the **"Lodore Villa Local"** environment
4. Set `phone` to a VIP number that exists in your database

### Test Flow (in order)

| # | Request | What to do |
|---|---------|-----------|
| 1 | **Request OTP** | Run it. `requestId` is auto-saved to env. |
| 2 | **Verify OTP** | Check your phone for the SMS, set `otp_code` in env, then run. `access_token` + `refresh_token` auto-saved. |
| 3 | **Me (Protected)** | Run immediately — uses saved `access_token`. |
| 4 | **Refresh Token** | Run to get a new access token from refresh. |
| 5 | **Calendly Webhook** | Run to simulate a booking. Check the Django admin for the BookingLog and updated VIPPhone. |

> **Tip:** All test scripts automatically save tokens to environment variables. No manual copy-paste needed after step 2.

---

## Calendly Setup

### 1. Create your event

Create a one-on-one event at `calendly.com` and copy the event URL.

### 2. Set env variable

```
VITE_CALENDLY_EVENT_URL=https://calendly.com/your-username/your-event
```

### 3. Add a phone question (optional but recommended)

In Calendly → Event → Invitee Questions → Add "Phone Number" question.
This allows the webhook to extract the phone and mark VIPs as booked.

### 4. Create the webhook

In Calendly Developer settings → Webhooks:
- URL: `https://your-domain.com/api/calendly/webhook`
- Events: `invitee.created`, `invitee.canceled`
- Add a signing secret that matches `CALENDLY_WEBHOOK_SECRET` in your `.env`

---

## Security Notes

| Feature | Implementation |
|---------|---------------|
| VIP enumeration prevention | All `request-otp` failures return identical generic messages |
| Rate limiting | 3 OTP requests / phone / 10 min; 5 verify attempts max |
| JWT storage | localStorage (fast, XSS-risk noted). For HttpOnly cookies: add a Set-Cookie backend endpoint and use `withCredentials: true` in axios |
| CORS | Restricted to `FRONTEND_ORIGIN` only |
| Webhook auth | Shared secret header `X-Webhook-Secret` (or HMAC-SHA256 via `CALENDLY_WEBHOOK_SIGNING_KEY`) |
| Secrets | All credentials in env vars only, never in code |

---

## Project Structure

```
lodore-villa/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   ├── manage.py
│   └── lodore/
│       ├── settings.py          # Django settings + JWT config
│       ├── urls.py              # Root URL routing
│       ├── wsgi.py
│       ├── auth_app/
│       │   ├── models.py        # VIPPhone, OTPRequest
│       │   ├── views.py         # request-otp, verify-otp, me, refresh
│       │   ├── serializers.py
│       │   ├── unifonic.py      # Unifonic Verify API wrapper
│       │   ├── authentication.py # Custom JWT auth (phone-based, no Django User)
│       │   ├── jwt_backend.py   # Token generation
│       │   ├── throttles.py     # Rate limiting per phone
│       │   ├── utils.py         # Phone normalization
│       │   └── urls.py
│       ├── calendly_app/
│       │   ├── models.py        # BookingLog
│       │   ├── views.py         # Webhook handler
│       │   └── urls.py
│       └── management/commands/
│           └── import_vips.py   # CSV import command
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── .env.example
│   └── src/
│       ├── App.jsx              # Router + routes
│       ├── api/
│       │   ├── client.js        # Axios + token refresh interceptor
│       │   └── auth.js          # API call functions
│       ├── components/
│       │   ├── ProtectedRoute.jsx
│       │   ├── CalendlyEmbed.jsx
│       │   └── Logo.jsx
│       └── pages/
│           ├── VerifyPage.jsx   # /verify
│           ├── OTPPage.jsx      # /otp
│           ├── BookPage.jsx     # /book (protected)
│           └── SorryPage.jsx    # /sorry
├── postman/
│   ├── LodoreVilla.postman_collection.json
│   └── LodoreVilla.postman_environment.json
├── data/
│   └── vips.csv                 # Sample VIP CSV
├── docker-compose.yml
└── .gitignore
```

---

## Phone Number Formats Supported

| Input | Normalized |
|-------|-----------|
| `05XXXXXXXX` | `05XXXXXXXX` ✓ |
| `5XXXXXXXX` | `05XXXXXXXX` ✓ |
| `9665XXXXXXXX` | `05XXXXXXXX` ✓ |
| `+9665XXXXXXXX` | `05XXXXXXXX` ✓ |

---

## Development Commands

```bash
# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Run migrations manually
docker compose exec backend python manage.py migrate

# Django shell
docker compose exec backend python manage.py shell

# Import VIPs
docker compose exec backend python manage.py import_vips --file /data/vips.csv

# Stop everything
docker compose down

# Stop + remove volumes (wipes DB)
docker compose down -v
```

---

## JWT Token Info

| Token | Lifetime | Storage |
|-------|----------|---------|
| Access | 15 minutes | localStorage |
| Refresh | 7 days | localStorage |

The frontend auto-refreshes the access token on 401 responses using the refresh token. If the refresh also fails, the user is redirected to `/verify`.
