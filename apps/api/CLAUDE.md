# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a FastAPI application using Python 3.12+ and managed with `uv` (Python package manager). The application follows FastAPI's modular architecture pattern with routers, dependencies, and internal modules.

## Development Commands

### Running the Application
```bash
fastapi dev app/main.py
```
This starts the development server with auto-reload enabled.

### Running in Production Mode
```bash
fastapi run
```

### Package Management
- Install dependencies: `uv sync`
- Add a new dependency: `uv add <package-name>`
- Add dev dependency: `uv add --dev <package-name>`

## Commit Guidelines

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvement
- **test**: Adding or updating tests
- **chore**: Changes to build process or auxiliary tools

### Examples
```
feat(auth): add JWT token authentication

Replace query token authentication with JWT-based auth for better security.

Closes #123
```

```
fix(items): handle non-existent item edge case

Return 404 status when item_id is not found in database.
```

```
docs: update README with installation instructions
```

## Architecture

### Application Structure
- **`app/main.py`**: Main FastAPI application entry point. Includes routers and global dependencies.
- **`app/dependencies.py`**: Shared dependency functions used across the application (e.g., authentication tokens).
- **`app/routers/`**: Feature-based API route modules (users, items).
- **`app/internal/`**: Internal/admin-only routes with additional security.

### Router Pattern
Each router is an `APIRouter` instance that can have:
- Its own prefix (e.g., `/items`, `/admin`)
- Tags for OpenAPI documentation
- Route-specific dependencies
- Custom response definitions

Routers are registered in `main.py` using `app.include_router()`.

### Dependency Injection
The application uses FastAPI's dependency injection system:
- **Global dependencies**: Applied to all routes via `FastAPI(dependencies=[...])`
- **Router dependencies**: Applied to all routes in a router via `APIRouter(dependencies=[...])`
- **Route dependencies**: Applied to individual routes via `@router.get(..., dependencies=[...])`

Current authentication:
- `get_query_token`: Global dependency requiring `token=jessica` query parameter
- `get_token_header`: Used for protected routes requiring `x-token: fake-super-secret-token` header
