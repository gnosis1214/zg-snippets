// Renders the snippet with LiquidJS, using stubs for Shopify-only filters.
// Run: node --test zg-product-schema.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { Liquid } from 'liquidjs';

const template = readFileSync(new URL('./zg-product-schema.liquid', import.meta.url), 'utf8');
const engine = new Liquid();
// Shopify returns protocol-relative image URLs, so the stub does the same.
engine.registerFilter('image_url', (image, ...args) => {
  const width = args.flat().find((value) => typeof value === 'number');
  return `//cdn.example.com/${image.src}?width=${width}`;
});

function variant(overrides = {}) {
  return {
    title: 'Red / Large',
    url: '/products/shirt?variant=1',
    price: 1999,
    available: true,
    sku: 'SHIRT-1',
    barcode: '012345678905',
    options: ['Red', 'Large', 'Slim'],
    image: null,
    ...overrides,
  };
}

function product(overrides = {}) {
  return {
    id: 42,
    title: 'Shirt',
    url: '/products/shirt',
    description: '<p>A <strong>soft</strong> shirt.</p>',
    vendor: 'Example Co',
    featured_image: { src: 'shirt.jpg' },
    has_only_default_variant: false,
    options_with_values: [{ name: 'Colour' }, { name: 'Size' }, { name: 'Fit' }],
    variants: [variant(), variant({ title: 'Blue / Large', url: '/products/shirt?variant=2', options: ['Blue', 'Large', 'Slim'], available: false })],
    metafields: {},
    ...overrides,
  };
}

async function render(data, currency = 'USD') {
  const html = await engine.parseAndRender(template, {
    product: data,
    cart: { currency: { iso_code: currency } },
    request: { origin: 'https://shop.example.com' },
  });
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*)<\/script>/);
  assert.ok(match, 'script tag should be present');
  return JSON.parse(match[1]);
}

test('several variants give a ProductGroup with hasVariant', async () => {
  const schema = await render(product());
  assert.equal(schema['@type'], 'ProductGroup');
  assert.equal(schema['@context'], 'https://schema.org');
  assert.equal(schema.productGroupID, '42');
  assert.equal(schema.url, 'https://shop.example.com/products/shirt');
  assert.equal(schema.description, 'A soft shirt.');
  assert.equal(schema.brand.name, 'Example Co');
  assert.equal(schema.hasVariant.length, 2);
  assert.equal(schema.offers, undefined);
});

test('variesBy lists only the options schema.org understands', async () => {
  const schema = await render(product());
  assert.deepEqual(schema.variesBy, ['https://schema.org/color', 'https://schema.org/size']);
  const [red] = schema.hasVariant;
  assert.equal(red.color, 'Red');
  assert.equal(red.size, 'Large');
  assert.equal(red.Fit, undefined);
});

test('variesBy is left out when no option maps to schema.org', async () => {
  const schema = await render(product({ options_with_values: [{ name: 'Fit' }] }));
  assert.equal(schema.variesBy, undefined);
  assert.equal(schema.hasVariant.length, 2);
});

test('offers carry price, currency, URL and availability', async () => {
  const [red, blue] = (await render(product())).hasVariant;
  assert.equal(red.name, 'Shirt - Red / Large');
  assert.deepEqual(red.offers, {
    '@type': 'Offer',
    url: 'https://shop.example.com/products/shirt?variant=1',
    price: 19.99,
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
  });
  assert.equal(blue.offers.availability, 'https://schema.org/OutOfStock');
});

test('a default-variant product gives one Product', async () => {
  const schema = await render(
    product({
      has_only_default_variant: true,
      options_with_values: [{ name: 'Title' }],
      variants: [variant({ title: 'Default Title', options: ['Default Title'] })],
    }),
  );
  assert.equal(schema['@type'], 'Product');
  assert.equal(schema['@context'], 'https://schema.org');
  assert.equal(schema.name, 'Shirt');
  assert.equal(schema.description, 'A soft shirt.');
  assert.equal(schema.offers.price, 19.99);
  assert.equal(schema.hasVariant, undefined);
});

test('prices use the presentment currency, including those with no subunit', async () => {
  const schema = await render(product({ variants: [variant({ price: 100000 })] }), 'JPY');
  assert.equal(schema.hasVariant[0].offers.price, 1000);
  assert.equal(schema.hasVariant[0].offers.priceCurrency, 'JPY');
});

test('gtin appears only for valid barcode lengths with digits only', async () => {
  const barcodes = {
    '12345678': true,
    '012345678905': true,
    '4006381333931': true,
    '12345678901234': true,
    '1234567': false,
    'ABC12345': false,
    '': false,
  };
  for (const [barcode, expected] of Object.entries(barcodes)) {
    const schema = await render(product({ variants: [variant({ barcode })] }));
    assert.equal(schema.hasVariant[0].gtin, expected ? barcode : undefined, `barcode "${barcode}"`);
  }
});

test('images are absolute, and a variant image wins over the featured image', async () => {
  const schema = await render(
    product({ variants: [variant(), variant({ image: { src: 'blue.jpg' } })] }),
  );
  assert.equal(schema.hasVariant[0].image, 'https://cdn.example.com/shirt.jpg?width=1200');
  assert.equal(schema.hasVariant[1].image, 'https://cdn.example.com/blue.jpg?width=1200');
});

test('optional fields are left out when empty', async () => {
  const schema = await render(
    product({ vendor: '', featured_image: null, variants: [variant({ sku: '', barcode: null })] }),
  );
  assert.equal(schema.brand, undefined);
  assert.equal(schema.aggregateRating, undefined);
  const [only] = schema.hasVariant;
  assert.equal(only.sku, undefined);
  assert.equal(only.gtin, undefined);
  assert.equal(only.image, undefined);
});

test('rating comes from the standard review metafields', async () => {
  const schema = await render(
    product({
      metafields: {
        reviews: {
          rating: { value: { rating: 4.5, scale_max: 5 } },
          rating_count: { value: 12 },
        },
      },
    }),
  );
  assert.deepEqual(schema.aggregateRating, {
    '@type': 'AggregateRating',
    ratingValue: 4.5,
    bestRating: 5,
    ratingCount: 12,
  });
});

test('no rating is output with zero reviews', async () => {
  const schema = await render(
    product({
      metafields: {
        reviews: {
          rating: { value: { rating: 0, scale_max: 5 } },
          rating_count: { value: 0 },
        },
      },
    }),
  );
  assert.equal(schema.aggregateRating, undefined);
});

test('quotes and line breaks in text stay valid JSON', async () => {
  const schema = await render(
    product({ title: 'The "Best" Shirt', description: '<p>Line one\nLine "two"</p>' }),
  );
  assert.equal(schema.name, 'The "Best" Shirt');
  assert.match(schema.description, /Line "two"/);
});

test('a blank product renders nothing', async () => {
  const html = await engine.parseAndRender(template, {});
  assert.equal(html.trim(), '');
});
