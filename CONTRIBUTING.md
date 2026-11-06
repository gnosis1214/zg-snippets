# How recipes work

## A recipe is

- One problem, solved in one folder: `recipes/<platform>/zg-<name>/`.
- Code that can be pasted in as it is. Custom functions and classes start with `zg_` or `zg-`.
- At least one automated test (`*.test.mjs` or `*.test.php`).
- A README with these four headings:
  - `## What it does`
  - `## Where it goes`: the exact file or setting
  - `## How to use`
  - `## Tested`: how it was checked, and what has not been checked

## Rules

- **Be honest in `## Tested`.** Say "unit tests with stubbed functions" if that is what ran. Only say a recipe ran on real WordPress, Shopify or n8n if it did.
- **Check current docs first.** Platform APIs change, so read the official docs before writing the code.
- **No client code.** Nothing copied from a client project, and no client names, URLs or data.
- **No secrets.** Use placeholders and `.env.example`.

## Commits

One commit per logical change, for example:

```text
feat: add zg-example recipe
test: cover zg-example edge cases
docs: explain zg-example setup
```

No empty, backdated, log-file or whitespace-only commits. If there is nothing useful to do today, there is no commit today.

## Before pushing

```bash
npm test
```

Then add the recipe to the table in `README.md` and tick it off in `BACKLOG.md`.
