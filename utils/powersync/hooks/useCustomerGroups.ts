/**
 * Customer Groups Data Hook
 * 
 * Provides real-time synced customer group data from PowerSync.
 * 
 * NOTE: description field does not exist in database, displayed as "-"
 * 
 * Usage:
 *   const { groups, isLoading } = useCustomerGroups();
 */

import { useMemo } from 'react';
import { useSyncStream } from '../useSyncStream';

// ============================================================================
// Types
// ============================================================================

/** Raw joined data from database */
interface CustomerGroupJoinRow {
  id: string;
  name: string;
  is_active: number;
  tier_id: number | null;
  created_at: string;
  updated_at: string;
  customer_count: number;
}

/** Customer group data as displayed in the UI */
export interface CustomerGroupView {
  id: string;
  name: string;
  description: string | null;  // DB does not have this field
  tierId: number | null;
  isActive: boolean;
  customerCount: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Data Transformers
// ============================================================================

/** Transform database record to UI view */
function toCustomerGroupView(db: CustomerGroupJoinRow): CustomerGroupView {
  return {
    id: db.id,
    name: db.name || '',
    description: null,  // DB does not have this field
    tierId: db.tier_id || null,
    isActive: db.is_active === 1,
    customerCount: db.customer_count || 0,
    createdAt: db.created_at || '',
    updatedAt: db.updated_at || '',
  };
}

// ============================================================================
// Hooks
// ============================================================================

/** Get all customer groups with real-time sync */
export function useCustomerGroups() {
  const { data, isLoading, error, isStreaming, refresh } = useSyncStream<CustomerGroupJoinRow>(
    `SELECT 
      cg.id,
      cg.name,
      cg.is_active,
      cg.tier_id,
      cg.created_at,
      cg.updated_at,
      COUNT(cgc.customer_id) as customer_count
     FROM customer_groups cg
     LEFT JOIN customer_groups_customer cgc ON cg.id = cgc.customer_group_id
     GROUP BY cg.id
     ORDER BY cg.name ASC`
  );

  const groups = useMemo(() => data.map(toCustomerGroupView), [data]);

  return {
    groups,
    isLoading,
    error,
    isStreaming,
    refresh,
    count: groups.length,
  };
}

/** Get a single customer group by ID */
export function useCustomerGroupById(id: string | null) {
  const { data, isLoading, error } = useSyncStream<CustomerGroupJoinRow>(
    `SELECT 
      cg.id,
      cg.name,
      cg.is_active,
      cg.tier_id,
      cg.created_at,
      cg.updated_at,
      COUNT(cgc.customer_id) as customer_count
     FROM customer_groups cg
     LEFT JOIN customer_groups_customer cgc ON cg.id = cgc.customer_group_id
     WHERE cg.id = ?
     GROUP BY cg.id`,
    id ? [id] : [],
    { enabled: !!id }
  );

  const group = useMemo(() => (data[0] ? toCustomerGroupView(data[0]) : null), [data]);

  return { group, isLoading, error };
}
