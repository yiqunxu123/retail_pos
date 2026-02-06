/**
 * Channels Hook
 * 
 * Provides channel list from PowerSync for dashboard filtering.
 */

import { useSyncStream } from '../useSyncStream';

export interface Channel {
  id: number;
  name: string;
  is_primary: number; // 0 or 1
}

export function useChannels() {
  const { data } = useSyncStream<Channel>(
    `SELECT id, name, is_primary FROM channels ORDER BY is_primary DESC, name ASC`
  );

  return {
    channels: data,
    primaryChannel: data.find(c => c.is_primary === 1) || data[0] || null,
  };
}
