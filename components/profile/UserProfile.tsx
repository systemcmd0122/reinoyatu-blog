"use client"

import { useCallback, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Globe, Mail, Calendar, Github, Twitter, Linkedin, Instagram, Facebook } from "lucide-react"
import { formatJST } from "@/utils/date"
import { ProfileType, BlogType } from "@/types"
import { createClient } from "@/utils/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import BlogItem from "@/components/blog/BlogItem"

interface UserProfileProps {
  profile: ProfileType
  isOwnProfile?: boolean
}

const UserProfile: React.FC<UserProfileProps> = ({ profile, isOwnProfile = false }) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts')
  const [blogPosts, setBlogPosts] = useState<BlogType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // ブログ投稿を取得
  useEffect(() => {
    const fetchBlogPosts = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('blogs')
        .select(`
          *,
          profiles (
            id,
            name,
            avatar_url
          )
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('ブログ投稿の取得中にエラーが発生しました:', error)
        return
      }

      setBlogPosts(data || [])
      setIsLoading(false)
    }

    fetchBlogPosts()
  }, [profile.id])

  const formatIntroduce = useCallback((text: string | null) => {
    if (!text) return null
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i !== text.split('\n').length - 1 && <br />}
      </span>
    ))
  }, [])

  // ソーシャルリンクアイコンとリンクのマッピング
  const socialLinkIcons = {
    twitter: { icon: Twitter, color: "hover:text-blue-400" },
    github: { icon: Github, color: "hover:text-foreground" },
    linkedin: { icon: Linkedin, color: "hover:text-blue-600" },
    instagram: { icon: Instagram, color: "hover:text-pink-600" },
    facebook: { icon: Facebook, color: "hover:text-blue-700" }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="relative pb-8">
          <div className="absolute inset-0 h-32 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-t-lg" />
          <div className="relative z-10 flex flex-col items-center">
            <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
              {profile.avatar_url ? (
                <AvatarImage
                  src={profile.avatar_url}
                  alt={profile.name || "User avatar"}
                  className="object-cover"
                />
              ) : (
                <AvatarFallback className="text-2xl">
                  {(profile.name && profile.name[0]) || "U"}
                </AvatarFallback>
              )}
            </Avatar>
            <CardTitle className="mt-4 text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {profile.name}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {profile.introduce && (
            <div className="text-muted-foreground text-center leading-relaxed">
              {formatIntroduce(profile.introduce)}
            </div>
          )}

          <div className="grid gap-3">
            {profile.email ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <a 
                  href={`mailto:${profile.email}`} 
                  className="hover:text-primary transition-colors"
                >
                  {profile.email}
                </a>
              </div>
            ) : null}

            {profile.website ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Globe className="w-4 h-4" />
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            ) : null}

            {profile.created_at ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatJST(profile.created_at)}</span>
              </div>
            ) : null}

            {/* 編集ボタン（プロフィール所有者のみ） */}
            {isOwnProfile && (
              <div className="flex items-center justify-center pt-2">
                <a
                  href="/settings/profile"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
                >
                  プロフィールを編集
                </a>
              </div>
            )}
          </div>

          {/* ソーシャルリンク */}
          {profile.social_links && Object.entries(profile.social_links).some(([value]) => value && value.trim() !== '') && (
            <div className="flex justify-center space-x-6 pt-4 border-t border-border">
              {Object.entries(profile.social_links).map(([platform, url]) => {
                if (!url || url.trim() === '') return null
                
                const socialConfig = socialLinkIcons[platform as keyof typeof socialLinkIcons]
                if (!socialConfig) return null
                
                const IconComponent = socialConfig.icon
                
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-muted-foreground transition-colors ${socialConfig.color}`}
                    title={`${platform.charAt(0).toUpperCase() + platform.slice(1)} で見る`}
                  >
                    <IconComponent className="w-6 h-6" />
                  </a>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 md:p-6">
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as 'posts' | 'about')} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="posts" className="flex items-center gap-2">
                投稿
                {blogPosts.length > 0 && (
                  <span className="bg-muted px-2 py-0.5 rounded-full text-xs">
                    {blogPosts.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="about">プロフィール</TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="mt-4 space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              ) : blogPosts.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {blogPosts.map((blog) => (
                    <BlogItem key={blog.id} blog={blog} />
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="text-4xl">📝</div>
                    <p>まだ投稿がありません</p>
                    {isOwnProfile && (
                      <a
                        href="/blog/new"
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
                      >
                        最初の投稿を作成
                      </a>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="about" className="mt-4">
              <div className="space-y-6">
                {/* 自己紹介 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">自己紹介</h3>
                  {profile.introduce ? (
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      {formatIntroduce(profile.introduce)}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">
                      自己紹介文はまだ設定されていません
                    </p>
                  )}
                </div>

                {/* 連絡先情報 */}
                {(profile.email || profile.website) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">連絡先</h3>
                    <div className="space-y-2">
                      {profile.email && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <a 
                            href={`mailto:${profile.email}`}
                            className="hover:text-primary transition-colors"
                          >
                            {profile.email}
                          </a>
                        </div>
                      )}
                      {profile.website && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Globe className="w-4 h-4" />
                          <a
                            href={profile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary transition-colors"
                          >
                            {profile.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ソーシャルメディア */}
                {profile.social_links && Object.entries(profile.social_links).some(([value]) => value && value.trim() !== '') && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">ソーシャルメディア</h3>
                    <div className="space-y-2">
                      {Object.entries(profile.social_links).map(([platform, url]) => {
                        if (!url || url.trim() === '') return null
                        
                        const socialConfig = socialLinkIcons[platform as keyof typeof socialLinkIcons]
                        if (!socialConfig) return null
                        
                        const IconComponent = socialConfig.icon
                        const displayName = platform.charAt(0).toUpperCase() + platform.slice(1)
                        
                        return (
                          <div key={platform} className="flex items-center gap-3 text-muted-foreground">
                            <IconComponent className="w-4 h-4" />
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`transition-colors ${socialConfig.color}`}
                            >
                              {displayName}
                            </a>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 参加日 */}
                {profile.created_at && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">アカウント情報</h3>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>参加日: {formatJST(profile.created_at)}</span>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default UserProfile