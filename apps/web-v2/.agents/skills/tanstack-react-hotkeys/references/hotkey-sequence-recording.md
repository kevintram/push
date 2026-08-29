# Hotkey Sequence Recording

Use this reference for a customization UI that captures multiple ordered
chords.

Official guide: [Sequence Recording](https://tanstack.com/hotkeys/latest/docs/framework/react/guides/sequence-recording)

## Recording UI

Use `useHotkeySequenceRecorder`. Distinguish its in-progress `steps` from the
last committed `recordedSequence`, and expose start, cancel, and commit behavior
clearly.

- Choose and communicate the commit policy: commit key, manual commit, or idle
  timeout.
- Show captured steps while recording so users can correct or cancel before
  committing.
- Persist only a committed non-empty sequence.
- Decide `ignoreInputs`, clearing, commit keys, and idle timeout from the
  settings interaction.
- Normalize portable modifiers, validate conflicts and overlapping prefixes,
  and format each chord with the library utilities.

## Tests

Cover starting, appending steps, committing, cancelling, clearing or deleting a
step, and the chosen input-focus behavior. When enabled, test idle-timeout
behavior with controlled timers. Assert that incomplete steps are not
persisted.
