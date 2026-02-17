"""Unit tests for retrievability utility functions.

These are pure-function tests — no database or Docker required.
"""

from datetime import date, timedelta

import pytest

from app.utils.retrievability import (
    FINE_THRESHOLD,
    FRESH_THRESHOLD,
    FSRS_DECAY,
    FSRS_FACTOR,
    HAZY_THRESHOLD,
    calculate_days_in_current_tier,
    calculate_days_until_threshold,
    calculate_retrievability,
    get_current_tier_entry_threshold,
    get_freshness_tier,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _days_to_reach(stability: float, target_r: float) -> float:
    """Exact (float) days from review until retrievability drops to target_r."""
    return (target_r ** (1 / FSRS_DECAY) - 1) * stability / FSRS_FACTOR


# ---------------------------------------------------------------------------
# get_current_tier_entry_threshold
# ---------------------------------------------------------------------------


class TestGetCurrentTierEntryThreshold:
    def test_none_retrievability(self):
        assert get_current_tier_entry_threshold(None) is None

    def test_fresh(self):
        assert get_current_tier_entry_threshold(0.98) is None

    def test_fine(self):
        assert get_current_tier_entry_threshold(0.90) == FRESH_THRESHOLD

    def test_hazy(self):
        assert get_current_tier_entry_threshold(0.80) == FINE_THRESHOLD

    def test_forgotten(self):
        assert get_current_tier_entry_threshold(0.50) == HAZY_THRESHOLD


# ---------------------------------------------------------------------------
# calculate_days_in_current_tier
# ---------------------------------------------------------------------------


class TestCalculateDaysInCurrentTier:
    """Verify days_in_current_tier for every freshness tier and edge cases."""

    # --- None / missing inputs ---

    def test_none_stability(self):
        assert calculate_days_in_current_tier(None, date(2026, 1, 1), 0.9) is None

    def test_none_last_reviewed_at(self):
        assert calculate_days_in_current_tier(10.0, None, 0.9) is None

    def test_none_retrievability(self):
        assert calculate_days_in_current_tier(10.0, date(2026, 1, 1), None) is None

    # --- Fresh tier ---

    def test_fresh_reviewed_today(self):
        today = date(2026, 2, 16)
        result = calculate_days_in_current_tier(
            stability=10.0,
            last_reviewed_at=today,
            retrievability=1.0,
            current_date=today,
        )
        assert result == 0

    def test_fresh_reviewed_recently(self):
        """Item reviewed 1 day ago with high stability → still Fresh."""
        today = date(2026, 2, 16)
        reviewed = today - timedelta(days=1)
        r = calculate_retrievability(50.0, reviewed, today)
        assert get_freshness_tier(r) == "Fresh"

        result = calculate_days_in_current_tier(50.0, reviewed, r, today)
        assert result == 1

    # --- Fine tier ---

    def test_fine_tier(self):
        """Item that just crossed into Fine tier should have ~0 days in tier."""
        stability = 20.0
        # Calculate the exact day when retrievability crosses FRESH_THRESHOLD
        days_to_fine = _days_to_reach(stability, FRESH_THRESHOLD)
        today = date(2026, 2, 16)
        # Place review exactly at the boundary + 1 day into Fine
        reviewed = today - timedelta(days=int(days_to_fine) + 1)
        r = calculate_retrievability(stability, reviewed, today)

        # Verify we're actually in Fine tier
        assert get_freshness_tier(r) == "Fine"

        result = calculate_days_in_current_tier(stability, reviewed, r, today)
        assert result >= 0
        # Should be approximately 1 day into Fine tier
        assert result <= 3

    def test_fine_tier_midway(self):
        """Item solidly in Fine tier for several days."""
        stability = 30.0
        days_to_fine = _days_to_reach(stability, FRESH_THRESHOLD)
        days_to_hazy = _days_to_reach(stability, FINE_THRESHOLD)
        # Place review so we're halfway between Fine entry and Hazy entry
        midpoint_days = int((days_to_fine + days_to_hazy) / 2)
        today = date(2026, 2, 16)
        reviewed = today - timedelta(days=midpoint_days)
        r = calculate_retrievability(stability, reviewed, today)

        assert get_freshness_tier(r) == "Fine"

        result = calculate_days_in_current_tier(stability, reviewed, r, today)
        expected_approx = midpoint_days - int(days_to_fine)
        assert abs(result - expected_approx) <= 1

    # --- Hazy tier ---

    def test_hazy_tier(self):
        """Item that just entered Hazy tier."""
        stability = 20.0
        days_to_hazy = _days_to_reach(stability, FINE_THRESHOLD)
        today = date(2026, 2, 16)
        reviewed = today - timedelta(days=int(days_to_hazy) + 1)
        r = calculate_retrievability(stability, reviewed, today)

        assert get_freshness_tier(r) == "Hazy"

        result = calculate_days_in_current_tier(stability, reviewed, r, today)
        assert result >= 0
        assert result <= 3

    def test_hazy_tier_deep(self):
        """Item well into Hazy tier (e.g., 5 days past the Fine threshold)."""
        stability = 20.0
        days_to_hazy = _days_to_reach(stability, FINE_THRESHOLD)
        extra_days = 5
        today = date(2026, 2, 16)
        reviewed = today - timedelta(days=int(days_to_hazy) + extra_days)
        r = calculate_retrievability(stability, reviewed, today)

        tier = get_freshness_tier(r)
        assert tier in (
            "Hazy",
            "Forgotten",
        )  # might be Forgotten if extra_days is large

        result = calculate_days_in_current_tier(stability, reviewed, r, today)
        if tier == "Hazy":
            assert abs(result - extra_days) <= 1
        else:
            # Forgotten — still should return a non-negative value
            assert result >= 0

    # --- Forgotten tier ---

    def test_forgotten_tier(self):
        """Item that has been forgotten."""
        stability = 10.0
        days_to_forgotten = _days_to_reach(stability, HAZY_THRESHOLD)
        extra_days = 10
        today = date(2026, 2, 16)
        reviewed = today - timedelta(days=int(days_to_forgotten) + extra_days)
        r = calculate_retrievability(stability, reviewed, today)

        assert get_freshness_tier(r) == "Forgotten"

        result = calculate_days_in_current_tier(stability, reviewed, r, today)
        assert abs(result - extra_days) <= 1

    # --- Consistency: result is always non-negative ---

    @pytest.mark.parametrize("stability", [5.0, 20.0, 50.0, 100.0])
    @pytest.mark.parametrize("elapsed_days", [0, 1, 5, 10, 30, 100, 365])
    def test_always_non_negative(self, stability: float, elapsed_days: int):
        today = date(2026, 2, 16)
        reviewed = today - timedelta(days=elapsed_days)
        r = calculate_retrievability(stability, reviewed, today)
        if r is None:
            return

        result = calculate_days_in_current_tier(stability, reviewed, r, today)
        assert result is not None
        assert result >= 0, (
            f"Got negative days_in_current_tier={result} for "
            f"stability={stability}, elapsed={elapsed_days}, tier={get_freshness_tier(r)}"
        )

    # --- Mathematical cross-check ---

    def test_days_in_tier_plus_remaining_equals_total_tier_span(self):
        """For non-Fresh tiers, days_in_current_tier + days_until_next_tier
        should roughly equal the full duration of the current tier band."""
        stability = 30.0
        today = date(2026, 2, 16)
        # Put item in Fine tier (midway)
        days_to_fine = _days_to_reach(stability, FRESH_THRESHOLD)
        days_to_hazy = _days_to_reach(stability, FINE_THRESHOLD)
        midpoint = int((days_to_fine + days_to_hazy) / 2)
        reviewed = today - timedelta(days=midpoint)
        r = calculate_retrievability(stability, reviewed, today)

        assert get_freshness_tier(r) == "Fine"

        days_in = calculate_days_in_current_tier(stability, reviewed, r, today)
        days_until = calculate_days_until_threshold(
            stability, reviewed, FINE_THRESHOLD, today
        )

        # days_in + days_until should ≈ total Fine band duration
        tier_span = int(days_to_hazy - days_to_fine)
        assert abs((days_in + days_until) - tier_span) <= 1
