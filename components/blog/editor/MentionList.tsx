import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

export interface MentionListProps {
  items: any[]
  command: (item: any) => void
}

const MentionList = forwardRef((props: MentionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]

    if (item) {
      props.command({ id: item.id, label: item.name })
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
    <div className="z-[var(--z-popover)] w-64 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95 overflow-hidden">
      <Command className="bg-transparent">
        <CommandList className="max-h-[300px] overflow-y-auto p-1 scrollbar-thin">
          <CommandEmpty className="p-2 text-xs text-muted-foreground text-center">ユーザーが見つかりません</CommandEmpty>
          <CommandGroup className="p-1">
            {props.items.map((item: any, index: number) => (
              <CommandItem
                key={item.id}
                onSelect={() => selectItem(index)}
                className={`flex items-center gap-2 px-2 py-2 text-sm rounded-md cursor-pointer ${
                  index === selectedIndex ? 'bg-accent text-accent-foreground' : ''
                }`}
              >
                <Avatar className="h-7 w-7 border border-border shadow-sm shrink-0">
                  <AvatarImage src={item.avatar_url || "/default.png"} className="object-cover" />
                  <AvatarFallback>{item.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0 overflow-hidden">
                  <span className="font-bold truncate">@{item.name}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )
})

MentionList.displayName = 'MentionList'

export default MentionList
