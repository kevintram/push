---
name: tanstack-react-hotkeys
description: Implement or review keyboard shortcut features in the Web V2 React app using @tanstack/react-hotkeys. Use for hotkeys, multi-step sequences, shortcut recording, held-key state, platform-aware display, scoping, conflicts, or tests; not for keyboard behavior intrinsic to a single control.
---

# TanStack React Hotkeys

Build keyboard features that behave in their intended context, remain usable
across platforms, and have behavior-focused test coverage.

## Essential Rules

- Treat commands that invoke application behavior as shortcuts. Register them
  with `@tanstack/react-hotkeys` rather than manual `document` or `window`
  keyboard listeners.
- Keep `onKeyDown` on a component when the keyboard behavior is intrinsic to
  that control, such as arrow-key navigation, typeahead, or activation behavior.
- Use `Mod` for the primary cross-platform modifier.
- Make scope and conditional availability intentional. Local shortcuts belong
  to their owning element; global shortcuts must be deliberately global.

## References

- For ordinary single-chord shortcuts, options, scoping, or registration
  introspection, read [references/hotkeys.md](references/hotkeys.md).
- For ordered multi-chord commands, read
  [references/sequences.md](references/sequences.md).
- For a UI that captures one user-defined chord, read
  [references/hotkey-recording.md](references/hotkey-recording.md).
- For a UI that captures a user-defined chord sequence, read
  [references/hotkey-sequence-recording.md](references/hotkey-sequence-recording.md).
- For UI driven by currently held keys, read
  [references/key-state-tracking.md](references/key-state-tracking.md).
- For shortcut badges, labels, parsing, or validation, read
  [references/formatting-display.md](references/formatting-display.md).

Read only the references relevant to the requested feature. Testing guidance is
colocated with each feature type.
