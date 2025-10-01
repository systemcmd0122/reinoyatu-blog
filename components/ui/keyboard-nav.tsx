import { useEffect } from 'react'

export function useKeyboardNavigation(selector: string) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const elements = document.querySelectorAll(selector)
        const currentElement = document.activeElement
        const currentIndex = Array.from(elements).indexOf(currentElement as Element)

        if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
          e.preventDefault()
          const nextIndex = currentIndex + 1 >= elements.length ? 0 : currentIndex + 1
          ;(elements[nextIndex] as HTMLElement).focus()
        } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
          e.preventDefault()
          const prevIndex = currentIndex - 1 < 0 ? elements.length - 1 : currentIndex - 1
          ;(elements[prevIndex] as HTMLElement).focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selector])
}