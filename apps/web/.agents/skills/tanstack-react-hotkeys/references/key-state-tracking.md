# Key State Tracking

Use this reference for reactive UI based on keys that are currently held. This
is distinct from registering a command callback.

Official guide: [Key State Tracking](https://tanstack.com/hotkeys/latest/docs/framework/react/guides/key-state-tracking)

## Choose the Smallest Subscription

- Use `useKeyHold` when the UI needs the state of one known key.
- Use `useHeldKeys` when the UI must render or reason about all held key names.
- Use `useHeldKeyCodes` only when physical `KeyboardEvent.code` information is
  relevant, such as distinguishing left and right modifier keys or debugging.

Treat held-key state as transient UI state. Do not persist it or use it as a
substitute for an application shortcut. Account for window blur and platform
modifier quirks when a feature depends on release events.

## Tests

Drive keydown and keyup and assert the visible state or behavior. Add a blur or
platform-specific case only when the feature depends on it. Ensure subscriptions
clean up when the owning component unmounts.
