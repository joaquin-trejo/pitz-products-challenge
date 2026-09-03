# PITZ Products Challenge

Full Stack Product Management application for the PITZ technical assessment.

The project is a monorepo with a Rails API-only backend, a React + TypeScript
frontend, and PostgreSQL. It provides a responsive Product CRUD experience
over a versioned REST API.

## Features

- Create, read, update, and delete Products
- Server-side Product listing with pagination (10 per page)
- Case-insensitive partial search by Product name
- Active / Inactive status filtering
- Client validation (Zod) aligned with Rails validation
- Confirmation before Create/Edit save and before Delete
- Loading, error (with Retry), empty, and filtered-empty states
- Desktop table and mobile/tablet card layouts
- Success and error feedback for mutations

## Tech Stack

### Backend

- Ruby 3.4.10
- Ruby on Rails 8.1 (API-only)
- PostgreSQL
- RSpec
- rack-cors
- RuboCop (rails-omakase)
- bundler-audit
- Brakeman

### Frontend

- React 19
- TypeScript
- Vite
- Material UI
- TanStack Query
- React Hook Form
- Zod
- Vitest
- React Testing Library
- MSW

## Project Structure

```text
.
├── backend/                 # Rails API application
└── frontend/                # React + TypeScript SPA
```

Backend and frontend are independently runnable and communicate over HTTP/JSON.
There is no nested Git repository inside either app.

## Prerequisites

- Ruby **3.4.10** (see `backend/.ruby-version`)
- Bundler (via the Ruby install)
- PostgreSQL (developed with PostgreSQL 17)
- Node.js and npm (developed with Node 24 / npm 11)

PostgreSQL must be running before database preparation.

A global Rails install is not required; use `bundle exec` / `bin/rails` after
`bundle install` in `backend/`.

## Environment Variables

Example files are provided for documentation. Real local env files are not
committed.

### Backend (`backend/.env.example`)

| Variable | Purpose |
|----------|---------|
| `FRONTEND_ORIGIN` | Allowed CORS origin for the React app (no trailing slash) |

This repository does **not** use dotenv (or equivalent) to load a backend
`.env` file automatically. `backend/.env.example` documents the variable;
copying it to `.env` has no effect on Rails by itself.

In development/test, if `FRONTEND_ORIGIN` is unset, the API defaults to
`http://localhost:5173`. Production requires an explicit origin. `"*"` is
rejected.

To override in development, export the variable or prefix the server command:

```bash
cd backend
export FRONTEND_ORIGIN=http://localhost:5173
bin/rails server
```

```bash
cd backend
FRONTEND_ORIGIN=http://localhost:5173 bin/rails server
```

### Frontend (`frontend/.env.example`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Rails API base URL (example: `http://localhost:3000`) |

`VITE_*` values are public client configuration. Do not put secrets in them.
Vite loads `frontend/.env` for local development.

```bash
cd frontend
cp .env.example .env
```

Rails `config/master.key` is gitignored and must never be committed. Encrypted
`config/credentials.yml.enc` may remain in version control.

## Setup

Commands assume a fresh clone at the repository root.

### Backend

Ensure PostgreSQL is running, then:

```bash
cd backend
bundle install
bin/rails db:prepare
bin/rails db:seed
bin/rails server
```

The API listens on **http://localhost:3000** by default.

`db:prepare` creates and migrates the development database as needed.

To set a non-default CORS origin for a session:

```bash
FRONTEND_ORIGIN=http://localhost:5173 bin/rails server
```

