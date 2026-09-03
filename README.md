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

## Live Demo

| Surface | URL |
|---------|-----|
| Frontend | https://amiable-victory-production-9f5e.up.railway.app |
| Backend API | https://pitz-products-challenge-production.up.railway.app |
| API Documentation (Swagger UI) | https://pitz-products-challenge-production.up.railway.app/api-docs |

Health check (Rails): `GET /up` on the backend service.

## Tech Stack

### Backend

- Ruby 3.4.10
- Ruby on Rails 8.1 (API-only)
- PostgreSQL
- RSpec
- rswag (OpenAPI / Swagger UI)
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

## Production Architecture

Production is a **decoupled frontend/backend deployment** on Railway (not a
microservices system). Three Railway services collaborate:

```text
Browser
   |
   v
React / Vite (Railway)
   |
   | HTTPS / JSON
   v
Rails API (Railway)
   |
   | Active Record
   v
PostgreSQL (Railway)
```

- The React + TypeScript + Vite SPA is an independent Railway service.
- The Rails API is a separate Railway service.
- PostgreSQL is hosted as a Railway database service.
- The browser calls the Rails API over HTTPS using the configured API base URL.
- Rails connects to PostgreSQL through `DATABASE_URL`.
- CORS allows only the configured frontend origin (`FRONTEND_ORIGIN`).

