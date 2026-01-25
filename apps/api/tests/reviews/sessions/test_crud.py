"""Integration tests for review sessions endpoints."""

from datetime import date, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Review, Source, Topic


class TestReviewSessionsCrud:
    """Integration tests for basic CRUD operations on /review-sessions endpoints."""

    async def test_create_review_session_minimal(
        self,
        test_client: AsyncClient,
    ):
        """Should create a review session with minimal required fields."""
        response = await test_client.post(
            "/review-sessions/",
            json={
                "description": "Morning Review",
                "notes": "",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["description"] == "Morning Review"
        assert data["notes"] == ""
        assert data["scheduled_at"] is None
        assert data["completed_at"] is None
        assert data["id"] is not None

    async def test_create_review_session_with_all_fields(
        self,
        test_client: AsyncClient,
    ):
        """Should create a review session with all fields populated."""
        today = date.today()
        response = await test_client.post(
            "/review-sessions/",
            json={
                "description": "Full Session",
                "notes": "Some notes about this session",
                "scheduled_at": str(today),
                "completed_at": str(today),
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["description"] == "Full Session"
        assert data["notes"] == "Some notes about this session"
        assert data["scheduled_at"] == str(today)
        assert data["completed_at"] == str(today)
        assert data["effective_date"] == str(today)

    async def test_get_review_session_by_id(
        self,
        test_client: AsyncClient,
        create_test_review_session,
    ):
        """Should return a specific review session by ID."""
        session = await create_test_review_session(description="Specific Session")

        response = await test_client.get(f"/review-sessions/{session.id}/")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == session.id
        assert data["description"] == "Specific Session"

    async def test_get_review_session_not_found(
        self,
        test_client: AsyncClient,
    ):
        """Should return 404 for non-existent review session."""
        response = await test_client.get("/review-sessions/99999/")

        assert response.status_code == 404

    async def test_list_review_sessions_empty(
        self,
        test_client: AsyncClient,
    ):
        """New user should have no review sessions."""
        response = await test_client.get("/review-sessions/")

        assert response.status_code == 200
        assert response.json() == []

    async def test_list_review_sessions_returns_user_sessions_only(
        self,
        test_client: AsyncClient,
        create_test_review_session,
    ):
        """Should only return review sessions for the authenticated user."""
        await create_test_review_session(description="My Session")
        await create_test_review_session(
            description="Other User Session", user_id="other-user"
        )

        response = await test_client.get("/review-sessions/")

        assert response.status_code == 200
        sessions = response.json()
        assert len(sessions) == 1
        assert sessions[0]["description"] == "My Session"

    async def test_list_recent_review_sessions(
        self,
        test_client: AsyncClient,
        create_test_review_session,
    ):
        """Should return most recently updated sessions."""
        await create_test_review_session(description="Session 1")
        await create_test_review_session(description="Session 2")
        await create_test_review_session(description="Session 3")

        response = await test_client.get("/review-sessions/recent/")

        assert response.status_code == 200
        sessions = response.json()
        assert len(sessions) == 3

    async def test_list_recent_review_sessions_respects_limit(
        self,
        test_client: AsyncClient,
        create_test_review_session,
    ):
        """Should respect the limit parameter."""
        for i in range(5):
            await create_test_review_session(description=f"Session {i}")

        response = await test_client.get("/review-sessions/recent/?limit=2")

        assert response.status_code == 200
        sessions = response.json()
        assert len(sessions) == 2

    async def test_update_review_session(
        self,
        test_client: AsyncClient,
        create_test_review_session,
    ):
        """Should update a review session."""
        session = await create_test_review_session(description="Original Description")

        response = await test_client.post(
            f"/review-sessions/{session.id}/",
            json={"description": "Updated Description"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["description"] == "Updated Description"

    async def test_delete_review_session(
        self,
        test_client: AsyncClient,
        create_test_review_session,
    ):
        """Should delete a review session."""
        session = await create_test_review_session(description="Session to Delete")

        response = await test_client.delete(f"/review-sessions/{session.id}/")
        assert response.status_code == 200

        # Verify session is gone via API
        get_response = await test_client.get(f"/review-sessions/{session.id}/")
        assert get_response.status_code == 404


class TestReviewSessionFilters:
    """Tests for review session list filtering."""

    async def test_filter_by_completed_true(
        self,
        test_client: AsyncClient,
        create_test_review_session,
    ):
        """Should filter to only completed sessions."""
        await create_test_review_session(
            description="Completed", completed_at=date.today()
        )
        await create_test_review_session(description="Not Completed")

        response = await test_client.get("/review-sessions/?completed=true")

        assert response.status_code == 200
        sessions = response.json()
        assert len(sessions) == 1
        assert sessions[0]["description"] == "Completed"

    async def test_filter_by_completed_false(
        self,
        test_client: AsyncClient,
        create_test_review_session,
    ):
        """Should filter to only incomplete sessions."""
        await create_test_review_session(
            description="Completed", completed_at=date.today()
        )
        await create_test_review_session(description="Not Completed")

        response = await test_client.get("/review-sessions/?completed=false")

        assert response.status_code == 200
        sessions = response.json()
        assert len(sessions) == 1
        assert sessions[0]["description"] == "Not Completed"

    async def test_filter_by_effective_date_range(
        self,
        test_client: AsyncClient,
        create_test_review_session,
    ):
        """Should filter by effective date range."""
        today = date.today()
        yesterday = today - timedelta(days=1)
        tomorrow = today + timedelta(days=1)

        await create_test_review_session(
            description="Yesterday", scheduled_at=yesterday
        )
        await create_test_review_session(description="Today", scheduled_at=today)
        await create_test_review_session(description="Tomorrow", scheduled_at=tomorrow)

        response = await test_client.get(
            f"/review-sessions/?effective_date_after={today}&effective_date_before={today}"
        )

        assert response.status_code == 200
        sessions = response.json()
        assert len(sessions) == 1
        assert sessions[0]["description"] == "Today"


class TestReviewSessionCompletion:
    """Tests for review session completion lifecycle and FSRS integration."""

    async def test_complete_session_sets_review_ratings_to_good(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_review_session,
        create_test_review,
        create_test_topic,
    ):
        """Completing a session should set all null ratings to 'good'."""
        # Create session with reviews that have no rating
        session = await create_test_review_session(description="Session to Complete")
        topic = await create_test_topic(name="Review Topic")
        review = await create_test_review(
            topic_id=topic.id,
            review_session_id=session.id,
            rating=None,  # No rating yet
        )

        # Complete the session
        today = date.today()
        response = await test_client.post(
            f"/review-sessions/{session.id}/",
            json={"completed_at": str(today)},
        )

        assert response.status_code == 200

        # Verify the review now has rating="good"
        result = await db_session.execute(select(Review).where(Review.id == review.id))
        updated_review = result.scalar_one()
        assert updated_review.rating == "good"
        assert updated_review.completed_at == today

    async def test_complete_session_updates_fsrs_state(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_review_session,
        create_test_review,
        create_test_topic,
    ):
        """Completing a session should update FSRS state for affected topics."""
        # Create session with a review
        session = await create_test_review_session(description="FSRS Session")
        topic = await create_test_topic(name="FSRS Topic")
        await create_test_review(
            topic_id=topic.id,
            review_session_id=session.id,
            rating=None,
        )

        # Get initial topic FSRS state (stability is None for new topics)
        result = await db_session.execute(
            select(Topic)
            .where(Topic.id == topic.id)
            .options(selectinload(Topic.fsrs_state))
        )
        initial_topic = result.scalar_one()
        initial_stability = initial_topic.fsrs_state.stability

        # Complete the session
        today = date.today()
        response = await test_client.post(
            f"/review-sessions/{session.id}/",
            json={"completed_at": str(today)},
        )

        assert response.status_code == 200

        # Verify FSRS state was updated
        result = await db_session.execute(
            select(Topic)
            .where(Topic.id == topic.id)
            .options(selectinload(Topic.fsrs_state))
        )
        updated_topic = result.scalar_one()

        # After a "good" review, stability should be set (was None initially)
        assert updated_topic.fsrs_state.stability is not None
        assert updated_topic.fsrs_state.stability != initial_stability

    async def test_complete_session_with_explicit_ratings_preserves_them(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_review_session,
        create_test_review,
        create_test_topic,
    ):
        """Completing a session should not override reviews with explicit ratings."""
        # Create session with reviews - one with rating, one without
        session = await create_test_review_session(description="Mixed Session")
        topic1 = await create_test_topic(name="Topic 1")
        topic2 = await create_test_topic(name="Topic 2")

        review_with_rating = await create_test_review(
            topic_id=topic1.id,
            review_session_id=session.id,
            rating="hard",  # Explicit rating
            completed_at=date.today(),
        )
        review_without_rating = await create_test_review(
            topic_id=topic2.id,
            review_session_id=session.id,
            rating=None,  # No rating
        )

        # Complete the session
        today = date.today()
        await test_client.post(
            f"/review-sessions/{session.id}/",
            json={"completed_at": str(today)},
        )

        # Verify the "hard" rating was preserved
        result = await db_session.execute(
            select(Review).where(Review.id == review_with_rating.id)
        )
        preserved_review = result.scalar_one()
        assert preserved_review.rating == "hard"

        # Verify the null rating became "good"
        result = await db_session.execute(
            select(Review).where(Review.id == review_without_rating.id)
        )
        auto_rated_review = result.scalar_one()
        assert auto_rated_review.rating == "good"

    async def test_delete_completed_session_triggers_fsrs_replay(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_review_session,
        create_test_topic,
    ):
        """Deleting a completed session should replay FSRS for affected topics."""
        topic = await create_test_topic(name="FSRS Replay Topic")

        # Do a first review to establish baseline FSRS state
        first_review_response = await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )
        assert first_review_response.status_code == 200

        # Get FSRS state after first review
        result = await db_session.execute(
            select(Topic)
            .where(Topic.id == topic.id)
            .options(selectinload(Topic.fsrs_state))
        )
        topic_after_first = result.scalar_one()
        stability_after_first = topic_after_first.fsrs_state.stability

        # Create a session and add a review to it
        session = await create_test_review_session(description="Session to Delete")
        tomorrow = date.today() + timedelta(days=1)
        second_review_response = await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "review_session_id": session.id,
                "scheduled_at": str(tomorrow),
                "completed_at": str(tomorrow),
                "rating": "good",
            },
        )
        assert second_review_response.status_code == 200

        # Mark the session as completed
        await test_client.post(
            f"/review-sessions/{session.id}/",
            json={"completed_at": str(tomorrow)},
        )

        # Get FSRS state after second review
        result = await db_session.execute(
            select(Topic)
            .where(Topic.id == topic.id)
            .options(selectinload(Topic.fsrs_state))
        )
        topic_after_second = result.scalar_one()
        stability_after_second = topic_after_second.fsrs_state.stability

        # Stability should have increased with the second review
        assert stability_after_second != stability_after_first

        # Delete the session (which contains the second review)
        response = await test_client.delete(f"/review-sessions/{session.id}/")
        assert response.status_code == 200

        # FSRS should be replayed without the deleted review
        result = await db_session.execute(
            select(Topic)
            .where(Topic.id == topic.id)
            .options(selectinload(Topic.fsrs_state))
        )
        topic_after_delete = result.scalar_one()

        # Stability should return to what it was after just the first review
        assert topic_after_delete.fsrs_state.stability == pytest.approx(
            stability_after_first
        )


class TestReviewSessionWithSources:
    """Tests for review sessions containing source reviews."""

    async def test_complete_session_updates_source_fsrs(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_review_session,
        create_test_review,
        create_test_source,
    ):
        """Completing a session should update FSRS state for sources too."""
        # Create session with a source review
        session = await create_test_review_session(description="Source Session")
        source = await create_test_source(title="Test Source")

        # Create a review for the source
        await create_test_review(
            source_id=source.id,
            review_session_id=session.id,
        )

        # Get initial source FSRS state
        result = await db_session.execute(
            select(Source)
            .where(Source.id == source.id)
            .options(selectinload(Source.fsrs_state))
        )
        initial_source = result.scalar_one()
        initial_stability = initial_source.fsrs_state.stability

        # Complete the session
        today = date.today()
        response = await test_client.post(
            f"/review-sessions/{session.id}/",
            json={"completed_at": str(today)},
        )

        assert response.status_code == 200

        # Verify source FSRS state was updated
        result = await db_session.execute(
            select(Source)
            .where(Source.id == source.id)
            .options(selectinload(Source.fsrs_state))
        )
        updated_source = result.scalar_one()

        assert updated_source.fsrs_state.stability != initial_stability

    async def test_complete_session_with_both_topic_and_source_reviews(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_review_session,
        create_test_review,
        create_test_topic,
        create_test_source,
    ):
        """Completing a session should update FSRS for both topics and sources."""
        # Create session with reviews for both a topic and a source
        session = await create_test_review_session(description="Mixed Session")
        topic = await create_test_topic(name="Session Topic")
        source = await create_test_source(title="Session Source")

        # Create a review for the topic
        topic_review = await create_test_review(
            topic_id=topic.id,
            review_session_id=session.id,
        )

        # Create a review for the source
        source_review = await create_test_review(
            source_id=source.id,
            review_session_id=session.id,
        )

        # Get initial FSRS states
        topic_result = await db_session.execute(
            select(Topic)
            .where(Topic.id == topic.id)
            .options(selectinload(Topic.fsrs_state))
        )
        initial_topic = topic_result.scalar_one()
        initial_topic_stability = initial_topic.fsrs_state.stability

        source_result = await db_session.execute(
            select(Source)
            .where(Source.id == source.id)
            .options(selectinload(Source.fsrs_state))
        )
        initial_source = source_result.scalar_one()
        initial_source_stability = initial_source.fsrs_state.stability

        # Complete the session
        today = date.today()
        response = await test_client.post(
            f"/review-sessions/{session.id}/",
            json={"completed_at": str(today)},
        )

        assert response.status_code == 200

        # Verify both reviews got rating="good"
        topic_review_result = await db_session.execute(
            select(Review).where(Review.id == topic_review.id)
        )
        assert topic_review_result.scalar_one().rating == "good"

        source_review_result = await db_session.execute(
            select(Review).where(Review.id == source_review.id)
        )
        assert source_review_result.scalar_one().rating == "good"

        # Verify topic FSRS was updated
        topic_result = await db_session.execute(
            select(Topic)
            .where(Topic.id == topic.id)
            .options(selectinload(Topic.fsrs_state))
        )
        updated_topic = topic_result.scalar_one()
        assert updated_topic.fsrs_state.stability is not None
        assert updated_topic.fsrs_state.stability != initial_topic_stability

        # Verify source FSRS was updated
        source_result = await db_session.execute(
            select(Source)
            .where(Source.id == source.id)
            .options(selectinload(Source.fsrs_state))
        )
        updated_source = source_result.scalar_one()
        assert updated_source.fsrs_state.stability is not None
        assert updated_source.fsrs_state.stability != initial_source_stability
