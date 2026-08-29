# Formatting and Display

Use this reference for platform-aware labels, shortcut badges, parsing, and
validation.

Official guide: [Formatting & Display](https://tanstack.com/hotkeys/latest/docs/framework/react/guides/formatting-display)

## Presentation and Validation

- Use `formatForDisplay` for the normal platform-aware UI representation.
- Use `formatWithLabels` when readable modifier names are preferable to symbols.
- Render formatted shortcut text with the app's `Kbd` primitive from
  `~/components/ui`; do not add raw `<kbd>` markup or duplicate its styling.
- Use `KbdGroup` when the design intentionally renders multiple individual
  `Kbd` key tokens as one shortcut.
- Keep one typed binding value for registration and display so the UI cannot
  drift from the active shortcut.
- Use `parseHotkey` when code needs structured key and modifier data, and
  `validateHotkey` at user-defined or otherwise untrusted binding boundaries.
- Pass an explicit platform when deterministic output is required, especially
  in tests. Otherwise allow platform detection to produce native labels.

`Kbd` and `KbdGroup` provide the semantic `<kbd>` markup. A shortcut badge
supplements an understandable action label; it should not be the only accessible
name for a control.

## Tests

Test the shared display primitive rather than repeating formatter assertions in
every consumer. Cover macOS and Windows/Linux output only when the component
promises platform-specific rendering. Test invalid input where user-defined
bindings enter the system.
