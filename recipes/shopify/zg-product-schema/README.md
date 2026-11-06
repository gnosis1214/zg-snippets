# zg-product-schema

## What it does

Outputs Product JSON-LD that follows [Google's product variant guidance](https://developers.google.com/search/docs/appearance/structured-data/product-variants). A product with several variants becomes a `ProductGroup` with `hasVariant`, and a product with no variants becomes a single `Product`.

It handles the mistakes that commonly break this markup:

- **Variants:** doesn't use `AggregateOffer`, which [Google says not to use for variants](https://developers.google.com/search/docs/appearance/structured-data/product-snippet).
- **Prices:** uses `divided_by: 100.0`, because money filters can output `1.234,56` in some locales. Shopify stores prices in subunits even for currencies with none, so ¥1000 is `100000` and still divides correctly.
- **Currency:** uses `cart.currency.iso_code`, the customer's currency, because `shop.currency` can disagree with the price shown in a multi-currency store.
- **Images:** adds `https:` because `image_url` returns URLs that start with `//`.
- **Barcodes:** outputs `gtin` only if the barcode is 8, 12, 13 or 14 digits, so internal codes aren't published as GTINs.
- **Options:** `variesBy` lists only color, size, material and pattern. Other options, like "Fit", are left out.

## Where it goes

1. Save the file as `snippets/zg-product-schema.liquid`.
2. Add this line to your main product section, such as `sections/main-product.liquid`:

```liquid
{% render 'zg-product-schema', product: product %}
```

## How to use

1. **Remove the theme's own product schema first**, or you'll publish two versions. Search the theme for `structured_data` and `application/ld+json`.
2. Duplicate the theme, add the snippet and open a product page.
3. Paste the page URL into [Google's Rich Results Test](https://search.google.com/test/rich-results).

Ratings use Shopify's standard metafields, `reviews.rating` and `reviews.rating_count`. They only appear if your review app fills those in and the count is above zero.

Shopify returns at most 250 variants from `product.variants`, so larger products are cut off at that point.

## Tested

- 13 tests that render the snippet with LiquidJS and parse the resulting JSON (`zg-product-schema.test.mjs`). Shopify-only filters are stubbed.
- Shopify Theme Check, with the recommended rules.
- **Not yet run on a real Shopify store or through the Rich Results Test.** Try it on a duplicate theme first.
