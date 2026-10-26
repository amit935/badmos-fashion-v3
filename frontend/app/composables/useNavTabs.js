import { gql } from 'graphql-request';
import { getClient } from '~/api/client';

const GET_COLLECTION_TREE = gql`
  query GetCollectionTree($slug: String!) {
    collection(slug: $slug) {
      name
      slug
      children {
        name
        slug
        children { name slug }
      }
    }
  }
`;

const TTL_MS = 60 * 1000;
const cache = new Map(); // slug -> { at, tree }

const normalizeSlug = (s) =>
  String(s || '').trim().toLowerCase().replace(/\s+/g, '-');

async function fetchTree(slug) {
  const hit = cache.get(slug);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.tree;
  try {
    const data = await getClient().request(GET_COLLECTION_TREE, { slug });
    cache.set(slug, { at: Date.now(), tree: data.collection });
    return data.collection;
  } catch (err) {
    console.warn(`Vendure collection "${slug}" could not be loaded`, err?.message);
    return null;
  }
}

// The slug is a container: its children become the dropdown columns
function toCategories(col) {
  return (col.children || []).map((child) => ({
    title: child.name,
    url: `/${child.slug}`,
    sections: (child.children || []).map((g) => ({
      title: g.name,
      url: `/${child.slug}/${g.slug}`,
      items: [],
    })),
  }));
}

async function resolveTab(tab) {
  const slugs = (tab.vendureCollections || [])
    .map((c) => normalizeSlug(c.slug))
    .filter(Boolean);

  if (tab.type !== 'dropdown' || slugs.length === 0) return tab;

  const trees = await Promise.all(slugs.map(fetchTree));
  const fromVendure = trees.filter(Boolean).flatMap(toCategories);

  if (tab.onlyFetchFromVendure) return { ...tab, categories: fromVendure };

  const manual = tab.categories || [];
  const manualFirst = tab.showManualListFirst !== false;
  return {
    ...tab,
    categories: manualFirst ? [...manual, ...fromVendure] : [...fromVendure, ...manual],
  };
}

// Call as: const { navTabs } = await useNavTabs(headerRef)
export async function useNavTabs(headerDataRef) {
  const { data } = await useAsyncData(
    'nav-tabs',
    async () => {
      const tabs = headerDataRef.value?.leftNavTabs;
      return tabs?.length ? await Promise.all(tabs.map(resolveTab)) : [];
    },
    { watch: [headerDataRef] }
  );
  return { navTabs: computed(() => data.value || []) };
}