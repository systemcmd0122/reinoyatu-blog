import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

interface AuthHook {
  user: User | null
}

export function useAuth(): AuthHook {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // 初期状態の取得
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }
    
    getInitialSession()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user }
}