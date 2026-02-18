import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import { searchUsers } from '@/actions/user'
import MentionList from './MentionList'

export default {
  items: async ({ query }: { query: string }) => {
    if (!query || query.length < 1) return []
    return await searchUsers(query)
  },

  render: () => {
    let component: ReactRenderer
    let popup: any

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        })

        if (!props.clientRect) {
          return
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        })
      },

      onUpdate(props: any) {
        component.updateProps(props)

        if (!props.clientRect) {
          return
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        })
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup[0].hide()
          return true
        }

        return (component.ref as any)?.onKeyDown(props)
      },

      onExit() {
        if (popup && popup[0]) {
            popup[0].destroy()
        }
        if (component) {
            component.destroy()
        }
      },
    }
  },
}
