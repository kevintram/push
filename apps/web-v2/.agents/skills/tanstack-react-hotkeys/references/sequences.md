# Sequences

Use this reference for ordered multi-chord commands such as `G`, then `G`.

Official guide: [Sequences](https://tanstack.com/hotkeys/latest/docs/framework/react/guides/sequences)

## Design and Registration

Use a sequence only when a staged command is genuinely clearer than a single
chord. Users must be able to understand that the app is waiting for another
step when the sequence is not already conventional in its context.

- Use `useHotkeySequence` for one sequence and `useHotkeySequences` for a
  collection, especially a dynamic collection.
- Represent steps as a `HotkeySequence`; each step may include modifiers.
- Choose `timeout` from the interaction rather than stretching it to mask an
  unclear sequence.
- Apply the same intentional scope, availability, input-focus, browser-default,
  and conflict decisions used for ordinary hotkeys.
- Check overlapping sequences and shared prefixes. Confirm the shorter and
  longer commands resolve as intended within the timeout.
- Add metadata when registrations will appear in help or inspection UI.

## Tests

Assert behavior after the complete ordered sequence, not internal manager
progress. Add relevant cases for incorrect order, timeout expiry, disabled
state, scope, input focus, overlapping prefixes, and modifier-bearing steps.
Use fake timers when timeout behavior is the subject of the test.
