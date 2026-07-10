# API Camel-Case Response Plan

## Goal

Return JSON object properties from the FastAPI API in `camelCase` while keeping Python, SQLAlchemy, and database field names in `snake_case`.

Example:

```json
{
  "parentId": 123,
  "parentTitle": "Example",
  "insertedAt": "2026-07-10T12:00:00Z",
  "updatedAt": "2026-07-10T12:00:00Z"
}
```

Python code remains idiomatic:

```python
topic.parent_id
payload.model_dump()
```

## Contract Decision

This is a breaking response-contract change. The API is shared by `apps/web` and `apps/web-v2`:

- `apps/web` currently consumes snake_case response properties directly.
- `apps/web-v2` currently validates snake_case topic responses and transforms them to camelCase.

Before implementation, choose one rollout strategy:

1. Update the API and both web clients in one coordinated release.
2. Apply camelCase only to explicitly versioned v2 endpoints, preserving existing endpoint responses for `apps/web`.

Do not return different casing from the same endpoint based on the caller. The response contract and generated OpenAPI schema must remain deterministic.

## Phase 1: Add a Shared API Schema Base

Create `apps/api/app/schemas/base.py` with a shared Pydantic model:

```python
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
```

This configuration:

- Defines camelCase aliases that FastAPI uses when serializing response models.
- Keeps Python field access and default `model_dump()` output in snake_case for service calls.
- Accepts Python field names during validation, which is required for ORM attribute parsing.
- Also accepts camelCase aliases in request bodies, allowing clients to use the public JSON convention.

Do not set `serialize_by_alias=True` globally. Existing router code passes `payload.model_dump()` into snake_case service arguments; changing the default dump casing would break those calls. FastAPI response models already serialize with aliases by default.

Files:

- Add `apps/api/app/schemas/base.py`.
- Optionally export `ApiModel` from `apps/api/app/schemas/__init__.py` if schema classes are normally imported through the package.

## Phase 2: Migrate Pydantic Schemas

Replace direct inheritance from Pydantic's `BaseModel` with `ApiModel`. Keep schema-specific configuration such as `from_attributes=True` and `extra="forbid"`; Pydantic merges inherited `model_config` values.

Files:

- `apps/api/app/schemas/topics.py`
- `apps/api/app/schemas/review_cards.py`
- `apps/api/app/schemas/reviews.py`
- `apps/api/app/schemas/search.py`
- `apps/api/app/schemas/status_badges.py`

Confirm every endpoint return annotation or `response_model` uses a migrated Pydantic schema. FastAPI serializes response models by alias by default. Code serializing a model outside FastAPI must opt in explicitly with `model_dump(by_alias=True)` when producing public JSON.

## Phase 3: Define Non-Schema Response Scope

Pydantic aliases do not transform manually constructed dictionaries or `JSONResponse` bodies. Audit these separately:

- `apps/api/app/exception_handlers.py`
- `apps/api/app/auth/session.py`
- Message dictionaries returned by routers and `apps/api/app/main.py`

Leave keys that are already casing-neutral, such as `message`, unchanged. Convert any multiword public JSON keys manually or replace the dictionary with a response schema.

Query and path parameter names are also unaffected. Keep existing query parameters such as `parent_id`, `subtree_of`, and `topic_id` unchanged for this response-only migration. A query-parameter casing change should be a separate contract decision using explicit FastAPI aliases.

## Phase 4: Update API Tests

Update response assertions and add focused contract tests that prove:

- Multiword response fields use camelCase.
- Snake_case response aliases are absent.
- Nested models and models inside lists are camelCase.
- ORM objects still validate through snake_case attributes.
- `payload.model_dump()` remains snake_case for service-layer keyword arguments.
- CamelCase request bodies validate successfully.
- Unknown request properties remain rejected on schemas using `extra="forbid"`.
- The generated OpenAPI schema advertises camelCase JSON properties.

Representative response fields to cover:

- Topics: `parentId`, `parentTitle`, `insertedAt`, `updatedAt`.
- Review cards: `topicId`, `primaryText`, `lastReviewedAt`, `statusBadges`.
- Review queues: `queueType`, `reviewId`, `scheduledAt`, `asOf`.
- Reviews and status badges: all multiword fields, including nested card summaries.

Files are expected under:

- `apps/api/tests/topics/`
- `apps/api/tests/review_cards/`
- `apps/api/tests/reviews/`
- `apps/api/tests/search/`
- Add a focused schema/OpenAPI test module if that avoids duplicating assertions.

## Phase 5: Migrate API Consumers

### Web V2

Remove wire-format adapters that validate snake_case and transform it to camelCase. Validate the API response in its final camelCase shape instead.

Known files:

- `apps/web-v2/src/modules/library/types/topic.schemas.ts`
- `apps/web-v2/src/modules/library/api/__tests__/getTopics.test.ts`

Search all API response schemas, fixtures, and mock handlers for snake_case properties before completing the migration.

### Existing Web App

If existing endpoints change in place, update `apps/web` API types, runtime schemas, response consumers, mocks, and tests to camelCase. This is broader than a type-only rename because the current UI accesses snake_case properties throughout the application.

If camelCase is limited to versioned v2 endpoints, leave `apps/web` unchanged and document the casing difference as part of the endpoint-version contract.

## Phase 6: Documentation and OpenAPI Review

- Document camelCase as the canonical JSON property convention.
- Document snake_case as the Python and database convention.
- Regenerate client types if any clients consume the OpenAPI schema.
- Review `/openapi.json` and Swagger UI to confirm request and response examples use camelCase.

## Validation

Run from the relevant application directories:

```bash
# apps/api
uv run pytest
uv run ruff check
uv run ruff format --check

# apps/web-v2
pnpm run validate

# apps/web, when existing endpoints change in place
pnpm run validate
```

Perform an authenticated browser check because the API uses cookie authentication:

1. Load topics and verify response properties are camelCase in the browser network panel.
2. Create and update a topic using camelCase request properties.
3. Exercise a nested review-card or review-queue response.
4. Confirm both affected web clients render and mutate data correctly.

## Completion Criteria

- All targeted Pydantic response models inherit from `ApiModel`.
- API responses and OpenAPI properties consistently use camelCase.
- Python models, ORM attributes, and service arguments remain snake_case.
- Manual JSON responses have been audited.
- Query and path parameter casing remains unchanged unless separately approved.
- Every consumer of changed endpoints is migrated or isolated behind API versioning.
- API and affected web validation suites pass.
