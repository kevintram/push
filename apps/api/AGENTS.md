# Repository Guidelines

## Project Structure & Module Organization
The FastAPI app lives in `app/`. `app/main.py` wires routers and shared dependencies. Feature routers sit in `app/routers/`, admin-only handlers in `app/internal/`, and reusable dependencies in `app/dependencies.py`. Database setup is centralised in `app/core/db.py`, which builds the async SQLAlchemy engine for Supabase. The `supabase/` directory tracks local config, migrations, and seeds; update it whenever the schema changes. Keep new modules beside the feature they extend and avoid storing generated artifacts at the repo root.

## Build, Test, and Development Commands
- `uv sync` install dependencies pinned by `uv.lock`.
- `uv run fastapi dev app/main.py` starts the auto-reloading API at `http://localhost:8000`.
- `uv run fastapi run` mirrors production settings for smoke tests.
- `uv run ruff check app` and `uv run ruff format app` enforce linting and formatting.
- `supabase start` provisions the local Postgres, Studio, and realtime services declared in `supabase/config.toml`.

## Coding Style & Naming Conventions
Use 4-space indentation, type hints, and FastAPI’s dependency injection. Modules and packages stay lowercase with underscores, classes use PascalCase, and functions/variables use snake_case. Keep request/response models close to their router; extract common schemas into a shared module only when reuse is clear. Run Ruff before pushing to catch style regressions.

## Testing Guidelines
Adopt `pytest` for new work. Place suites under a top-level `tests/` directory that mirrors the `app/` layout (e.g. `tests/routers/test_topics.py`). Exercise both successful calls and auth failures, especially when touching database code. Install the dependency with `uv add --dev pytest` if it is not already present and run `uv run pytest` before raising a pull request. Mock Supabase when persistence is not under test.

## Commit & Pull Request Guidelines
Commits follow Conventional Commits (`feat(db):`, `docs:`) as seen in history. Keep subjects under 72 characters, expand on rationale in the body when behaviour changes, and scope names to the touched module (`routers`, `core`, `supabase`). Pull requests should describe intent, list local verification (commands, curl snippets, screenshots), and link any related issue or migration. Ensure linting, tests, and Supabase migrations succeed before requesting review.

## Database & Supabase Workflow
Use the Supabase CLI for local persistence. Secrets belong in environment variables or `.env` files ignored by git. Generate schema changes with `supabase db diff --output supabase/migrations/<timestamp>_<name>.sql` and validate seeds via `supabase db reset`. Update `app/core/db.py` only when connection parameters change, preferring environment overrides for deployment.
