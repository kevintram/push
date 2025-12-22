from datetime import date


# FSRS constants from py-fsrs
FSRS_DECAY = -0.1542
FSRS_FACTOR = 0.9 ** (1 / FSRS_DECAY) - 1  # approximately 8.96


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
