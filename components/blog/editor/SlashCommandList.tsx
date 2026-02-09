import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Image as ImageIcon,
  Table as TableIcon,
  Youtube,
  Sigma,
  Info,
  ChevronDown,
  Minus,
  Clock,
  Activity,
  FileText,
  Type,
} from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

export interface SlashCommandListProps {
  items: any[]
  command: (item: any) => void
}

const SlashCommandList = forwardRef((props: SlashCommandListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]

    if (item) {
      props.command(item)
    }
  }

  useEffect(() => setSelectedIndex(0), [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
        return true
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length)
        return true
      }

      if (event.key === 'Enter') {
        selectItem(selectedIndex)
        return true
      }

      return false
    },
  }))

  return (
    <div className="z-[var(--z-popover)] w-72 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95 overflow-hidden">
      <Command className="bg-transparent">
        <CommandInput 
          placeholder="コマンドを検索..." 
          className="h-9 border-none focus:ring-0" 
          autoFocus
        />
        <CommandList className="max-h-[300px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-transparent">
          <CommandEmpty className="p-2 text-xs text-muted-foreground">見つかりませんでした</CommandEmpty>
          <CommandGroup heading="基本" className="p-1">
            {props.items.map((item: any, index: number) => (
              <CommandItem
                key={index}
                onSelect={() => selectItem(index)}
                className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-md cursor-pointer ${
                  index === selectedIndex ? 'bg-accent text-accent-foreground' : ''
                }`}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background shadow-sm shrink-0">
                  {item.icon}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{item.title}</span>
                  {item.description && (
                    <span className="text-[10px] text-muted-foreground">{item.description}</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )
})

SlashCommandList.displayName = 'SlashCommandList'

export default SlashCommandList
