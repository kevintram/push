from datetime import date


# FSRS constants from py-fsrs
FSRS_DECAY = -0.1542
FSRS_FACTOR = 0.9 ** (1 / FSRS_DECAY) - 1  # approximately 8.96

# Freshness tier thresholds (lower bound exclusive, upper bound inclusive)
FRESH_THRESHOLD = 0.95
FINE_THRESHOLD = 0.85
HAZY_THRESHOLD = 0.75


def calculate_retrievability(
    stability: float | None,
    last_reviewed_at: date | None,
    current_date: date | None = None,
) -> float | None:
    """
    Calculate retrievability based on FSRS formula.

    Formula: R = (1 + FACTOR * elapsed_days / stability) ^ DECAY

    Returns None if stability or last_reviewed_at is None.
    Returns 1.0 if reviewed today (0 elapsed days).
    """
    if stability is None or last_reviewed_at is None:
        return None

    if current_date is None:
        current_date = date.today()

    elapsed_days = max(0, (current_date - last_reviewed_at).days)

    if elapsed_days == 0:
        return 1.0

    return (1 + FSRS_FACTOR * elapsed_days / stability) ** FSRS_DECAY


def get_freshness_tier(retrievability: float | None) -> str | None:
    """Map retrievability to a freshness tier."""
    if retrievability is None:
        return None
    if retrievability > FRESH_THRESHOLD:
        return "Fresh"
    if retrievability > FINE_THRESHOLD:
        return "Fine"
    if retrievability > HAZY_THRESHOLD:
        return "Hazy"
    return "Forgotten"


def get_next_tier_threshold(retrievability: float | None) -> float | None:
    """Get the retrievability threshold for the next tier."""
    tier = get_freshness_tier(retrievability)
    if tier is None:
        return None
    if tier == "Fresh":
        return FRESH_THRESHOLD
    if tier == "Fine":
        return FINE_THRESHOLD
    if tier == "Hazy":
        return HAZY_THRESHOLD
    return None


def get_current_tier_entry_threshold(retrievability: float | None) -> float | None:
    """Get the retrievability threshold that was crossed to enter the current tier.

    Returns the upper bound of the current tier (the threshold crossed from above).
    Returns None for Fresh tier (entered at review time) or if retrievability is None.
    """
    tier = get_freshness_tier(retrievability)
    if tier is None or tier == "Fresh":
        return None
    if tier == "Fine":
        return FRESH_THRESHOLD
    if tier == "Hazy":
        return FINE_THRESHOLD
    # Forgotten
    return HAZY_THRESHOLD


def calculate_days_in_current_tier(
    stability: float | None,
    last_reviewed_at: date | None,
    retrievability: float | None,
    current_date: date | None = None,
) -> int | None:
    """Calculate how many days the entity has been in its current freshness tier.

    For Fresh tier: returns elapsed days since last review.
    For other tiers: computes when the entry threshold was crossed using the inverse
    FSRS formula.
    """
    if stability is None or last_reviewed_at is None or retrievability is None:
        return None

    if current_date is None:
        current_date = date.today()

    tier = get_freshness_tier(retrievability)
    if tier is None:
        return None

    entry_threshold = get_current_tier_entry_threshold(retrievability)
    if entry_threshold is None:
        # Fresh tier: been in this tier since last review
        return max(0, (current_date - last_reviewed_at).days)

    # For Fine/Hazy/Forgotten: calculate_days_until_threshold returns negative
    # when the threshold was crossed in the past. Negate to get positive days.
    return -calculate_days_until_threshold(
        stability, last_reviewed_at, entry_threshold, current_date
    )


def calculate_days_until_threshold(
    stability: float,
    last_reviewed_at: date | None,
    target_retrievability: float,
    current_date: date | None = None,
) -> int:
    """
    Calculate days until retrievability crosses a threshold.

    Formula derivation (solving for elapsed_days):
    R = (1 + F * d / S)^D
    R^(1/D) = 1 + F * d / S
    (R^(1/D) - 1) * S / F = d

    Returns positive for future dates (days until threshold reached),
    negative for past dates (days since threshold was crossed).
    """
    if current_date is None:
        current_date = date.today()

    if last_reviewed_at is None:
        last_reviewed_at = current_date

    # Days from last_reviewed_at when target retrievability is reached
    target_days_from_review = (
        (target_retrievability ** (1 / FSRS_DECAY) - 1) * stability / FSRS_FACTOR
    )

    elapsed_days = (current_date - last_reviewed_at).days

    return int(target_days_from_review - elapsed_days)