Service names, networking, and most runtime settings are configured in the
Railway dashboard. Repository-backed deployment artifacts are documented under
[Deployment](#deployment).

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
committed. Document **names only** — never commit or paste secret values.

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

### Production environment variables

**Frontend (Railway build)**

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Public HTTPS URL of the deployed Rails API |

Vite embeds `VITE_*` values into the client bundle at **build time**. Provide
this variable during the Docker/Railway image build. It must not contain secrets.

**Backend (Railway runtime)**

| Variable | Purpose |
|----------|---------|
| `FRONTEND_ORIGIN` | Explicit allowed frontend origin for CORS |
| `DATABASE_URL` | PostgreSQL connection string provided by Railway |
| `RAILS_MASTER_KEY` | Decrypts Rails encrypted credentials when applicable |
| `RAILS_ENV` | Set to `production` |

`DATABASE_URL` and `RAILS_MASTER_KEY` are secrets. Never commit them or publish
their values. Rails `config/master.key` is gitignored. Encrypted
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

Current suite size: **82 examples, 0 failures**
(model + request behavioral specs, plus OpenAPI contract examples via rswag).

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

**OpenAPI contract:** separate rswag integration specs generate and exercise
the published OpenAPI document. They complement—not replace—the behavioral
request specs.

**Frontend:** unit tests for the Fetch client, plus component/integration
tests for list, create/edit, and delete flows. MSW intercepts real HTTP
at the network boundary. TanStack Query and React Hook Form internals are
not mocked.

There is no browser E2E automation suite in this repository.

## API Documentation

OpenAPI documentation is maintained with **rswag**:

- Swagger UI is mounted at `/api-docs`
- Spec endpoint: `/api-docs/v1/swagger.yaml`
- Checked-in generated file: `backend/swagger/v1/swagger.yaml`
- Contract source: `backend/spec/integration/api/v1/products_spec.rb`

**Local:** http://localhost:3000/api-docs

**Production:** https://pitz-products-challenge-production.up.railway.app/api-docs

Regenerate the OpenAPI file after API contract changes:

```bash
cd backend
bundle exec rails rswag:specs:swaggerize
```

Documented Product operations:

| Method | Path |
|--------|------|
| `GET` | `/api/v1/products` |
| `GET` | `/api/v1/products/{id}` |
| `POST` | `/api/v1/products` |
| `PUT` | `/api/v1/products/{id}` |
| `DELETE` | `/api/v1/products/{id}` |

The OpenAPI document includes request/response schemas, list query parameters
(`page`, `search`, `active`), and relevant success/error responses
(for example `200` / `201` / `204`, `400`, `404`, `422`).

Behavioral RSpec request tests remain the primary API behavior suite. rswag
specs own the published contract surface.

## Deployment

Production runs on **Railway** as three collaborating services: frontend,
Rails API, and PostgreSQL.

### What lives in the repository

**Frontend**

- Service root: `frontend/`
- Build artifact: `frontend/Dockerfile`
  - multi-stage Node build (`npm ci` → `npm run build`)
  - `VITE_API_BASE_URL` accepted as a Docker `ARG` / `ENV` at build time
  - static `dist/` served with `serve` on `tcp://0.0.0.0:$PORT`
- Production is a Vite static build, not the Vite dev server

**Backend**

- Service root: `backend/`
- Standard Rails API process
- PostgreSQL via `DATABASE_URL` (Rails / Active Record)
- Health endpoint: `GET /up` (production request logging silenced via `config.silence_healthcheck_path`)
- CORS origin from `FRONTEND_ORIGIN`

There is **no** `docker-compose.yml`, `railway.toml`, or GitHub Actions workflow
in this repository. Platform wiring (service linking, public domains, secrets,
and release/start commands) is configured in Railway.

### Database operations

On the Rails service / one-off shell:

```bash
bin/rails db:prepare
bin/rails db:seed
```

`db:prepare` creates/migrates as needed. Seeds are optional after the first
schema setup.

### Distinction

A Dockerfile used for the Railway frontend build is **not** the same as a full
Docker Compose local development environment. Local Compose onboarding remains
future work (see below).

## Security / Reliability Notes

- Environment secrets are not committed (`.env`, `master.key` ignored)
- CORS origins are explicit
- Strong parameters limit writable Product attributes
- Unexpected errors return safe client payloads
- The backend quality gate includes Brakeman and bundler-audit
- SKU uniqueness is enforced in the database

This is appropriate hardening for the assessment scope, not a claim of
production security certification.

## Assessment Scope / Bonus Work

Beyond the mandatory CRUD application, this repository also includes:

- Frontend automated testing with Vitest, Testing Library, and MSW
- TanStack Query for server-state management
- OpenAPI / Swagger API documentation (rswag)
- Functional Railway deployment of the frontend and Rails API with PostgreSQL connectivity

Not included in this delivery: CI/CD pipelines, Docker Compose for local
development, soft deletes, or change auditing.

## What I Would Improve With More Time

Given more time, I would prioritize **reliability and operational maturity**
before adding new Product-domain features.

### 1. CI/CD automation

Add GitHub Actions that run:

- Backend: `backend/bin/ci`
- Frontend: `npm run check` (from `frontend/`)

Intended flow:

```text
pull request / push
  → backend + frontend quality gates
  → build
  → deploy only after successful verification
```

Deployment already works on Railway; automated CI/CD would make releases more
repeatable and safer.

### 2. Browser-level E2E testing

Add a small Playwright or Cypress suite for the critical production journey:

- list Products
- search / filter
- Create
- Edit
- Delete

Current frontend tests (Vitest + Testing Library + MSW) remain valuable for
fast, focused coverage. E2E would additionally validate the fully integrated
browser → frontend → Rails → PostgreSQL path.

### 3. Observability / production operations

Once real traffic exists:

- structured logging
- error tracking (for example Sentry)
- request/error monitoring
- basic metrics and alerts

### 4. Database hardening and performance (measurement-driven)

- PostgreSQL `CHECK` constraints for numeric invariants where useful
- query/index analysis with `EXPLAIN` under realistic data volumes
- `pg_trgm` + GIN/GiST for `%term%` Product-name search **only if** measured
  `ILIKE` cost justifies it

`pg_trgm` is not assumed necessary for the current dataset.

### 5. Bundle / performance optimization (measurement-driven)

The Vite build already emits a chunk-size advisory. I would only introduce
code splitting or lazy loading after bundle analysis shows a measurable
benefit, for example if the application grows enough that the current main
chunk becomes a real load-cost problem.

### 6. Reproducible local infrastructure

Docker Compose for Rails + PostgreSQL + frontend would improve consistent local
onboarding.

Soft deletes, auditing, authentication, dashboards, and new Product fields
should follow an explicit **business** requirement. They are not my preferred
engineering priority without that driver.

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

Live demo: https://amiable-victory-production-9f5e.up.railway.app
Swagger: https://pitz-products-challenge-production.up.railway.app/api-docs
