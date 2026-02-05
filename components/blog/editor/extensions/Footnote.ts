import { Node, mergeAttributes } from '@tiptap/core';

export interface FootnoteOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    footnote: {
      setFootnote: (options: { label: string; content: string }) => ReturnType;
    };
  }
}

export const Footnote = Node.create<FootnoteOptions>({
  name: 'footnote',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'footnote-ref cursor-help text-primary font-bold px-0.5',
      },
    };
  },

  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      label: {
        default: '1',
      },
      content: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-footnote-label]',
        getAttrs: (element) => ({
          label: (element as HTMLElement).getAttribute('data-footnote-label'),
          content: (element as HTMLElement).getAttribute('data-footnote-content'),
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-footnote-label': node.attrs.label,
        'data-footnote-content': node.attrs.content,
      }),
      `[^${node.attrs.label}]`,
    ];
  },

  addCommands() {
    return {
      setFootnote:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
