from datetime import date
from types import SimpleNamespace

from app.notes.status_badges import build_note_status_badges


def _make_note(**overrides):
    defaults = {
        "stability": 10.0,
        "last_reviewed_at": date(2026, 2, 10),
        "reviews": [],
        "freshness_tier": "Fine",
        "days_in_current_tier": None,
        "days_until_next_tier": None,
    }
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


class TestNoteStatusBadges:
    def test_hazy_note_shows_hazy_for_and_forgotten_soon(self):
        note = _make_note(
            freshness_tier="Hazy",
            days_in_current_tier=3,
            days_until_next_tier=2,
        )

        badges = build_note_status_badges(
            note,
            today=date(2026, 2, 21),
            days_until_hazy=10,
        )

        forgotten_soon = next(
            badge for badge in badges if badge["key"] == "forgotten_soon"
        )
        hazy_for = next(badge for badge in badges if badge["key"] == "hazy_for")

        assert forgotten_soon["label"] == "Forgetting in 2d"
        assert forgotten_soon["tooltip"] == "Feb 23, 2026"
        assert forgotten_soon["tone"] == "danger"
        assert hazy_for["label"] == "Hazy for 3d"
        assert hazy_for["tone"] == "warning"

    def test_forgotten_note_shows_forgotten_for(self):
        note = _make_note(
            freshness_tier="Forgotten",
            days_in_current_tier=9,
            days_until_next_tier=None,
        )

        badges = build_note_status_badges(
            note,
            today=date(2026, 2, 21),
            days_until_hazy=-3,
        )

        forgotten_for = next(
            badge for badge in badges if badge["key"] == "forgotten_for"
        )
        assert forgotten_for["label"] == "Forgotten for 9d"
        assert forgotten_for["tone"] == "danger"
