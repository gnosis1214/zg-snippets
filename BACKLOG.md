# Backlog

Work top to bottom. Tick items off when they land, and keep at least 10 open.

## Recipes

### WordPress and Elementor

- [ ] `wordpress/zg-security-headers`: send security headers through the `wp_headers` filter, with a safe default set
- [ ] `wordpress/zg-disable-xmlrpc`: turn off XML-RPC and remove its discovery links
- [ ] `wordpress/zg-attachment-redirect`: send attachment pages to the parent post or home, with a 301
- [ ] `wordpress/zg-local-business-schema`: LocalBusiness JSON-LD built from a filterable array
- [ ] `wordpress/zg-llms-txt-route`: serve `/llms.txt` from a stored option through a rewrite rule
- [ ] `wordpress/zg-callout-block`: a Gutenberg callout block using `block.json`, with no build step
- [ ] `wordpress/zg-woo-min-order`: minimum order notice for WooCommerce, covering classic and block checkout
- [ ] `elementor/zg-form-utm-capture`: copy UTM values into hidden Elementor form fields
- [ ] `elementor/zg-form-webhook-retry`: send Elementor form leads to a webhook through `elementor_pro/forms/new_record`, with a retry
- [ ] `elementor/zg-overflow-finder`: a console snippet that lists the elements causing horizontal scroll on mobile

### Shopify

- [ ] `shopify/zg-free-shipping-bar`: free shipping progress bar that updates with cart changes
- [ ] `shopify/zg-breadcrumb-schema`: BreadcrumbList JSON-LD snippet for products and collections
- [ ] `shopify/zg-sticky-atc`: sticky add-to-cart section for product pages
- [ ] `shopify/zg-metaobject-testimonials`: testimonials section driven by a metaobject
- [ ] `shopify/zg-missing-alt-report`: read-only Admin GraphQL script that lists product images with no alt text

### n8n

- [ ] `n8n/zg-lead-router`: webhook workflow that validates a lead and routes it, with the Code node logic tested separately
- [ ] `n8n/zg-error-alert`: Error Trigger workflow that posts failures to Slack
- [ ] `n8n/zg-uptime-check`: scheduled URL check that alerts only when the status changes

### Tracking and SEO

- [ ] `tracking/zg-calendly-datalayer`: push Calendly embed events into the GTM `dataLayer`
- [ ] `tracking/zg-meta-event-id`: shared event ID helper for Meta Pixel and Conversions API deduplication
- [ ] `seo/zg-sitemap-check`: Node CLI that crawls a sitemap and reports 404s and redirect chains
- [ ] `seo/zg-jsonld-extract`: Node CLI that pulls JSON-LD from a URL and reports parse errors
- [ ] `seo/zg-llms-draft`: Node CLI that drafts `llms.txt` from a sitemap

### Next.js and MCP

- [ ] `nextjs/zg-revalidate-webhook`: signed route handler that revalidates pages from a CMS webhook
- [ ] `nextjs/zg-contact-action`: contact form server action with validation and a honeypot
- [ ] `mcp/zg-http-check-server`: minimal MCP server with one tool that checks a URL

## Maintenance

These must not change visible design or written copy.

- [ ] `portfolio`: check every external link in `index.html` and `llms.txt`, and fix or report broken ones
- [ ] `portfolio`: add a link-check script so that check can be repeated
- [ ] `github-profile`: check every link in `README.md`, and fix or report broken ones
- [ ] `github-profile`: add tests for the number formatting used by the activity card
