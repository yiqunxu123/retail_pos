/**
 * Categories Data Hook
 *
 * Provides real-time synced category data from PowerSync.
 * Includes product counts per category.
 */

import { useMemo } from 'react';
import { useSyncStream } from '../useSyncStream';

interface CategoryRow {
  id: string;
  name: string;
  product_count: number;
}

export interface CategoryView {
  id: string;
  name: string;
  productCount: number;
}

/** Get all categories with product counts */
export function useCategories() {
  const { data, isLoading, error } = useSyncStream<CategoryRow>(
    `SELECT 
      c.id,
      c.name,
      COUNT(p.id) AS product_count
     FROM categories c
     LEFT JOIN products p ON p.main_category_id = c.id
     GROUP BY c.id, c.name
     ORDER BY c.name ASC`
  );

  const categories = useMemo(
    () =>
      data.map((row) => ({
        id: row.id,
        name: row.name || 'Unnamed',
        productCount: row.product_count || 0,
      })),
    [data]
  );

  return { categories, isLoading, error };
}
