// components/theme/ThemeSelector.tsx
import { Moon, Sun, Laptop } from "lucide-react"
import { useTheme } from "@/hooks/useTheme"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const ThemeSelector = () => {
  const { theme, setTheme } = useTheme()

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />
      case "dark":
        return <Moon className="h-4 w-4" />
      default:
        return <Laptop className="h-4 w-4" />
    }
  }

  const getThemeText = () => {
    switch (theme) {
      case "light":
        return "ライトモード"
      case "dark":
        return "ダークモード"
      default:
        return "システム設定"
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2">
          {getThemeIcon()}
          <span>{getThemeText()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <Sun className="h-4 w-4" />
          <span>ライトモード</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <Moon className="h-4 w-4" />
          <span>ダークモード</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <Laptop className="h-4 w-4" />
          <span>システム設定</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}