import { describe, it, expect } from 'vitest';
import {
  crumbSlugs,
  buildProductPath,
  buildCollectionPath,
  buildBreadcrumbs,
} from '~~/server/utils/productPath';

const teeCollection = {
  breadcrumbs: [
    { name: 'root', slug: '__root_collection__' },
    { name: 'Shop by category', slug: 'shop-by-category' },
    { name: 'Men', slug: 'men' },
    { name: 'Tee', slug: 'tee' },
  ],
};

const menCollection = {
  breadcrumbs: [
    { name: 'root', slug: '__root_collection__' },
    { name: 'Shop by category', slug: 'shop-by-category' },
    { name: 'Men', slug: 'men' },
  ],
};

describe('crumbSlugs', () => {
  it('drops the root collection and hidden container collections', () => {
    expect(crumbSlugs(teeCollection)).toEqual(['men', 'tee']);
  });

  it('returns an empty list when there are no breadcrumbs', () => {
    expect(crumbSlugs({})).toEqual([]);
  });
});

describe('buildProductPath', () => {
  it('uses the deepest collection for the product URL', () => {
    const path = buildProductPath([menCollection, teeCollection], 'blue-tee');
    expect(path).toBe('/men/tee/blue-tee');
  });

  it('falls back to the bare slug when the product has no collections', () => {
    expect(buildProductPath([], 'blue-tee')).toBe('/blue-tee');
  });
});

describe('buildCollectionPath', () => {
  it('joins the visible breadcrumb slugs', () => {
    expect(buildCollectionPath(teeCollection)).toBe('/men/tee');
  });
});

describe('buildBreadcrumbs', () => {
  it('returns name and cumulative path for each visible level', () => {
    expect(buildBreadcrumbs(teeCollection)).toEqual([
      { name: 'Men', path: '/men' },
      { name: 'Tee', path: '/men/tee' },
    ]);
  });
});