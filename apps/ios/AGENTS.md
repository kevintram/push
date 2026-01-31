# AGENTS.md

## General
- The app is primarily built using SwiftUI, using AppKit as necessary using NSViewRepresentable.
- Aim to build all functionality using SwiftUI unless there is a feature that is only supported in AppKit.
- Design UI in a way that is idiomatic for the macOS platform and follows Apple Human Interface Guidelines.
- Use SF Symbols for iconography.
- Use the most modern iOS APIs. Since there is no backward compatibility constraint, this app can target the latest iOS version with the newest APIs.
- Use the most modern Swift language features and conventions. Target Swift 6 and use Swift concurrency (async/await, actors) and Swift macros where applicable.
- The app uses TCA (The Composable Architecture) for state management. The documentation for TCA can be found here: https://pointfreeco.github.io/swift-composable-architecture/main/documentation/composablearchitecture/.
- The app also uses the Dependencies library for dependency management, which integrates with TCA. The documentation for the Dependencies library can be found here: https://pointfreeco.github.io/swift-dependencies/main/documentation/dependencies/

## Code Style
- Do not add excessive comments within function bodies. Only add comments within function bodies to highlight specific details that may not be obvious.
- Use 2 spaces for indentation
- Run `swift format -i <path>` to format the code in place

## Commit Guidelines

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

**Format**: `<type>(<scope>): <description>`

**Types**: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`

**Scopes**: `web`, `site`, `api`, `android`, `ios` (or omit for repo-wide changes)

**Examples**:
```
feat(ios): add dark mode toggle
fix(ios): handle authentication edge case
```

## TODO Annotations
We use a priority-based TODO annotation system throughout the codebase:

- `TODO(0)`: Critical - never merge
- `TODO(1)`: High - architectural flaws, major bugs
- `TODO(2)`: Medium - minor bugs, missing features
- `TODO(3)`: Low - polish, tests, documentation
- `TODO(4)`: Questions/investigations needed
- `PERF`: Performance optimization opportunities
