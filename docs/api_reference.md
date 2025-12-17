# API Reference

## Authentication

### POST /api/v1/auth/register
Register a new user.

### POST /api/v1/auth/login
Login and receive access token.

### GET /api/v1/auth/me
Get current user information.

## Scans

### POST /api/v1/scans
Create a new scan.

### GET /api/v1/scans
List all scans.

### GET /api/v1/scans/{id}
Get scan details.

### POST /api/v1/scans/{id}/cancel
Cancel a running scan.

## Reports

### GET /api/v1/reports/{scan_id}/json
Get JSON report.

### GET /api/v1/reports/{scan_id}/pdf/download
Download PDF report.

## Compliance

### GET /api/v1/compliance/{scan_id}/summary
Get compliance summary.

### GET /api/v1/compliance/{scan_id}/mappings
Get compliance mappings.

