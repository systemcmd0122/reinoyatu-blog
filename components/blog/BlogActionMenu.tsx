"use client"

import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreVertical, Layers, Share2, Trash2, FileEdit } from "lucide-react"
import AddToCollectionDialog from "@/components/collection/AddToCollectionDialog"
import { shareContent } from "@/utils/share"
import { BlogType } from "@/types"
import Link from "next/link"

interface BlogActionMenuProps {
  blog: BlogType
  isOwner: boolean
}

export default function BlogActionMenu({ blog, isOwner }: BlogActionMenuProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-xl">
          {isOwner && (
            <DropdownMenuItem
              className="rounded-lg font-bold gap-2 cursor-pointer"
              onClick={() => setIsAddOpen(true)}
            >
              <Layers className="h-4 w-4 text-primary" />
              シリーズに追加
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            className="rounded-lg font-bold gap-2 cursor-pointer"
            onClick={() => shareContent({
              title: blog.title,
              url: `${window.location.origin}/blog/${blog.id}`
            })}
          >
            <Share2 className="h-4 w-4 text-blue-500" />
            共有
          </DropdownMenuItem>

          {isOwner && (
            <>
              <DropdownMenuItem asChild className="rounded-lg font-bold gap-2 cursor-pointer">
                <Link href={`/blog/${blog.id}/edit`}>
                  <FileEdit className="h-4 w-4 text-green-500" />
                  編集
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AddToCollectionDialog
        blogId={blog.id}
        isOpen={isAddOpen}
        onOpenChange={setIsAddOpen}
      />
    </>
  )
}
