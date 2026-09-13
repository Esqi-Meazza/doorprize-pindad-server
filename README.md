# Doorprize Server

Express, Socket.IO, MySQL, and JWT backend for the Doorprize application.

## Setup

```powershell
Copy-Item .env.example .env
npm ci
npm run db:migrate
```

Set the database and JWT values in `.env` before starting the server.

## Commands

```powershell
npm run dev
npm start
npm test
npm run test:integration
npm run test:race
npm run format:check
npm audit --audit-level=high --registry=https://registry.npmjs.org
```

Database mutation tests require an explicit disposable test database. Set `RUN_DB_TESTS=1`, `TEST_ADMIN_USERNAME`, `TEST_ADMIN_PASSWORD`, `TEST_GROUP_ID`, `TEST_RACE_NIP`, and `TEST_RACE_DOB`; never use production data. Run `test:race` while the server is running on `TEST_PORT` or port `3001`.

## Operations

- `GET /healthz` is a liveness check and does not require MySQL.
- `GET /readyz` verifies that MySQL is reachable.
- `SIGINT` and `SIGTERM` close Socket.IO, HTTP, and MySQL resources gracefully.
- `npm run db:migrate` applies indexes idempotently.

## Layout

- `routes/` defines HTTP boundaries and validation.
- `controllers/` maps HTTP to application services.
- `services/` contains business logic and database transactions.
- `middlewares/` contains authentication, validation, and errors.
- `tests/` contains unit, HTTP integration, and opt-in race-test coverage.