### Frontend

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev
```

The Vite app listens on **http://localhost:5173** by default.

`npm ci` is preferred for a clean, lockfile-reproducible install. `npm install`
also works when iterating locally.

## Seed Data

Seeds create **15** deterministic Products keyed by stable SKUs
(`find_or_initialize_by(sku)`), so re-running seeds is idempotent.

The set includes:

- more than one page of results (default page size is 10)
- active and inactive Products
- varied names suitable for search demos

```bash
cd backend
bin/rails db:seed
```

## API

Base path: `/api/v1`

| Method | Path | Success |
|--------|------|---------|
| `GET` | `/api/v1/products` | `200 OK` |
| `GET` | `/api/v1/products/:id` | `200 OK` |
| `POST` | `/api/v1/products` | `201 Created` |
| `PUT` | `/api/v1/products/:id` | `200 OK` |
| `DELETE` | `/api/v1/products/:id` | `204 No Content` |

Rails also exposes `PATCH` as an alias for update. The documented update
contract for this project is **PUT**.

Collection responses use `{ "data": [...], "meta": { ... } }`.
Single-resource success responses use `{ "data": { ... } }`.

### List query parameters

| Parameter | Behavior |
|-----------|----------|
| `page` | Page number (defaults to `1` when omitted) |
| `search` | Case-insensitive partial match on Product **name** |
| `active` | `true` / `false`; omit to include both |

Examples:

```text
GET /api/v1/products
GET /api/v1/products?page=2
GET /api/v1/products?search=mouse
GET /api/v1/products?active=true
GET /api/v1/products?active=false
GET /api/v1/products?search=monitor&active=false&page=1
```

Behavior notes:

- Default page size is **10**
- Search and status filtering run in the database **before** pagination
- Ordering is deterministic: `created_at DESC`, then `id DESC`
- Malformed or non-positive `page` values, and invalid `active` values,
  return **400**
- A positive out-of-range `page` returns **200** with `data: []` and
  accurate `meta` (not coerced to page 1)

Pagination metadata:

```json
{
  "page": 1,
  "per_page": 10,
  "total_pages": 2,
  "total_count": 15
}
```

### Product contract

| Field | Notes |
|-------|--------|
| `id` | Integer |
| `name` | String |
| `description` | String or `null` |
| `price` | **String** decimal (e.g. `"29.99"`) |
| `stock` | Integer |
| `sku` | String |
| `active` | Boolean |
| `created_at` / `updated_at` | ISO8601 timestamps |

`price` is serialized as a string to preserve decimal fidelity across the
JSON boundary. No currency is assumed or displayed.

Write payloads wrap attributes under `product`:

```json
{
  "product": {
    "name": "Wireless Mouse",
    "description": "Ergonomic mouse",
    "price": "29.99",
    "stock": 12,
    "sku": "MOUSE-001",
    "active": true
  }
}
```

## Validation Rules

Enforced by Rails (authoritative) and mirrored on the frontend for UX.

| Field | Rules |
|-------|--------|
| `name` | Required; 3–100 characters (frontend validates length after trimming surrounding whitespace) |
| `description` | Optional; max 1000 characters; blank may be sent as `null` |
| `price` | Required; decimal greater than 0 |
| `stock` | Required; integer ≥ 0 |
| `sku` | Required; unique; uppercase `A-Z`, digits `0-9`, and hyphens `-` only |
| `active` | Required boolean; database default `true` |

Lowercase SKUs are rejected by client validation and are not auto-uppercased.

## Assumptions

1. **SKU format**  
   The assessment wording is inconsistent (one place suggests uppercase
   letters and numbers; another explicitly allows hyphens). This project
   standardizes on **uppercase letters, digits, and hyphens** in both the
   Rails model and the frontend Zod schema.

2. **Currency**  
   The assessment does not define a currency. The UI renders the API price
   string without inventing `$`, `USD`, `COP`, or similar labels.

## Error Contract

**400 Bad Request** (malformed request or invalid query parameters):

```json
{
  "error": {
    "code": "bad_request",
    "message": "Invalid request parameters"
  }
}
```

**404 Not Found**:

```json
{
  "error": {
    "code": "not_found",
    "message": "Product not found"
  }
}
```

**422 Unprocessable Content** (model validation failures, including duplicate SKU):

```json
{
  "errors": {
    "sku": ["has already been taken"]
  }
}
```

**500 Internal Server Error** (unexpected failures outside development):

A safe generic payload is returned. Stack traces and internal details are not
exposed to the client.

## Testing and Quality Checks

### Backend

Primary quality gate:

```bash
cd backend
bin/ci
```

`bin/ci` currently runs setup, RuboCop, RSpec, bundler-audit, and Brakeman.

RSpec alone:

```bash
cd backend
bundle exec rspec
```

Current suite size: **70 examples, 0 failures**.

### Frontend

Primary quality gate:

```bash
cd frontend
npm run check
```

This runs ESLint, Vitest, and the TypeScript + Vite production build.

Tests alone:

```bash
cd frontend
npm run test
```

Current suite size: **40 tests, 0 failures** (3 test files).

The production build may emit a Vite chunk-size warning for the main JS
bundle. That is a size advisory, not a functional failure.

## Technical Decisions

### Rails API-only + PostgreSQL

The assessment requires a decoupled HTTP/JSON API and PostgreSQL. An
API-only Rails app keeps the backend focused on persistence and HTTP
concerns while the React SPA owns presentation.

### Rails conventions over unnecessary layers

Product CRUD and listing are expressed with routes, a controller, Active
Record models/scopes, and PostgreSQL. No Service/Repository/Interactor
layer was added because it would not reduce complexity for this domain.
Those abstractions remain available if real reuse or business rules appear.

### Database integrity + Rails validations

Rails validations provide domain rules and field-addressable API errors.
PostgreSQL additionally enforces essential integrity: `NOT NULL` on
required columns, `active` default `true`, decimal `price` (`precision: 12`,
`scale: 2`), and a unique index on `sku`. Application-only uniqueness is
not relied on alone. Extra `CHECK` constraints are a possible future
hardening, not a forgotten requirement for this scope.

### Search strategy

Name search uses PostgreSQL `ILIKE` with wildcard escaping via
`sanitize_sql_like`. That is sufficient for this assessment’s dataset.
A leading/trailing `%term%` pattern is not optimized by a simple B-tree
index on `name`. At larger scale, measured query cost could justify
`pg_trgm` + GIN/GiST or another search approach.

### Pagination

Pagination is entirely server-side. The API never expects the client to
slice a full catalog. Ordering is fixed for stable pages. Positive
out-of-range pages return an empty `data` array with truthful metadata so
clients can recover (the UI already adjusts when `page > total_pages`
after deletions).

### Decimal price

Monetary-style values are stored as `decimal` and serialized as strings so
the API does not force IEEE-754 float representation through JSON.

### CORS

`rack-cors` allows a single configured frontend origin for `/api/*`.
Wildcards are rejected. Production must set `FRONTEND_ORIGIN` explicitly.

### TanStack Query

Server state (Product lists) is managed with TanStack Query. Successful
Create/Update/Delete invalidate list queries (`productQueryKeys.lists()`)
instead of manually patching every search/filter/page cache. The server
remains the source of truth for membership and pagination.

### React Hook Form + Zod

Forms use React Hook Form with a Zod schema for immediate UX feedback.
Rails remains authoritative; 422 field errors are mapped into the form.

### Local UI state

Search input, debounced search, status filter, page, and dialog selection
live in component state. Redux/global stores were not introduced for a
single-resource UI.

### Confirmation and mutation strategy

Save and delete require explicit confirmation. Mutations are not
optimistic: the UI waits for the server response, then invalidates lists.
Correctness was preferred over speculative cache updates.

### Responsive results

At Material UI `md` and above, results render as a table. Below `md`,
they render as cards. Only one representation is mounted at a time to
avoid duplicate accessible content.

## Testing Strategy

**Backend:** model validation specs (including boundaries), scope specs
for search/filter, and request specs covering all Product endpoints,
pagination/search/filter combinations, and error statuses.

**Frontend:** unit tests for the Fetch client, plus component/integration
tests for list, create/edit, and delete flows. MSW intercepts real HTTP
at the network boundary. TanStack Query and React Hook Form internals are
not mocked.

There is no browser E2E automation suite in this repository.

## Security / Reliability Notes

- Environment secrets are not committed (`.env`, `master.key` ignored)
- CORS origins are explicit
- Strong parameters limit writable Product attributes
- Unexpected errors return safe client payloads
- The backend quality gate includes Brakeman and bundler-audit
- SKU uniqueness is enforced in the database

This is appropriate hardening for the assessment scope, not a claim of
production security certification.

## Future Improvements

High-value next steps if the project continued:

- Bundle code-splitting after measuring real load cost
- GitHub Actions running `backend/bin/ci` and `frontend npm run check`
- Docker / Docker Compose for reproducible local review
- Deployment of API and SPA
- OpenAPI/Swagger documentation generated from the live contract
- Optional PostgreSQL `CHECK` constraints for numeric bounds
- `pg_trgm` (or similar) if search volume justifies it
- Richer browser-level E2E coverage
- Structured logging/observability for production operations

Soft deletes and change auditing are not listed as default next steps;
they should follow an explicit business requirement.

## Assessment Scope / Bonus Work

Beyond the mandatory CRUD application, this repository also includes:

- Frontend automated tests (Vitest, Testing Library, MSW)
- TanStack Query for server-state management

## Reviewer Quick Start

```bash
# Backend (PostgreSQL must be running)
cd backend
bundle install
bin/rails db:prepare
bin/rails db:seed
bin/rails server
# optional CORS override:
# FRONTEND_ORIGIN=http://localhost:5173 bin/rails server

# Frontend (separate terminal)
cd frontend
npm ci
cp .env.example .env
npm run dev
```

Then open http://localhost:5173 and call the API at http://localhost:3000.
