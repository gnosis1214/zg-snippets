# zg-snippets

Paste-ready recipes for WordPress, Elementor, Shopify, n8n, tracking and technical SEO work. Each one solves a single problem, says exactly where the code goes, and comes with a test.

By [Zeno](https://zana-g.com), full-stack web and AI developer. Built with Claude Code.

## Recipes

Every recipe lives in `recipes/<platform>/<name>/`, and its README explains how to use it.

| Recipe | Platform | What it does |
|---|---|---|
| [zg-hide-user-enumeration](recipes/wordpress/zg-hide-user-enumeration) | WordPress | Stops anonymous visitors from collecting usernames |
| [zg-product-schema](recipes/shopify/zg-product-schema) | Shopify | Product JSON-LD that follows Google's variant guidance |

## Using a recipe

1. Open the recipe's README and read **Where it goes** and **Tested**.
2. Copy the code into your project.
3. Try it on staging first. **Tested** says exactly how the recipe was checked, including anything that has not been run on a real site.

## Running the checks

You need Node 22 or newer and PHP on your PATH.

```bash
npm install
npm test
```

`npm test` lints PHP and JSON, runs Shopify Theme Check on Liquid files, scans for secrets and runs every recipe's tests.

## More

- [BACKLOG.md](BACKLOG.md): what's coming next
- [CONTRIBUTING.md](CONTRIBUTING.md): the rules every recipe follows

MIT licensed.
