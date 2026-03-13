from datetime import date
from types import SimpleNamespace

from app.review_cards import status_badges


def test_compute_days_until_hazy_returns_none_without_required_fields():
    assert (
        status_badges.compute_days_until_hazy(
            stability=None,
            last_reviewed_at=date(2026, 3, 5),
            freshness_tier="Fresh",
        )
        is None
    )
    assert (
        status_badges.compute_days_until_hazy(
            stability=4.5,
            last_reviewed_at=None,
            freshness_tier="Fresh",
        )
        is None
    )


def test_compute_days_until_hazy_maps_zero_to_tomorrow_for_non_hazy(monkeypatch):
    monkeypatch.setattr(
        status_badges,
        "compute_distance_to_retrievability",
        lambda *args, **kwargs: 0,
    )

    assert (
        status_badges.compute_days_until_hazy(
            stability=4.5,
            last_reviewed_at=date(2026, 3, 5),
            freshness_tier="Fresh",
        )
        == 1
    )


def test_compute_days_until_hazy_maps_zero_to_overdue_for_hazy_cards(monkeypatch):
    monkeypatch.setattr(
        status_badges,
        "compute_distance_to_retrievability",
        lambda *args, **kwargs: 0,
    )

    assert (
        status_badges.compute_days_until_hazy(
            stability=4.5,
            last_reviewed_at=date(2026, 3, 5),
            freshness_tier="Hazy",
        )
        == -1
    )


def _make_card(**overrides):
    defaults = {
        "retired": False,
        "stability": 4.5,
        "last_reviewed_at": date(2026, 3, 1),
        "freshness_tier": "Hazy",
        "days_in_current_tier": 3,
        "days_until_next_tier": 5,
        "reviews": [],
    }
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def test_retired_card_suppresses_hazy_and_forgotten_badges():
    card = _make_card(retired=True, freshness_tier="Hazy", days_in_current_tier=3)
    badges = status_badges.build_review_card_status_badges(
        card, today=date(2026, 3, 10), resolve_due_badge=False
    )
    assert badges == []


def test_retired_card_still_shows_due_badge():
    due_review = SimpleNamespace(
        id=1, scheduled_at=date(2026, 3, 12), completed_at=None
    )
    card = _make_card(retired=True, reviews=[due_review])
    badges = status_badges.build_review_card_status_badges(
        card, today=date(2026, 3, 10)
    )
    assert len(badges) == 1
    assert badges[0]["key"] == "due"


def test_non_retired_card_shows_all_badges():
    card = _make_card(
        retired=False,
        freshness_tier="Hazy",
        days_in_current_tier=3,
        days_until_next_tier=5,
    )
    badges = status_badges.build_review_card_status_badges(
        card, today=date(2026, 3, 10), resolve_due_badge=False
    )
    keys = [b["key"] for b in badges]
    assert "hazy_for" in keys
    assert "forgotten_soon" in keys
