# Test credentials

## API login field names

`POST /auth` expects:

```json
{
  "email_or_name": "your_username_or_email",
  "password": "your_password"
}
```

Not `username` — the API returns a validation error if `email_or_name` is missing.

## Dev mock (UI development without API)

When `VITE_DEV_MOCK_AUTH=true` in `.env`:

| Field | Value |
|-------|-------|
| email_or_name | `demo` |
| password | `demo` |

This only unlocks the portal UI locally. No live data is loaded until real credentials work.

## Real API test accounts

New signups via `POST /registration/create` are **pending approval** and cannot log in until an admin approves them.

Registrations created during setup (ask admin to approve):

| Signup ID | Username pattern |
|-----------|------------------|
| 22 | `portal_dev_*` (first attempt) |
| 23 | `portal_dev_1779393046110` |

After approval, set in `.env`:

```
VITE_DEV_MOCK_AUTH=false
VITE_TEST_EMAIL_OR_NAME=<approved_username>
VITE_TEST_PASSWORD=PortalTest2025!
```

## Production client credentials

Ask the project owner for an **existing approved client** username/email and password. Place them in `.env` (never commit `.env`).
