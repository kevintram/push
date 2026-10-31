# Hotkey Recording

Use this reference for a customization UI that captures one chord from the
user. Do not use a recorder merely to implement a fixed application shortcut.

Official guide: [Hotkey Recording](https://tanstack.com/hotkeys/latest/docs/framework/react/guides/hotkey-recording)

## Recording UI

Use `useHotkeyRecorder` and render its lifecycle explicitly: idle, recording,
recorded, cancelled, and cleared. Provide an obvious way to start and cancel
recording, and make the current state accessible without relying only on color.

- Persist a binding from `onRecord`, not from incomplete recording state.
- Handle `onCancel` and `onClear` according to the settings UI's semantics.
- Decide `ignoreInputs` deliberately. Recording from a focused input usually
  requires opting in, while ordinary typing must remain safe elsewhere.
- Recorded primary modifiers use portable `Mod`; preserve that normalized form.
- Validate conflicts and reserved/native shortcuts before accepting or
  activating a new binding.
- Display the result with the formatting utilities rather than hand-authored
  platform symbols.

## Tests

Cover start, successful capture, cancel, clear, and the chosen input-focus
behavior. Assert persisted settings only after a completed recording. Include
conflict or invalid-binding behavior when the product exposes it.
