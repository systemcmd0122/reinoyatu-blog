"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { ProfileType } from "@/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import FollowButton from "./FollowButton"
import { motion } from "framer-motion"

interface UserListProps {
  users: ProfileType[]
  currentUserId?: string
}

const UserList: React.FC<UserListProps> = ({ users, currentUserId }) => {
  if (users.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-[2rem] border-2 border-dashed border-border/50">
        <p className="font-medium text-lg">ユーザーが見つかりません</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {users.map((user, index) => (
        <motion.div
          key={user.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Card className="rounded-2xl border-border/50 hover:shadow-md transition-all duration-300 group overflow-hidden">
            <CardContent className="p-5 flex items-center justify-between gap-4">
              <Link href={`/profile/${user.id}`} className="flex items-center gap-4 flex-1 min-w-0 group/info">
                <Avatar className="h-12 w-12 border-2 border-background shadow-sm group-hover/info:scale-105 transition-transform duration-300">
                  <AvatarImage src={user.avatar_url || "/default.png"} className="object-cover" />
                  <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="font-bold text-foreground group-hover/info:text-primary transition-colors truncate">
                    {user.name}
                  </h3>
                  {user.introduce && (
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {user.introduce}
                    </p>
                  )}
                </div>
              </Link>

              <div className="shrink-0 scale-90">
                <FollowButton
                  followerId={currentUserId}
                  followingId={user.id}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

export default UserList
