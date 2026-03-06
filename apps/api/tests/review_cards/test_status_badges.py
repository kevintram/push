from datetime import date

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
