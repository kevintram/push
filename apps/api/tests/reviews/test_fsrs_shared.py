from datetime import date
from types import SimpleNamespace

from app.reviews.fsrs_shared import update_fsrs


def test_new_card_replay_graduates_directly_to_review() -> None:
    card = SimpleNamespace(
        stability=None,
        difficulty=None,
        state="LEARNING",
        step=None,
        last_reviewed_at=None,
        inherited_stability=None,
        inherited_difficulty=None,
        inherited_state=None,
        inherited_step=None,
        inherited_last_review=None,
    )
    reviews = [
        SimpleNamespace(completed_at=date(2026, 5, 21), rating="good"),
        SimpleNamespace(completed_at=date(2026, 5, 26), rating="hard"),
        SimpleNamespace(completed_at=date(2026, 6, 18), rating="hard"),
    ]

    update_fsrs(card, reviews, last_before_review=None)

    assert [review.state_after for review in reviews] == ["REVIEW"] * 3
    assert [review.step_after for review in reviews] == [None] * 3
    assert [review.due_after for review in reviews] == [
        date(2026, 5, 25),
        date(2026, 6, 18),
        date(2026, 8, 26),
    ]
    assert card.state == "REVIEW"
    assert card.step is None


def test_lapsed_card_replay_graduates_directly_back_to_review() -> None:
    card = SimpleNamespace(
        stability=None,
        difficulty=None,
        state="LEARNING",
        step=None,
        last_reviewed_at=None,
        inherited_stability=None,
        inherited_difficulty=None,
        inherited_state=None,
        inherited_step=None,
        inherited_last_review=None,
    )
    reviews = [
        SimpleNamespace(completed_at=date(2024, 1, 1), rating="easy"),
        SimpleNamespace(completed_at=date(2024, 1, 11), rating="good"),
        SimpleNamespace(completed_at=date(2024, 1, 21), rating="miss"),
    ]

    update_fsrs(card, reviews, last_before_review=None)

    lapse = reviews[-1]
    assert lapse.state_after == "REVIEW"
    assert lapse.step_after is None
    assert lapse.due_after == date(2024, 1, 26)
    assert card.state == "REVIEW"
    assert card.step is None
