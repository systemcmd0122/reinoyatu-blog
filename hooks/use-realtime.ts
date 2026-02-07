import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  RealtimePostgresChangesPayload, 
  RealtimeChannel,
  RealtimePresenceState
} from '@supabase/supabase-js'

/**
 * Supabase Postgres Changesを購読するための汎用フック
 */
export function useRealtime<T extends { id: string; updated_at?: string }>(
  table: string,
  config: {
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
    schema?: string
    filter?: string
  } = {}
) {
  const supabase = createClient()
  const [lastEvent, setLastEvent] = useState<RealtimePostgresChangesPayload<T> | null>(null)
  
  // 最後に処理したイベントのタイムスタンプ（重複排除用）
  const lastProcessedRef = useRef<Record<string, number>>({})

  useEffect(() => {
    const { event = '*', schema = 'public', filter } = config

    const channel = supabase
      .channel(`realtime-${table}-${filter || 'all'}`)
      .on(
        'postgres_changes',
        { event, schema, table, filter },
        (payload: RealtimePostgresChangesPayload<T>) => {
          const record = (payload.new || payload.old) as T
          if (!record?.id) return

          const newTimestamp = record.updated_at ? new Date(record.updated_at).getTime() : Date.now()
          const lastTimestamp = lastProcessedRef.current[record.id] || 0

          // 古いイベント（または同時刻の重複）は無視する
          if (newTimestamp <= lastTimestamp && payload.eventType !== 'DELETE') {
            return
          }

          lastProcessedRef.current[record.id] = newTimestamp
          setLastEvent(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, config.event, config.schema, config.filter])

  return lastEvent
}

/**
 * Supabase Presenceを使用してオンラインユーザー状態を追跡するフック
 */
export function usePresence<T extends { [key: string]: any } = any>(
  channelName: string,
  userStatus: T
) {
  const supabase = createClient()
  const [presenceState, setPresenceState] = useState<RealtimePresenceState>({})
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const channel = supabase.channel(`presence-${channelName}`)
    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        setPresenceState(channel.presenceState())
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // console.log('join', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // console.log('leave', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(userStatus)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelName, JSON.stringify(userStatus)])

  return presenceState
}

/**
 * Supabase Broadcastを使用して軽量なメッセージを即座に同期するフック
 */
export function useBroadcast<T = any>(
  channelName: string,
  onMessage: (payload: T) => void
) {
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const channel = supabase.channel(`broadcast-${channelName}`)
    channelRef.current = channel

    channel
      .on('broadcast', { event: 'message' }, (payload) => {
        onMessage(payload.payload)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelName, onMessage])

  const send = useCallback((payload: T) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'message',
        payload
      })
    }
  }, [])

  return { send }
}
