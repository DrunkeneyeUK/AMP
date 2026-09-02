# AMP Operations

An AMP-owned field-service and job-management platform tailored to AMP Fire
and Security. It will eventually replace the parts of Simpro that AMP uses,
without unnecessary enterprise complexity.

> **Status: planning only.** Development is paused while other AMP projects
> are completed. Do not begin substantial development until Dominic
> explicitly asks. Requirements, ideas and planning may still be recorded
> here.

## Priorities

- Professional, intuitive and fast to use
- Designed around AMP's real workflows, not copied from Simpro
- Mobile-first for engineers, with iOS and Android support
- Offline working with safe synchronisation
- One connected platform rather than disconnected apps
- Secure role-based access, audit trails and backups
- Appropriate UK data-protection controls
- No publishing, deployment or live-data migration without Dominic's approval
- Test alongside Simpro before operational replacement

## Branding

Use AMP Fire and Security branding:

- Black, red and white
- Approved AMP shield-and-flame logo
- Tagline: Protect | Prevent | Respond
- Telephone: 03330 540442
- Email: service@amp-fire.co.uk
- Do not advertise fire-extinguisher services

## Users and permissions

Support directors, office staff, engineers, authorised subcontractors and
customers. Administrators must control what each role can view, create,
edit, approve, export and delete. Customers must only access their own
sites and records.

## Core scope

- Customers, contacts and multiple sites
- Site instructions, hazards, documents and communication history
- Fire and security asset registers
- Enquiries, branded quotations, revisions and digital acceptance
- Convert accepted quotes into jobs
- Reactive, planned, installation and remedial jobs
- Scheduling, engineer availability, holidays and conflict warnings
- Push notifications for new or changed work
- Engineer notes, dictation, photos, files and signatures
- Labour, travel, expenses and materials
- Defects, recommendations and follow-on quotations
- Recurring maintenance visits and contract reminders
- Configurable service forms, reports and certificates
- Automatic branded PDF generation and email delivery
- Purchase orders, basic stock and van-stock tracking
- Job invoicing and export/integration with AMP's accounting platform
- Customer portal for jobs, quotes, reports, certificates, assets and
  logbooks
- QR or barcode identification where useful

Support fire alarms, CCTV, access control, intruder alarms and emergency
lighting.

## RAMS and health and safety

Include reusable and job-specific RAMS with:

- Automatic population from customer, site and job records
- Hazards, persons at risk and control measures
- Initial and residual risk scoring
- PPE, tools, access equipment and competency requirements
- COSHH assessments and safety-data-sheet attachments
- Emergency procedures and supporting documents
- Office review and approval
- Customer issue and acceptance tracking
- Version control and audit history
- Branded PDF output
- Engineer acknowledgement and signatures
- Toolbox talks and attendee signatures
- Dynamic on-site risk assessments
- Ability to prevent work starting until mandatory RAMS are acknowledged

AI may draft RAMS, but a competent person must review and approve them
before issue.

## AI assistance

Use AI to:

- Turn engineer notes and dictation into professional reports
- Identify missing information before job completion
- Draft RAMS for review
- Summarise site, job and asset histories
- Improve defect descriptions and quotation wording
- Flag possible compliance issues for human review
- Search operational records using plain language

AI must never invent work, attendance, test results, signatures or
compliance.

## Initial exclusions

Do not initially build full accounting, payroll, fleet tracking, complex
warehouse management, multi-company operation, enterprise BI or features
AMP does not regularly use.

## Existing projects

Review and reuse useful work from the AMP Team calendar, digital
fire-alarm logbook, engineer field-reporting app and certificate projects.
Do not discard existing work without reviewing it. See
[development-decisions.md](./development-decisions.md) for the audit of
what currently exists in this repository.

## Development stages

1. Audit AMP's current Simpro workflow and requirements.
2. Build customers, sites, users and permissions.
3. Add jobs, scheduling and the engineer mobile workflow.
4. Add assets, forms, reports and planned maintenance.
5. Add RAMS and health-and-safety workflows.
6. Add quotes, purchasing and invoicing.
7. Add the customer portal and digital logbooks.
8. Add AI assistance and automation.
9. Build and test Simpro data-import tools.
10. Run parallel testing before controlled migration.

## Decisions and migration

A [Development Decisions record](./development-decisions.md) covers
architecture, features, alternatives, tests, failures, security, migration
and unresolved questions.

Before importing Simpro data: identify available exports, map fields, test
with copied data, detect duplicates, preserve document relationships and
retain recoverable backups. Simpro must remain available until AMP
confirms the replacement is fully tested.

Dominic Shepherd has final approval over scope, branding, deployment,
live-data migration and replacement of Simpro. Sensible technical
decisions can be made within the approved scope; input is only needed
when a decision materially changes cost, functionality, security or user
experience.
