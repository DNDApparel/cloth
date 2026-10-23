/**
 * Regenerates `public/store-data.json` from the source catalogue in `src/data/`.
 *
 * The storefront fetches that JSON at boot, so it must be rebuilt and committed
 * whenever anything under `src/data/` changes — prices, products, copy or
 * settings. Run it with:
 *
 *     npm run publish:data
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { DEFAULT_STATIC_STORE } from '../src/data/storeConfig.js';

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, '../public/store-data.json');

writeFileSync(target, `${JSON.stringify(DEFAULT_STATIC_STORE, null, 2)}\n`);

const { products } = DEFAULT_STATIC_STORE;
console.log(`Wrote ${target}`);
console.log(`${products.length} products:`);
for (const product of products) {
  const wholesale = product.wholesalePrice
    ? `wholesale ${product.wholesalePrice} @ ${product.bulkMinQuantity}+`
    : 'no wholesale rate';
  console.log(`  ${product.id}  ${product.name} — retail ${product.price}, ${wholesale}`);
}
