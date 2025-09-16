"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Globe, Mail, Calendar, Github, Twitter, Linkedin, Instagram, Facebook } from "lucide-react"
import { formatJST } from "@/utils/date"
import { ProfileType } from "@/types"

interface UserProfileProps {
  profile: ProfileType
  isOwnProfile?: boolean
}

const UserProfile: React.FC<UserProfileProps> = ({ profile, isOwnProfile }) => {
  const formatIntroduce = useCallback((text: string | null) => {
    if (!text) return null
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i !== text.split('\n').length - 1 && <br />}
      </span>
    ))
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="relative pb-8">
          <div className="absolute inset-0 h-32 bg-gradient-to-r from-primary/20 to-secondary/20" />
          <div className="relative z-10 flex flex-col items-center">
            <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
              <AvatarImage 
                src={profile.avatar_url || "/default.png"} 
                alt={profile.name} 
                className="object-cover"
              />
              <AvatarFallback>{profile.name[0]}</AvatarFallback>
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
            {profile.email && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${profile.email}`} className="hover:text-primary transition-colors">
                  {profile.email}
                </a>
              </div>
            )}
            {profile.website && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Globe className="w-4 h-4" />
                <a 
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  {profile.website}
                </a>
              </div>
            )}
            {profile.created_at && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatJST(profile.created_at)}</span>
              </div>
            )}
          </div>

          {profile.social_links && Object.keys(profile.social_links).length > 0 && (
            <div className="flex justify-center space-x-6 pt-4 border-t border-border">
              {profile.social_links.twitter && (
                <a
                  href={profile.social_links.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Twitter className="w-6 h-6" />
                </a>
              )}
              {profile.social_links.github && (
                <a
                  href={profile.social_links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Github className="w-6 h-6" />
                </a>
              )}
              {profile.social_links.linkedin && (
                <a
                  href={profile.social_links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Linkedin className="w-6 h-6" />
                </a>
              )}
              {profile.social_links.instagram && (
                <a
                  href={profile.social_links.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Instagram className="w-6 h-6" />
                </a>
              )}
              {profile.social_links.facebook && (
                <a
                  href={profile.social_links.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Facebook className="w-6 h-6" />
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default UserProfile