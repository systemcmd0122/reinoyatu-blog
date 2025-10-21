"use client"

import React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Eye } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import MarkdownRenderer from "./markdown/MarkdownRenderer"

interface PreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  content?: string
  summary?: string
  tags?: string[]
  imagePreview?: string | null
}

const PreviewDialog: React.FC<PreviewDialogProps> = ({
  isOpen,
  onClose,
  title,
  content,
  summary,
  tags,
  imagePreview,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0">
        <div className="h-full flex flex-col">
          <div className="flex-none p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Eye className="h-5 w-5 mr-2 text-blue-600" />
                プレビュー
              </h2>
              {content && (
                <p className="text-sm text-gray-500">
                  {content.length} 文字
                </p>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {!title && !content ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Eye className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">
                  プレビューがここに表示されます
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  タイトルや内容を入力するとプレビューできます
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {imagePreview && (
                  <div className="aspect-video rounded-lg overflow-hidden border border-gray-200">
                    <Image
                      src={imagePreview}
                      alt="Cover preview"
                      width={800}
                      height={400}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}

                {title && (
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {title}
                    </h1>
                  </div>
                )}

                {tags && tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {summary && (
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {summary}
                    </p>
                  </div>
                )}

                {(title || (tags && tags.length > 0) || summary) && content && (
                  <Separator />
                )}

                {content ? (
                  <div className="prose prose-base max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900">
                    <MarkdownRenderer content={content} />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400">記事内容を入力してください</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PreviewDialog