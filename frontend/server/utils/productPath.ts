const ROOT = '__root_collection__';

// Container collections that exist only to group the menu. Never shown in URLs.
const HIDDEN_PREFIXES = ['shop-by-category'];

export function crumbSlugs(col: any): string[] {
  return (col?.breadcrumbs || [])
    .map((b: any) => b.slug)
    .filter((s: string) => s !== ROOT && !HIDDEN_PREFIXES.includes(s));
}

export function buildProductPath(collections: any[] = [], productSlug: string) {
  const deepest = collections.map(crumbSlugs).sort((a, b) => b.length - a.length)[0] || [];
  return '/' + [...deepest, productSlug].join('/');
}

export function buildCollectionPath(col: any) {
  return '/' + crumbSlugs(col).join('/');
}

export function buildBreadcrumbs(col: any): { name: string; path: string }[] {
  let path = '';
  return (col?.breadcrumbs || [])
    .filter((b: any) => b.slug !== ROOT && !HIDDEN_PREFIXES.includes(b.slug))
    .map((b: any) => {
      path += '/' + b.slug;
      return { name: b.name, path };
    });
}