# Contributing to Lumiqe

Thank you for helping make personal color tools more useful and more honest. You can contribute code, design, documentation, accessibility improvements, test cases, or evaluation ideas.

## Start here

1. Read the [README](README.md) and [code of conduct](CODE_OF_CONDUCT.md).
2. Browse [open issues](https://github.com/DineshDhanoki/Lumiqe/issues). `good first issue` tasks should have a small scope and acceptance criteria.
3. Comment on an issue if you would like to work on it. For a large change, propose the approach there before coding so effort is not duplicated.
4. Fork the repository, create a branch, make your change, and open a pull request against `main`. You do not need write access to the main repository.

Maintainers review pull requests before merging. Please be patient; a request for changes is part of collaboration, not a rejection.

## Setup and checks

Follow [Run it locally](README.md#run-it-locally). Work from the relevant directory:

```bash
cd frontend
npm ci
npm run lint
npm run typecheck
npm test -- --run
```

```bash
cd backend
pip install -r requirements-dev.txt
ruff check app/
pytest tests/ -q
```

If a test needs PostgreSQL, Redis, model weights, or a service credential that you do not have, explain what you ran and what was blocked in the pull request. CI runs the full configured suite. Add or update tests when behavior changes; documentation-only changes do not need new tests.

## Pull request checklist

- Keep the change focused and link the issue it addresses.
- Explain the user-visible result, approach, and any limitations.
- Add screenshots or a short recording for visual changes, using demo or synthetic data only.
- Include the commands you ran and their results.
- Update documentation when setup, configuration, API behavior, or privacy handling changes.
- Never commit secrets, real faces, customer data, or third-party content you cannot redistribute.
- If you change color analysis behavior, describe how you tested it across lighting and skin tones. Do not claim accuracy or fairness from a single image.

We generally use conventional commit prefixes such as `feat:`, `fix:`, `docs:`, and `test:`. Clear pull request descriptions matter more than perfect commit wording.

## Security and safety

Use the private reporting route in [SECURITY.md](SECURITY.md) for vulnerabilities. Do not publish exploit details in a public issue. For ordinary bugs, use the bug report form and strip personal data from logs.
