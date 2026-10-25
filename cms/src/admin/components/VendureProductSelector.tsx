import React, { useState, useEffect } from 'react';

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  asset?: string;
  price?: number;
  currency?: string;
}

interface CollectionItem {
  id: string;
  name: string;
  slug: string;
}

interface FacetItem {
  id: string;
  name: string;
  code: string;
  values?: Array<{ id: string; name: string; code: string }>;
}

interface VendureProductSelectorProps {
  name?: string;
  value?: any;
  onChange?: (e: { target: { name: string; value: any; type: string } }) => void;
  disabled?: boolean;
  [key: string]: any;
}

export default function VendureProductSelector({
  name = 'productSlugs',
  value,
  onChange,
  disabled = false
}: VendureProductSelectorProps) {
  // Normalize stored value (array of slug pointers)
  const currentSlugs: string[] = Array.isArray(value)
    ? value
    : typeof value === 'string' && value.trim()
    ? value.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const [filterType, setFilterType] = useState<'name' | 'collection' | 'facet' | 'all'>('name');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [selectedFacet, setSelectedFacet] = useState('');

  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [facets, setFacets] = useState<FacetItem[]>([]);
  const [searchResults, setSearchResults] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load collections & facets on mount
  useEffect(() => {
    fetchCollections();
    fetchFacets();
  }, []);

  const fetchCollections = async () => {
    try {
      const res = await fetch('/api/vendure/collections');
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setCollections(json.data);
      }
    } catch (err) {
      console.warn('Failed to load collections:', err);
    }
  };

  const fetchFacets = async () => {
    try {
      const res = await fetch('/api/vendure/facets');
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setFacets(json.data);
      }
    } catch (err) {
      console.warn('Failed to load facets:', err);
    }
  };

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filterType === 'name' && searchTerm) {
        params.append('term', searchTerm);
      } else if (filterType === 'collection' && selectedCollection) {
        params.append('collectionSlug', selectedCollection);
      } else if (filterType === 'facet' && selectedFacet) {
        params.append('facets', selectedFacet);
      }

      const res = await fetch(`/api/vendure/products?${params.toString()}`);
      const json = await res.json();

      if (json.products && Array.isArray(json.products)) {
        setSearchResults(json.products);
      } else {
        setSearchResults([]);
      }
    } catch (err: any) {
      setError(err.message || 'Error querying Vendure Admin API');
    } finally {
      setIsLoading(false);
    }
  };

  // Run search on initial render or filter changes
  useEffect(() => {
    handleSearch();
  }, [filterType, selectedCollection, selectedFacet]);

  const updateStoredSlugs = (newSlugs: string[]) => {
    if (onChange) {
      onChange({
        target: {
          name,
          value: newSlugs,
          type: 'json'
        }
      });
    }
  };

  const toggleProductSlug = (slug: string) => {
    if (!slug) return;
    if (currentSlugs.includes(slug)) {
      updateStoredSlugs(currentSlugs.filter(s => s !== slug));
    } else {
      updateStoredSlugs([...currentSlugs, slug]);
    }
  };

  const handleSelectAll = () => {
    const searchSlugs = searchResults.map(p => p.slug).filter(Boolean);
    const combined = Array.from(new Set([...currentSlugs, ...searchSlugs]));
    updateStoredSlugs(combined);
  };

  const handleDeselectAll = () => {
    const searchSlugs = searchResults.map(p => p.slug);
    const remaining = currentSlugs.filter(s => !searchSlugs.includes(s));
    updateStoredSlugs(remaining);
  };

  const handleRemoveSlug = (slugToRemove: string) => {
    updateStoredSlugs(currentSlugs.filter(s => s !== slugToRemove));
  };

  return (
    <div style={{
      border: '1px solid #dcdce4',
      borderRadius: '4px',
      padding: '16px',
      background: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#32324d', display: 'block' }}>
            Vendure Product Slug Pointers
          </label>
          <p style={{ fontSize: '11px', color: '#666687', margin: '2px 0 0 0' }}>
            Filter products from Vendure API by Collection, Facet, or Name, and check products to store their slug pointers.
          </p>
        </div>
        <span style={{
          background: '#eaeaef',
          color: '#4a4a6a',
          fontSize: '11px',
          fontWeight: 600,
          padding: '3px 8px',
          borderRadius: '12px'
        }}>
          {currentSlugs.length} Slugs Selected
        </span>
      </div>

      {/* Filter Controls Row */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '14px',
        alignItems: 'center',
        background: '#f6f6f9',
        padding: '10px',
        borderRadius: '4px'
      }}>
        {/* Filter Type Dropdown */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          disabled={disabled}
          style={{
            padding: '6px 10px',
            borderRadius: '4px',
            border: '1px solid #dcdce4',
            fontSize: '12px',
            fontWeight: 500,
            background: '#ffffff',
            cursor: 'pointer'
          }}
        >
          <option value="name">Filter by Product Name</option>
          <option value="collection">Filter by Collection</option>
          <option value="facet">Filter by Facet</option>
          <option value="all">All Vendure Products</option>
        </select>

        {/* Input depending on Filter Type */}
        {filterType === 'name' && (
          <input
            type="text"
            placeholder="Search product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            disabled={disabled}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #dcdce4',
              fontSize: '12px'
            }}
          />
        )}

        {filterType === 'collection' && (
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            disabled={disabled}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #dcdce4',
              fontSize: '12px',
              background: '#ffffff'
            }}
          >
            <option value="">Select Collection...</option>
            {collections.map(c => (
              <option key={c.id} value={c.slug}>{c.name} ({c.slug})</option>
            ))}
          </select>
        )}

        {filterType === 'facet' && (
          <select
            value={selectedFacet}
            onChange={(e) => setSelectedFacet(e.target.value)}
            disabled={disabled}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #dcdce4',
              fontSize: '12px',
              background: '#ffffff'
            }}
          >
            <option value="">Select Facet Value...</option>
            {facets.map(f => (
              <optgroup key={f.id} label={f.name}>
                {(f.values || []).map(val => (
                  <option key={val.id} value={val.id}>{val.name} ({val.code})</option>
                ))}
              </optgroup>
            ))}
          </select>
        )}

        <button
          type="button"
          onClick={handleSearch}
          disabled={disabled || isLoading}
          style={{
            padding: '6px 14px',
            background: '#4945ff',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Select All / Deselect All Bar */}
      <div style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
        padding: '0 4px'
      }}>
        <span style={{ fontSize: '11px', color: '#666687', fontWeight: 500 }}>
          {searchResults.length} matching products found
        </span>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={disabled || searchResults.length === 0}
            style={{
              background: '#eafbe7',
              color: '#277c16',
              border: '1px solid #c2f0bb',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Select All Matching
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            disabled={disabled || searchResults.length === 0}
            style={{
              background: '#fceaea',
              color: '#b72b2b',
              border: '1px solid #f5c2c2',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Deselect All Matching
          </button>
        </div>
      </div>

      {/* Search Results Grid */}
      <div style={{
        maxHeight: '220px',
        overflowY: 'auto',
        border: '1px solid #eaeaef',
        borderRadius: '4px',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        marginBottom: '14px',
        background: '#fafafc'
      }}>
        {isLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#8e8ea9', fontSize: '12px' }}>
            Fetching live products from Vendure API...
          </div>
        ) : error ? (
          <div style={{ padding: '12px', textAlign: 'center', color: '#d02b20', fontSize: '12px' }}>
            {error}
          </div>
        ) : searchResults.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#8e8ea9', fontSize: '12px' }}>
            No matching Vendure products found for this filter.
          </div>
        ) : (
          searchResults.map(product => {
            const isChecked = currentSlugs.includes(product.slug);
            return (
              <label
                key={product.id || product.slug}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: isChecked ? '1px solid #4945ff' : '1px solid #eaeaef',
                  background: isChecked ? '#f0f0ff' : '#ffffff',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  userSelect: 'none'
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleProductSlug(product.slug)}
                  disabled={disabled}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                {product.asset && (
                  <img
                    src={product.asset}
                    alt={product.name}
                    style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '3px' }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#272734' }}>
                    {product.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#4945ff', fontFamily: 'monospace' }}>
                    slug: {product.slug}
                  </div>
                </div>
              </label>
            );
          })
        )}
      </div>

      {/* Currently Stored Slug Pointers Badge Chips */}
      <div>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#666687', display: 'block', marginBottom: '6px' }}>
          Stored Slug Pointers (Saved in Strapi):
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {currentSlugs.length === 0 ? (
            <span style={{ fontSize: '11px', color: '#8e8ea9', italic: 'true' }}>
              No product slug pointers stored yet. Filter above and check products.
            </span>
          ) : (
            currentSlugs.map(slug => (
              <span
                key={slug}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#e9e8ff',
                  color: '#4945ff',
                  border: '1px solid #d0cffd',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  fontFamily: 'monospace'
                }}
              >
                {slug}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSlug(slug)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#4945ff',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: 0,
                      lineHeight: 1
                    }}
                  >
                    ×
                  </button>
                )}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
