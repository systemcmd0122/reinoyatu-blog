import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import AccordionView from './AccordionView';

export interface AccordionOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    accordion: {
      setAccordion: (attributes?: { title: string }) => ReturnType;
    };
  }
}

export const Accordion = Node.create<AccordionOptions>({
  name: 'accordion',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'accordion my-4 border border-border rounded-lg overflow-hidden',
      },
    };
  },

  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      title: {
        default: '詳細を表示',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'details',
        getAttrs: (element) => ({
          title: (element as HTMLElement).querySelector('summary')?.innerText || '詳細を表示',
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'details',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      ['summary', {}, node.attrs.title],
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AccordionView);
  },

  addCommands() {
    return {
      setAccordion:
        (attributes) =>
        ({ commands }) => {
          return commands.setNode(this.name, attributes);
        },
    };
  },
});
