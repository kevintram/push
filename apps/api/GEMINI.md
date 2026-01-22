# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Project Overview

This is a FastAPI application using Python 3.12+ and managed with `uv` (Python package manager). The application follows FastAPI's modular architecture pattern with routers, dependencies, and internal modules.

## Development Commands

### Package Management
```bash
uv sync             # install dependencies
uv add <package>    # add dependency 
```

### Running the Application
```bash
uv run fastapi dev --host localhost  # Start dev server with auto-reload 
```

### Test
```bash
uv run pytest               # Run all tests
```

### Lint
```bash
uv run ruff check --fix     # Run ruff auto-fix lint issues
uv run ruff format          # Run ruff formatting
```

## Architecture

### Application Structure
- **`app/main.py`**: Main FastAPI application entry point. Includes routers and global dependencies.
- **`app/dependencies.py`**: Shared dependency functions used across the application (e.g., authentication tokens).
- **`app/routers/`**: Feature-based API route modules (users, items).
- **`app/internal/`**: Internal/admin-only routes with additional security.
