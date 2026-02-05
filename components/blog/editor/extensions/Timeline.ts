import { Node, mergeAttributes } from '@tiptap/core';

export interface TimelineOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    timeline: {
      setTimeline: () => ReturnType;
    };
  }
}

export const Timeline = Node.create<TimelineOptions>({
  name: 'timeline',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'timeline my-8 space-y-0 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-border',
      },
    };
  },

  group: 'block',
  content: 'timelineItem+',
  defining: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="timeline"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'timeline' }), 0];
  },

  addCommands() {
    return {
      setTimeline:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            content: [
              { type: 'timelineItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'イベント1' }] }] },
              { type: 'timelineItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'イベント2' }] }] },
            ],
          });
        },
    };
  },
});

export const TimelineItem = Node.create({
  name: 'timelineItem',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      time: {
        default: '2024-01-01',
        parseHTML: (element) => element.getAttribute('data-time'),
        renderHTML: (attributes) => ({
          'data-time': attributes.time,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="timeline-item"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'timeline-item',
        'data-time': node.attrs.time,
        class: 'timeline-item',
      }),
      0,
    ];
  },
});
