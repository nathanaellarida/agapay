# Security Policy

## Reporting a vulnerability

Please report vulnerabilities privately through this repository's GitHub
Security Advisories page. Do not open a public issue for suspected security
problems or include credentials, personal data, or exploit details in one.

Include the affected component, reproduction steps, potential impact, and any
suggested mitigation. Maintainers should rotate any exposed credential before
investigating further.

## Supported version

Security fixes are applied to the latest commit on the default branch.

## Deployment boundary

The included development servers bind to loopback interfaces and are intended
for local development. A public deployment must add production authentication,
TLS, request-rate limits, request-size limits, and a trusted reverse proxy. API
keys must remain server-side and must never be placed in frontend environment
variables, source files, logs, issues, or commits.
