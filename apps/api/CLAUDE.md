# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a FastAPI application using Python 3.12+ and managed with `uv` (Python package manager). The application follows a domain-based architecture with service layers, organizing code by feature (topics, sources, reviews, auth, admin) rather than by file type.

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
- **`app/main.py`**: Main FastAPI application entry point
- **`app/config.py`**: Global configuration with Pydantic Settings
- **`app/database.py`**: Database connection setup
- **`app/dependencies.py`**: Shared dependencies (SessionDep)
- **`app/exceptions.py`**: Domain exception base classes (pure Python, not HTTPException)
- **`app/exception_handlers.py`**: FastAPI handlers that translate domain exceptions to HTTP responses
- **`app/constants.py`**: Shared constants (ChildHandlingStrategy)
- **`app/models/`**: SQLAlchemy ORM models (shared)
- **`app/schemas/`**: Pydantic validation schemas (shared)

### Domain Modules
Each domain follows this structure:
- `router.py` - Thin HTTP handlers
- `service.py` - Business logic + data access