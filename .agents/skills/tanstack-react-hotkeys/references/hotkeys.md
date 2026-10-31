# Hotkeys

Use this reference for ordinary single-chord shortcuts registered with
`useHotkey` or `useHotkeys`.

Official guide: [Hotkeys](https://tanstack.com/hotkeys/latest/docs/framework/react/guides/hotkeys)

## Design and Registration

Before registering a shortcut, identify its owning UI region, availability,
input-focus behavior, repeat behavior, native browser conflicts, and nearby app
bindings.

- Use `useHotkey` for one independently owned binding.
- Use `useHotkeys` for a collection, especially when it is dynamic.
- Scope local commands with `target`; use document scope only for intentionally
  global commands.
- Express conditional availability with `enabled`; never conditionally call a
  hotkey hook.
- Decide `ignoreInputs`, `preventDefault`, `stopPropagation`, `eventType`,
  `requireReset`, and `conflictBehavior` from the interaction's needs. Do not
  copy defaults from another package version.
- Use `requireReset` when holding a chord must not repeat a non-repeatable
  action.
- Add registration metadata when it will feed a shortcut palette, help UI, or
  devtools inspection.

When the same binding is registered and displayed, keep one shared value typed
with `Hotkey` or `satisfies Hotkey`. Surface shortcuts in the relevant UI when
users would not reasonably discover them otherwise.

## Tests

Drive the shortcut from the element that owns or receives it and assert the
resulting application behavior. Cover only branches that affect the feature:

- Intended chord and modifier.
- Disabled state.
- Local scope boundaries.
- Input-focused behavior.
- Key repetition.
- Native behavior or propagation when deliberately configured.

When platform detection affects a test, control the platform or deliberately
exercise the relevant Control and Meta variants.
