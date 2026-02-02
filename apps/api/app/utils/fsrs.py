from app.models import FsrsState


def apply_inherited_fsrs(target: FsrsState, source: FsrsState) -> None:
    target.inherited_stability = source.stability
    target.inherited_difficulty = source.difficulty
    target.inherited_state = source.state
    target.inherited_step = source.step
    target.inherited_last_review = source.last_reviewed_at
