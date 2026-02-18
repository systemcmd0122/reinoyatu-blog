"use client"

import React, { useState, useEffect } from "react"
import { useFormContext } from "react-hook-form"
import { 
  Users, 
  Search, 
  X, 
  Check, 
  Loader2,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { searchUsers } from "@/actions/user"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"

interface User {
  id: string
  name: string
  avatar_url: string | null
}

interface CoAuthorSelectorProps {
  currentUserId: string
  initialUsers?: User[]
}

const CoAuthorSelector: React.FC<CoAuthorSelectorProps> = ({ currentUserId, initialUsers = [] }) => {
  const { setValue, watch } = useFormContext()
  const coauthors: string[] = watch("coauthors") || []
  const [query, setQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<User[]>(initialUsers)
  const debouncedQuery = useDebounce(query, 500)

  // 初期化：既存のIDからユーザー情報を取得（本当はIDからProfileを取得するActionが必要）
  // ここでは簡易的に、現在選択されているユーザーの情報を保持する
  
  useEffect(() => {
    const fetchUsers = async () => {
      if (debouncedQuery.length < 2) {
        setSearchResults([])
        return
      }
      setIsSearching(true)
      const results = await searchUsers(debouncedQuery)
      setSearchResults(results.filter(u => u.id !== currentUserId))
      setIsSearching(false)
    }
    fetchUsers()
  }, [debouncedQuery, currentUserId])

  const toggleUser = (user: User) => {
    const isSelected = selectedUsers.some(u => u.id === user.id)
    let newSelected: User[]
    if (isSelected) {
      newSelected = selectedUsers.filter(u => u.id !== user.id)
    } else {
      newSelected = [...selectedUsers, user]
    }
    setSelectedUsers(newSelected)
    setValue("coauthors", newSelected.map(u => u.id), { shouldDirty: true })
  }

  const removeUser = (userId: string) => {
    const newSelected = selectedUsers.filter(u => u.id !== userId)
    setSelectedUsers(newSelected)
    setValue("coauthors", newSelected.map(u => u.id), { shouldDirty: true })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" />
          共同投稿者
        </h4>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="ユーザー名またはメールで検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 text-xs h-10 rounded-xl bg-muted/20 border-border"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {searchResults.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden bg-background shadow-sm animate-in fade-in slide-in-from-top-2">
          {searchResults.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => toggleUser(user)}
              className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar_url || "/default.png"} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-bold">{user.name}</p>
                </div>
              </div>
              {selectedUsers.some(u => u.id === user.id) ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Plus className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {selectedUsers.map((user) => (
          <Badge key={user.id} variant="secondary" className="pl-1 pr-2 py-1 gap-1 h-8 rounded-lg bg-muted border-border">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.avatar_url || "/default.png"} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-bold">@{user.name}</span>
            <button 
              type="button"
              onClick={() => removeUser(user.id)}
              className="ml-1 hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {selectedUsers.length === 0 && (
          <p className="text-[10px] text-muted-foreground italic px-1">共同投稿者は設定されていません。</p>
        )}
      </div>
    </div>
  )
}

export default CoAuthorSelector
