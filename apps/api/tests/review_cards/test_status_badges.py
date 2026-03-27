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


def test_compute_days_until_hazy_maps_zero_to_today_for_non_hazy(monkeypatch):
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
        == 0
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


def _badge_by_key(badges, key):
    return next(badge for badge in badges if badge["key"] == key)


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


def test_due_badge_uses_today_tomorrow_yesterday_copy_and_tones():
    due_review = SimpleNamespace(
        id=7, scheduled_at=date(2026, 3, 10), completed_at=None
    )
    card = _make_card(reviews=[due_review])

    today_badge = _badge_by_key(
        status_badges.build_review_card_status_badges(card, today=date(2026, 3, 10)),
        "due",
    )
    tomorrow_badge = _badge_by_key(
        status_badges.build_review_card_status_badges(card, today=date(2026, 3, 9)),
        "due",
    )
    yesterday_badge = _badge_by_key(
        status_badges.build_review_card_status_badges(card, today=date(2026, 3, 11)),
        "due",
    )

    assert today_badge["label"] == "Due Today"
    assert today_badge["tone"] == "info"
    assert tomorrow_badge["label"] == "Due Tomorrow"
    assert tomorrow_badge["tone"] == "neutral"
    assert yesterday_badge["label"] == "Due Yesterday"
    assert yesterday_badge["tone"] == "danger"


def test_hazy_soon_badge_uses_due_day_copy_and_tones():
    card = _make_card(
        freshness_tier="Fine",
        days_in_current_tier=None,
        days_until_next_tier=None,
    )

    today_badge = _badge_by_key(
        status_badges.build_review_card_status_badges(
            card,
            today=date(2026, 3, 10),
            days_until_hazy=0,
            resolve_due_badge=False,
        ),
        "hazy_soon",
    )
    tomorrow_badge = _badge_by_key(
        status_badges.build_review_card_status_badges(
            card,
            today=date(2026, 3, 10),
            days_until_hazy=1,
            resolve_due_badge=False,
        ),
        "hazy_soon",
    )

    assert today_badge["label"] == "Hazy Today"
    assert today_badge["tone"] == "info"
    assert tomorrow_badge["label"] == "Hazy Tomorrow"
    assert tomorrow_badge["tone"] == "neutral"


def test_hazy_for_badge_uses_today_yesterday_and_ago_copy_with_expected_tones():
    today_card = _make_card(freshness_tier="Hazy", days_in_current_tier=1)
    yesterday_card = _make_card(freshness_tier="Hazy", days_in_current_tier=2)
    ago_card = _make_card(freshness_tier="Hazy", days_in_current_tier=3)

    today_badge = _badge_by_key(
        status_badges.build_review_card_status_badges(
            today_card,
            today=date(2026, 3, 10),
            days_until_hazy=-1,
            resolve_due_badge=False,
        ),
        "hazy_for",
    )
    yesterday_badge = _badge_by_key(
        status_badges.build_review_card_status_badges(
            yesterday_card,
            today=date(2026, 3, 10),
            days_until_hazy=-2,
            resolve_due_badge=False,
        ),
        "hazy_for",
    )
    ago_badge = _badge_by_key(
        status_badges.build_review_card_status_badges(
            ago_card,
            today=date(2026, 3, 10),
            days_until_hazy=-3,
            resolve_due_badge=False,
        ),
        "hazy_for",
    )

    assert today_badge["label"] == "Hazy Today"
    assert today_badge["tone"] == "info"
    assert yesterday_badge["label"] == "Hazy Yesterday"
    assert yesterday_badge["tone"] == "warning"
    assert ago_badge["label"] == "Hazy 2d ago"
    assert ago_badge["tone"] == "warning"


def test_forgotten_badges_use_normalized_copy_and_remain_destructive():
    hazy_card = _make_card(
        freshness_tier="Hazy",
        days_in_current_tier=3,
        days_until_next_tier=1,
    )
    forgotten_card = _make_card(
        freshness_tier="Forgotten",
        days_in_current_tier=2,
        days_until_next_tier=None,
    )

    forgetting_badge = _badge_by_key(
        status_badges.build_review_card_status_badges(
            hazy_card, today=date(2026, 3, 10), resolve_due_badge=False
        ),
        "forgotten_soon",
    )
    forgotten_badge = _badge_by_key(
        status_badges.build_review_card_status_badges(
            forgotten_card, today=date(2026, 3, 10), resolve_due_badge=False
        ),
        "forgotten_for",
    )

    assert forgetting_badge["label"] == "Forgetting Tomorrow"
    assert forgetting_badge["tone"] == "danger"
    assert forgotten_badge["label"] == "Forgotten Yesterday"
    assert forgotten_badge["tone"] == "danger"
