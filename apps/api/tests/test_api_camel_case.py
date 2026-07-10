from datetime import date, datetime, timezone
from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from app.main import app
from app.schemas.review_cards import (
    ReviewCardCreate,
    ReviewCardQueueItem,
    ReviewCardRead,
)
from app.schemas.status_badges import StatusBadge
from app.schemas.topics import TopicCreate, TopicRead


def test_public_aliases_cover_nested_models_and_lists():
    card = ReviewCardRead(
        id=2,
        topic_id=1,
        topic_title="Topic",
        type="flashcard",
        primary_text="Question",
        secondary_text="Answer",
        inserted_at=datetime(2026, 7, 10, tzinfo=timezone.utc),
        updated_at=datetime(2026, 7, 10, tzinfo=timezone.utc),
        status_badges=[
            StatusBadge(
                key="due",
                label="Due Today",
                tone="info",
                review_id=3,
            )
        ],
    )
    queue_item = ReviewCardQueueItem(
        queue_type="due",
        card=card,
        review_id=3,
        scheduled_at=date(2026, 7, 10),
    )

    public = queue_item.model_dump(by_alias=True)

    assert public["queueType"] == "due"
    assert public["reviewId"] == 3
    assert public["card"]["topicId"] == 1
    assert public["card"]["statusBadges"][0]["reviewId"] == 3
    assert "queue_type" not in public
    assert "topic_id" not in public["card"]
    assert "status_badges" not in public["card"]


def test_orm_attributes_validate_and_default_dump_stays_snake_case():
    topic = TopicRead.model_validate(
        SimpleNamespace(
            id=1,
            title="Child",
            body="",
            parent_id=2,
            parent_title="Parent",
            inserted_at=datetime(2026, 7, 10, tzinfo=timezone.utc),
            updated_at=datetime(2026, 7, 10, tzinfo=timezone.utc),
        )
    )

    dumped = topic.model_dump()

    assert dumped["parent_id"] == 2
    assert dumped["parent_title"] == "Parent"
    assert "parentId" not in dumped


def test_camel_case_request_is_accepted_and_extra_fields_remain_forbidden():
    payload = ReviewCardCreate.model_validate(
        {
            "topicId": 1,
            "type": "practice",
            "primaryText": "Prompt",
            "secondaryText": "Answer",
        }
    )

    assert payload.model_dump()["topic_id"] == 1
    assert payload.primary_text == "Prompt"

    with pytest.raises(ValidationError):
        TopicCreate.model_validate({"title": "Topic", "unknownField": True})


def test_openapi_advertises_camel_case_schema_properties():
    schemas = app.openapi()["components"]["schemas"]

    topic_properties = schemas["TopicRead"]["properties"]
    card_properties = schemas["ReviewCardRead"]["properties"]
    queue_properties = schemas["ReviewCardQueueItem"]["properties"]

    assert {
        "parentId",
        "parentTitle",
        "insertedAt",
        "updatedAt",
    } <= topic_properties.keys()
    assert {
        "topicId",
        "primaryText",
        "lastReviewedAt",
        "statusBadges",
    } <= card_properties.keys()
    assert {"queueType", "reviewId", "scheduledAt"} <= queue_properties.keys()
    assert "parent_id" not in topic_properties
    assert "status_badges" not in card_properties
