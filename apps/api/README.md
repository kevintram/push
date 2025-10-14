# 3gulp-api

A FastAPI-based REST API application.

## Prerequisites

- Python 3.12 or higher
- [uv](https://github.com/astral-sh/uv) package manager

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd 3gulp-api
```

2. Install dependencies:
```bash
uv sync
```

### Running the Application

Start the development server with auto-reload:
```bash
fastapi dev app/main.py
```

The API will be available at `http://localhost:8000`.

### API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Authentication

The API uses token-based authentication:
- **Query token**: Add `?token=jessica` to all requests
- **Header token**: Add `x-token: fake-super-secret-token` header for protected routes (items, admin)

### Example Requests

```bash
# Get root endpoint
curl "http://localhost:8000/?token=jessica"

# Get users
curl "http://localhost:8000/users/?token=jessica"

# Get items (requires header token)
curl -H "x-token: fake-super-secret-token" "http://localhost:8000/items/?token=jessica"
```

## Development

### Adding Dependencies

```bash
# Add a regular dependency
uv add <package-name>

# Add a dev dependency
uv add --dev <package-name>
```

### Project Structure

- `app/main.py` - Application entry point
- `app/routers/` - API route handlers
- `app/dependencies.py` - Shared dependencies and auth
- `app/internal/` - Admin and internal routes