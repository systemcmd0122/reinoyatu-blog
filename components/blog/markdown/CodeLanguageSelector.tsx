import React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface CodeLanguage {
  name: string
  description: string
}

interface CodeLanguageSelectorProps {
  languages: CodeLanguage[]
  onSelect: (language: string) => void
  disabled?: boolean
}

const CodeLanguageSelector: React.FC<CodeLanguageSelectorProps> = ({
  languages,
  onSelect,
  disabled = false,
}) => {
  return (
    <Select onValueChange={onSelect} disabled={disabled}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="言語を選択" />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.name} value={lang.name}>
            {lang.description} ({lang.name})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default CodeLanguageSelector