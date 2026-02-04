"use client"

import { useCallback, useState, useEffect, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Globe, 
  Mail, 
  Calendar, 
  Github, 
  Twitter, 
  Linkedin, 
  Instagram, 
  Facebook,
  Edit3,
  Share2,
  FileText,
  Heart,
  ExternalLink,
  MapPin
} from "lucide-react"
import { formatJST } from "@/utils/date"
import { ProfileType, BlogType } from "@/types"
import { createClient } from "@/utils/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import BlogListView from "@/components/blog/BlogListView"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

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

  const stats = useMemo(() => {
    const totalLikes = blogPosts.reduce((acc, blog) => acc + (blog.likes_count || 0), 0)
    return [
      { label: "Posts", value: blogPosts.length, icon: FileText },
      { label: "Total Likes", value: totalLikes, icon: Heart },
    ]
  }, [blogPosts])

  const formatIntroduce = useCallback((text: string | null) => {
    if (!text) return null
    return text.split('\n').map((line, i) => (
      <span key={i} className="block mb-1">
        {line}
      </span>
    ))
  }, [])

  const socialLinkIcons = {
    twitter: { icon: Twitter, color: "text-[#1DA1F2]" },
    github: { icon: Github, color: "text-[#333]" },
    linkedin: { icon: Linkedin, color: "text-[#0077b5]" },
    instagram: { icon: Instagram, color: "text-[#e1306c]" },
    facebook: { icon: Facebook, color: "text-[#4267B2]" }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header / Hero Section */}
      <section className="relative group">
        <div className="h-48 md:h-64 w-full bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5 rounded-3xl overflow-hidden relative border border-border/50">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="absolute top-0 right-0 p-6">
            <Button variant="ghost" size="icon" className="rounded-full bg-background/50 backdrop-blur-md hover:bg-background/80 transition-all border border-border/50">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="px-6 md:px-12 -mt-20 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative h-40 w-40 rounded-[2.5rem] overflow-hidden border-8 border-background bg-background shadow-2xl"
              >
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.name || "User"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-4xl font-black text-muted-foreground">
                    {profile.name?.[0] || "U"}
                  </div>
                )}
              </motion.div>
              
              <div className="text-center md:text-left space-y-2 pb-2">
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                    {profile.name}
                  </h1>
                  {isOwnProfile && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold">You</Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {profile.created_at ? new Date(profile.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' }) : '---'}</span>
                  </div>
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                      <Globe className="h-4 w-4" />
                      <span className="truncate max-w-[150px]">{profile.website.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pb-2">
              {isOwnProfile ? (
                <Button asChild size="lg" className="rounded-2xl font-bold h-12 px-6 shadow-lg shadow-primary/20">
                  <Link href="/settings/profile" className="flex items-center gap-2">
                    <Edit3 className="h-4 w-4" />
                    Edit Profile
                  </Link>
                </Button>
              ) : (
                <Button size="lg" className="rounded-2xl font-bold h-12 px-8">
                  Follow
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 md:px-0">
        {/* Left Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Stats Card */}
          <Card className="rounded-[2rem] border-border/50 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-2 divide-x divide-border">
                {stats.map((stat, i) => (
                  <div key={i} className="p-6 text-center hover:bg-muted/30 transition-colors">
                    <div className="inline-flex p-2 rounded-xl bg-primary/5 text-primary mb-2">
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div className="text-2xl font-black text-foreground">{stat.value}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* About Card */}
          <Card className="rounded-[2rem] border-border/50 shadow-sm">
            <CardContent className="p-8 space-y-6">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground/50 mb-4 flex items-center gap-2">
                  About Me
                </h3>
                {profile.introduce ? (
                  <div className="text-muted-foreground leading-relaxed font-medium">
                    {formatIntroduce(profile.introduce)}
                  </div>
                ) : (
                  <p className="text-muted-foreground/50 italic">No introduction yet.</p>
                )}
              </div>

              {/* Socials */}
              {profile.social_links && Object.entries(profile.social_links).some(([_, v]) => v) && (
                <div className="pt-6 border-t border-border/50">
                   <h3 className="text-sm font-black uppercase tracking-widest text-foreground/50 mb-4">
                    Connections
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(profile.social_links).map(([platform, url]) => {
                      if (!url) return null
                      const config = socialLinkIcons[platform as keyof typeof socialLinkIcons]
                      if (!config) return null
                      return (
                        <a 
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-2xl bg-muted/50 hover:bg-background border border-transparent hover:border-border transition-all group"
                        >
                          <config.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", config.color)} />
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-8">
          <Tabs 
            value={activeTab} 
            onValueChange={(v) => setActiveTab(v as any)} 
            className="w-full"
          >
            <div className="flex items-center justify-between mb-6 bg-muted/50 p-1.5 rounded-2xl border border-border/50">
              <TabsList className="bg-transparent h-auto p-0 gap-1">
                <TabsTrigger 
                  value="posts" 
                  className="rounded-xl px-8 py-2.5 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Articles
                </TabsTrigger>
                <TabsTrigger 
                  value="about"
                  className="rounded-xl px-8 py-2.5 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  History
                </TabsTrigger>
              </TabsList>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TabsContent value="posts" className="mt-0 focus-visible:ring-0">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-40 w-full rounded-2xl" />
                      ))}
                    </div>
                  ) : blogPosts.length > 0 ? (
                    <BlogListView blogs={blogPosts} />
                  ) : (
                    <div className="bg-card border border-border/50 rounded-[2rem] p-20 text-center">
                      <div className="bg-muted w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <FileText className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">No articles yet</h3>
                      <p className="text-muted-foreground mb-8">
                        {isOwnProfile ? "Start sharing your thoughts with the world!" : "This user hasn't published any articles yet."}
                      </p>
                      {isOwnProfile && (
                        <Button asChild className="rounded-xl font-bold">
                          <Link href="/blog/new">Create First Post</Link>
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="about" className="mt-0 focus-visible:ring-0">
                   <Card className="rounded-[2rem] border-border/50 shadow-sm p-12 text-center text-muted-foreground">
                      <p className="italic">Activity history coming soon...</p>
                   </Card>
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default UserProfile
