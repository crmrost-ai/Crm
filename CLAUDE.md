# CLAUDE.md — CRM Project

## Project Overview

This is a Customer Relationship Management (CRM) system. The goal is to manage clients, deals, tasks, communications, and sales pipelines in a unified platform.

## Architecture

```
Crm/
├── backend/          # Server-side application (API)
├── frontend/         # Client-side application (UI)
├── database/         # Migrations, seeds, schema definitions
├── docs/             # Project documentation
└── CLAUDE.md         # This file
```

## Tech Stack

> Update this section once the stack is decided.

- **Backend**: (e.g. Node.js/Express, Django, FastAPI, Laravel)
- **Frontend**: (e.g. React, Vue, Next.js)
- **Database**: (e.g. PostgreSQL, MySQL, MongoDB)
- **Auth**: (e.g. JWT, OAuth2, session-based)
- **Cache**: (e.g. Redis)
- **Queue**: (e.g. BullMQ, Celery, RabbitMQ)

## Core CRM Modules

| Module | Description |
|---|---|
| **Contacts** | Leads, clients, companies — the address book |
| **Deals / Pipeline** | Sales stages from lead to closed deal |
| **Tasks** | To-dos and follow-ups linked to contacts/deals |
| **Activities** | Calls, emails, meetings — interaction history |
| **Users & Roles** | Team members, access control (RBAC) |
| **Reports** | Sales stats, conversion funnels, dashboards |
| **Notifications** | In-app and email alerts |
| **Integrations** | Email sync, telephony, messengers, webhooks |

## Data Model (Core Entities)

```
Contact
  id, first_name, last_name, email, phone, company_id,
  owner_id (User), source, status, tags[], created_at

Company
  id, name, industry, website, address, contacts[]

Deal
  id, title, value, currency, stage, probability,
  contact_id, company_id, owner_id, close_date, created_at

Activity
  id, type (call|email|meeting|note), deal_id, contact_id,
  user_id, description, scheduled_at, completed_at

Task
  id, title, due_date, priority, status,
  assignee_id, contact_id, deal_id

User
  id, name, email, role, team_id, created_at
```

## Development Guidelines

### Git Workflow
- Branch naming: `feature/<name>`, `fix/<name>`, `refactor/<name>`
- Commits: use [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `chore:`, `docs:`
- PRs require review before merging to `main`

### Code Style
- Keep functions small and focused (single responsibility)
- No magic numbers — use named constants
- Validate all user input at the API boundary
- Never store passwords in plain text (use bcrypt or argon2)

### Security
- Sanitize all inputs to prevent SQL injection and XSS
- Use RBAC: users can only access data they own or are assigned to
- Log all authentication events (login, logout, failed attempts)
- Never expose internal IDs in public-facing URLs without authorization checks

### Testing
- Unit tests for business logic (deal stage transitions, permission checks)
- Integration tests for API endpoints
- E2E tests for critical user flows (create contact → create deal → close deal)

### API Design
- RESTful endpoints: `GET /contacts`, `POST /deals`, `PATCH /deals/:id`
- Consistent error responses: `{ error: { code, message } }`
- Pagination on all list endpoints: `?page=1&limit=20`
- Filter and sort support: `?status=active&sort=created_at:desc`

## Environment Variables

```env
# Example — never commit real values
DATABASE_URL=postgres://user:pass@localhost:5432/crm
JWT_SECRET=changeme
REDIS_URL=redis://localhost:6379
APP_PORT=3000
```

## Common Commands

> Fill in once the project is set up.

```bash
# Install dependencies
# npm install  /  pip install -r requirements.txt

# Run development server
# npm run dev  /  python manage.py runserver

# Run tests
# npm test  /  pytest

# Run database migrations
# npm run migrate  /  python manage.py migrate
```

## Key Business Rules

1. A **Deal** must always have an owner (assigned user)
2. Only users with role `admin` or `manager` can delete contacts/deals
3. When a deal moves to stage `Closed Won` or `Closed Lost`, it becomes read-only
4. Activity log entries are **immutable** — never update, only append
5. A contact can belong to multiple deals but has one primary owner
