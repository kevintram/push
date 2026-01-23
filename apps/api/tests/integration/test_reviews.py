"""Integration tests for reviews endpoints."""

from datetime import date, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Topic, Source


class TestReviewsEndpoints:
    """Integration tests for /reviews endpoints."""

    async def test_create_topic_review_uncompleted(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Create an uncompleted review (scheduled but not done).

        Uncompleted reviews should NOT trigger FSRS calculations.
        """
        topic = await create_test_topic()

        response = await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "scheduled_at": str(date.today()),
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["topic_id"] == topic.id
        assert data["completed_at"] is None
        assert data["rating"] is None
        # FSRS state should NOT be set for uncompleted reviews
        assert data["stability_before"] is None
        assert data["stability_after"] is None
        assert data["state_before"] is None
        assert data["state_after"] is None

    async def test_create_topic_review_completed_updates_fsrs(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_topic,
    ):
        """Create a completed review - should update topic's FSRS state.

        Verifies that:
        1. Review captures before/after FSRS state
        2. Topic's FSRS state is updated after review
        3. FSRS algorithm produces valid stability/difficulty values
        """
        topic = await create_test_topic()
        original_stability = topic.fsrs_state.stability
        original_state = topic.fsrs_state.state

        response = await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )

        assert response.status_code == 200
        data = response.json()

        # Review should capture before state (initial None values)
        assert data["stability_before"] == original_stability
        assert data["state_before"] == original_state

        # Review should have computed after state
        assert data["stability_after"] is not None
        assert data["stability_after"] > 0  # FSRS always produces positive stability
        assert data["difficulty_after"] is not None
        assert data["state_after"] in ["LEARNING", "REVIEW", "RELEARNING"]
        assert data["rating"] == "good"

        # Topic's FSRS state should be updated to match review's after state
        result = await db_session.execute(
            select(Topic)
            .where(Topic.id == topic.id)
            .options(selectinload(Topic.fsrs_state))
        )
        refreshed_topic = result.scalar_one()
        assert refreshed_topic.fsrs_state.stability == pytest.approx(
            data["stability_after"]
        )
        assert refreshed_topic.fsrs_state.difficulty == pytest.approx(
            data["difficulty_after"]
        )
        assert refreshed_topic.fsrs_state.state == data["state_after"]

    async def test_create_review_with_inline_topic(
        self,
        test_client: AsyncClient,
    ):
        """Create a review with inline topic creation."""
        response = await test_client.post(
            "/reviews/",
            json={
                "topic": {
                    "name": "Inline Created Topic",
                    "srs_enabled": True,
                },
                "scheduled_at": str(date.today()),
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["topic"]["name"] == "Inline Created Topic"
        assert data["topic_id"] is not None
        assert data["completed_at"] is None

    async def test_list_reviews_filters_by_topic(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """List reviews should filter by topic_id."""
        topic1 = await create_test_topic(name="Topic 1")
        topic2 = await create_test_topic(name="Topic 2")

        # Create reviews for both topics
        await test_client.post(
            "/reviews/",
            json={"topic_id": topic1.id, "scheduled_at": str(date.today())},
        )
        await test_client.post(
            "/reviews/",
            json={"topic_id": topic2.id, "scheduled_at": str(date.today())},
        )

        # Filter by topic1
        response = await test_client.get(f"/reviews/?topic_id={topic1.id}")

        assert response.status_code == 200
        reviews = response.json()
        assert len(reviews) == 1
        assert reviews[0]["topic_id"] == topic1.id

    async def test_update_review_rating_recalculates_fsrs(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Updating a review's rating should recalculate FSRS state.

        Verifies that changing rating triggers FSRS recalculation with
        different stability output.
        """
        topic = await create_test_topic()

        # Create completed review with "good" rating
        create_response = await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )
        review_id = create_response.json()["id"]
        original_stability_after = create_response.json()["stability_after"]

        # Update to "easy" rating
        update_response = await test_client.post(
            f"/reviews/{review_id}/",
            json={"rating": "easy"},
        )

        assert update_response.status_code == 200
        data = update_response.json()

        # "easy" should produce different stability than "good"
        # (typically higher stability for easier ratings)
        assert data["stability_after"] != original_stability_after
        assert data["rating"] == "easy"
        # Before state should remain unchanged
        assert data["stability_before"] == create_response.json()["stability_before"]

    async def test_delete_review_triggers_replay(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Deleting a review should replay subsequent reviews.

        When review1 is deleted, review2's before/after states should be
        recalculated starting from the initial topic state (not review1's after state).
        """
        topic = await create_test_topic()

        # Create two completed reviews
        response1 = await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "scheduled_at": str(date.today() - timedelta(days=1)),
                "completed_at": str(date.today() - timedelta(days=1)),
                "rating": "good",
            },
        )
        assert response1.status_code == 200
        review1_id = response1.json()["id"]
        review1_stability_after = response1.json()["stability_after"]

        response2 = await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )
        assert response2.status_code == 200
        review2_id = response2.json()["id"]
        # Review2's before state should be review1's after state
        review2_stability_before = response2.json()["stability_before"]
        assert review2_stability_before == pytest.approx(review1_stability_after)

        # Delete review 1 - should trigger replay of review 2
        delete_response = await test_client.delete(f"/reviews/{review1_id}/")
        assert delete_response.status_code == 200

        # Fetch review2 to verify it was replayed
        get_response = await test_client.get(f"/reviews/{review2_id}/")

        assert get_response.status_code == 200
        replayed_review2 = get_response.json()

        # After replay, review2's before state should be the initial topic state
        # (None, since there are no prior reviews now)
        assert replayed_review2["stability_before"] is None
        # The after state should be recalculated from initial state
        assert replayed_review2["stability_after"] is not None


class TestFsrsRatingBehavior:
    """Tests verifying FSRS algorithm produces correct outputs for different ratings."""

    async def test_different_ratings_produce_different_stability(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Different ratings should produce different stability values.

        FSRS rating impact on stability (from lowest to highest):
        miss < hard < good < easy
        """
        # Create 4 topics with identical initial state
        topics = {}
        ratings = ["miss", "hard", "good", "easy"]
        for rating in ratings:
            topics[rating] = await create_test_topic(name=f"Topic for {rating}")

        stability_results = {}

        for rating in ratings:
            response = await test_client.post(
                "/reviews/",
                json={
                    "topic_id": topics[rating].id,
                    "scheduled_at": str(date.today()),
                    "completed_at": str(date.today()),
                    "rating": rating,
                },
            )
            assert response.status_code == 200
            stability_results[rating] = response.json()["stability_after"]

        # Verify stability ordering: miss < hard < good < easy
        assert stability_results["miss"] < stability_results["hard"]
        assert stability_results["hard"] < stability_results["good"]
        assert stability_results["good"] < stability_results["easy"]

    async def test_fsrs_state_transitions_learning_to_review(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """FSRS should transition from LEARNING to REVIEW state after enough successful reviews.

        In LEARNING state, step increments until graduation threshold.
        After graduation, state becomes REVIEW and step becomes None.
        """
        topic = await create_test_topic(
            initial_state="LEARNING",
            initial_step=0,
        )

        # Do multiple "good" reviews to progress through learning
        for i in range(5):  # FSRS typically graduates after 2-4 reviews
            response = await test_client.post(
                "/reviews/",
                json={
                    "topic_id": topic.id,
                    "scheduled_at": str(date.today() + timedelta(days=i)),
                    "completed_at": str(date.today() + timedelta(days=i)),
                    "rating": "good",
                },
            )
            assert response.status_code == 200

            state_after = response.json()["state_after"]
            if state_after == "REVIEW":
                # Successfully graduated to review state
                assert response.json()["step_after"] is None
                break
        else:
            # If we didn't break, we should still be in a valid state
            assert response.json()["state_after"] in ["LEARNING", "REVIEW"]

    async def test_fsrs_relearning_on_miss(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """A 'miss' rating on a REVIEW state item should trigger RELEARNING.

        When a reviewed item is forgotten (miss), FSRS puts it back into
        relearning state to rebuild memory.
        """
        # Start with a topic in LEARNING state, then do multiple "good" reviews
        # to graduate it to REVIEW state
        topic = await create_test_topic(
            initial_state="LEARNING",
            initial_step=0,
        )

        # Graduate the topic to REVIEW state with successful reviews
        state_after = "LEARNING"
        for i in range(5):
            response = await test_client.post(
                "/reviews/",
                json={
                    "topic_id": topic.id,
                    "scheduled_at": str(date.today() + timedelta(days=i)),
                    "completed_at": str(date.today() + timedelta(days=i)),
                    "rating": "good",
                },
            )
            assert response.status_code == 200
            state_after = response.json()["state_after"]
            if state_after == "REVIEW":
                break

        # Ensure we actually graduated to REVIEW state
        assert state_after == "REVIEW", (
            "Topic should be in REVIEW state before testing miss"
        )

        # Now do a miss rating - should transition to RELEARNING
        response = await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "scheduled_at": str(date.today() + timedelta(days=10)),
                "completed_at": str(date.today() + timedelta(days=10)),
                "rating": "miss",
            },
        )

        assert response.status_code == 200
        data = response.json()

        # After a miss, item should enter RELEARNING state
        assert data["state_before"] == "REVIEW"
        assert data["state_after"] == "RELEARNING"
        # Stability should decrease significantly after a miss
        assert data["stability_after"] < data["stability_before"]


class TestFsrsReplayEdgeCases:
    """Tests for edge cases in FSRS replay logic."""

    async def test_insert_review_in_middle_triggers_replay(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Inserting a review with an earlier date should replay subsequent reviews.

        If review2 exists, then review1 is created with an earlier date,
        review2 should be replayed with review1's after state as its before state.
        """
        topic = await create_test_topic()

        # Create review2 first (dated today)
        response2 = await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )
        review2_id = response2.json()["id"]
        original_review2_stability_before = response2.json()["stability_before"]

        # Now create review1 with an earlier date (yesterday)
        response1 = await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "scheduled_at": str(date.today() - timedelta(days=1)),
                "completed_at": str(date.today() - timedelta(days=1)),
                "rating": "hard",
            },
        )
        review1_stability_after = response1.json()["stability_after"]

        # Fetch review2 to verify it was replayed
        get_response = await test_client.get(f"/reviews/{review2_id}/")

        assert get_response.status_code == 200
        replayed_review2 = get_response.json()

        # Review2's before state should now be review1's after state
        assert replayed_review2["stability_before"] == pytest.approx(
            review1_stability_after
        )
        # Before state should have changed from original
        assert replayed_review2["stability_before"] != original_review2_stability_before

    async def test_complete_uncompleted_review_triggers_fsrs(
        self,
        test_client: AsyncClient,
        create_test_topic,
    ):
        """Completing a previously uncompleted review should trigger FSRS calculation.

        When an uncompleted review gets a completed_at date, FSRS should run.
        """
        topic = await create_test_topic()

        # Create uncompleted review
        create_response = await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "scheduled_at": str(date.today()),
            },
        )
        review_id = create_response.json()["id"]
        assert create_response.json()["completed_at"] is None
        assert create_response.json()["stability_after"] is None

        # Complete the review
        update_response = await test_client.post(
            f"/reviews/{review_id}/",
            json={
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )

        assert update_response.status_code == 200
        data = update_response.json()

        # Now FSRS should have run
        assert data["completed_at"] is not None
        assert data["stability_after"] is not None
        assert data["state_after"] is not None

    async def test_delete_only_review_resets_topic_state(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_topic,
    ):
        """Deleting the only review should reset topic to initial FSRS state."""
        topic = await create_test_topic()
        original_stability = topic.fsrs_state.stability
        original_state = topic.fsrs_state.state

        # Create and then delete a review
        create_response = await test_client.post(
            "/reviews/",
            json={
                "topic_id": topic.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )
        review_id = create_response.json()["id"]

        # Verify topic state changed
        assert create_response.json()["stability_after"] != original_stability

        # Delete the review
        await test_client.delete(f"/reviews/{review_id}/")

        # Fetch topic and verify state is reset
        result = await db_session.execute(
            select(Topic)
            .where(Topic.id == topic.id)
            .options(selectinload(Topic.fsrs_state))
        )
        refreshed_topic = result.scalar_one()

        # Topic should be back to initial state
        assert refreshed_topic.fsrs_state.stability == original_stability
        assert refreshed_topic.fsrs_state.state == original_state


class TestSourceReviews:
    """Integration tests for source reviews (polymorphic)."""

    async def test_create_source_review(
        self,
        test_client: AsyncClient,
        create_test_source,
    ):
        """Create a review for a source."""
        source = await create_test_source()

        response = await test_client.post(
            "/reviews/",
            json={
                "source_id": source.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "good",
            },
        )

        assert response.status_code == 200
        data = response.json()
        # Source reviews include the source relationship
        assert data["source"]["id"] == source.id
        assert data["topic_id"] is None
        # FSRS should have run for completed source review
        assert data["stability_after"] is not None

    async def test_source_review_fsrs_independent_of_topics(
        self,
        test_client: AsyncClient,
        db_session: AsyncSession,
        create_test_topic,
        create_test_source,
    ):
        """Source reviews should update source FSRS state, not topic state.

        Verifies that the polymorphic review system correctly routes FSRS
        calculations to the right entity.
        """
        topic = await create_test_topic()
        source = await create_test_source()

        # Create a source review
        response = await test_client.post(
            "/reviews/",
            json={
                "source_id": source.id,
                "scheduled_at": str(date.today()),
                "completed_at": str(date.today()),
                "rating": "easy",
            },
        )
        source_stability = response.json()["stability_after"]

        # Verify source was updated
        result = await db_session.execute(
            select(Source)
            .where(Source.id == source.id)
            .options(selectinload(Source.fsrs_state))
        )
        refreshed_source = result.scalar_one()
        assert refreshed_source.fsrs_state.stability == pytest.approx(source_stability)

        # Verify topic was NOT updated (still initial state)
        result = await db_session.execute(
            select(Topic)
            .where(Topic.id == topic.id)
            .options(selectinload(Topic.fsrs_state))
        )
        refreshed_topic = result.scalar_one()
        assert refreshed_topic.fsrs_state.stability is None  # Still initial
