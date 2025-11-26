# API Error Codes

This document lists structured error codes returned by the server for client teams to handle consistently.

All error responses use the shape:

```json
{
  "success": false,
  "error": "Human readable message",
  "code": "ERROR_CODE",
  // optional
  "fields": ["field1", "field2"]
}
```

Common customer auth error codes

- `MISSING_FIELDS` (400)
  - Description: One or more required fields are missing from the request body.
  - Example: `{ code: "MISSING_FIELDS", fields: ["phone"] }`

- `INVALID_PHONE` (400)
  - Description: Phone format failed validation.

- `DEVICE_BANNED` (403)
  - Description: The request originates from a device that is banned for fraud.

- `PHONE_REGISTERED` (409)
  - Description: Attempting to create an account with a phone that already exists.

- `DEVICE_LINKED` (403)
  - Description: A device is already linked to another account.

- `CUSTOMER_NOT_FOUND` (404)
  - Description: No customer account found for provided phone.

- `INVALID_CREDENTIALS` (401)
  - Description: Password or credentials are invalid.

- `ACCOUNT_INCOMPLETE` (500)
  - Description: Defensive server-side check — a customer record is missing required fields (phone). This indicates a data integrity issue.

If you need this file mirrored into admin UI docs or the client repo, tell me where to add it and I will create/update the relevant file(s).
