"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { ProfileType } from "@/types"
import Link from "next/link"
import { Facebook, Github, Instagram, Linkedin, Twitter } from "lucide-react"

interface AuthorCardProps {
  profile: ProfileType
}

const AuthorCard = ({ profile }: AuthorCardProps) => {
  return (
    <Card className="p-6 mt-8 bg-white hover:bg-gray-50 transition-colors">
      <div className="space-y-4">
        <div className="block">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile?.avatar_url || "/default.png"} alt={profile?.name || "Unknown User"} />
              <AvatarFallback>{profile?.name?.[0] || "?"}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-bold">{profile.name}</h3>
              <div className="italic text-xs text-muted-foreground">(プロフィール機能開発中)</div>
              {profile.introduce && (
                <p className="text-gray-600 text-sm line-clamp-2 mt-1">
                  {profile.introduce}
                </p>
              )}
            </div>
          </div>
        </div>

        {profile.social_links && Object.keys(profile.social_links).length > 0 && (
          <div className="flex justify-center space-x-4 pt-4 border-t border-gray-100">
            {profile.social_links.twitter && (
              <a
                href={profile.social_links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-primary transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            )}
            {profile.social_links.github && (
              <a
                href={profile.social_links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-primary transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            )}
            {profile.social_links.linkedin && (
              <a
                href={profile.social_links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-primary transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            )}
            {profile.social_links.instagram && (
              <a
                href={profile.social_links.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-primary transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            )}
            {profile.social_links.facebook && (
              <a
                href={profile.social_links.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-primary transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

export default AuthorCard