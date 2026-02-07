"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { toast } from "sonner"
import { Wifi, WifiOff } from "lucide-react"

interface RealtimeContextType {
  isOnline: boolean
}

const RealtimeContext = createContext<RealtimeContextType>({ isOnline: true })

export const useRealtimeStatus = () => useContext(RealtimeContext)

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success("オンラインに復帰しました", {
        icon: <Wifi className="h-4 w-4 text-green-500" />,
        duration: 3000
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.error("オフラインになりました。一部の機能が制限されます", {
        icon: <WifiOff className="h-4 w-4 text-red-500" />,
        duration: Infinity
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <RealtimeContext.Provider value={{ isOnline }}>
      {children}
    </RealtimeContext.Provider>
  )
}
