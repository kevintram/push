# Thoughts Directory

This directory contains research documents, implementation plans, and other structured notes generated during development workflows.

## Structure

```
thoughts/
├── shared/           # Team-shared documents
│   ├── research/    # Research documents from /research command
│   ├── plans/       # Implementation plans from /plan command
│   └── images/      # Images referenced in research documents
└── global/          # Cross-repository thoughts and notes
```

## Usage

### Research (`shared/research/`)
Contains research documents created by the `/research` command. These documents capture:
- Codebase analysis and patterns
- Technology investigations
- Architecture explorations

### Plans (`shared/plans/`)
Contains implementation plans created by the `/plan` command. These documents include:
- Step-by-step implementation guides
- Architecture decisions
- Task breakdowns with verification gates

### Images (`shared/images/`)
Contains images referenced by research and plan documents.

### Global (`global/`)
Contains cross-cutting notes and thoughts that span multiple features or repositories.

## Naming Conventions

- Research: `{topic}-research.md` (e.g., `authentication-research.md`)
- Plans: `{feature}-plan.md` (e.g., `user-dashboard-plan.md`)
- Images: `{document-name}-{description}.png`
