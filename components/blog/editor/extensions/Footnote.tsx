import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';

export interface FootnoteOptions {
  HTMLAttributes: Record<string, any>;
}

const FootnoteView = ({ node }: any) => {
  return (
    <NodeViewWrapper className="inline-block relative group">
      <span className="cursor-help text-primary font-bold px-0.5 align-top text-xs bg-primary/10 rounded">
        {node.attrs.label}
      </span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-popover text-popover-foreground text-xs rounded border border-border shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[var(--z-tooltip)]">
        {node.attrs.content || '注釈内容なし'}
      </div>
    </NodeViewWrapper>
  );
};

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
        class: 'footnote-ref',
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

  addNodeView() {
    return ReactNodeViewRenderer(FootnoteView);
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

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.write(`[^${node.attrs.label}]`);
          // We need to add the definition at the bottom of the document.
          // Tiptap-markdown doesn't easily support adding text at the end during node serialization.
          // For now, we'll rely on the editor handling definitions separately or just saving the ref.
          // Actually, a better way is to include the definition in the markdown output.
        },
        parse: {
          setup(markdownit: any) {
            // Footnote parsing logic...
          }
        }
      },
    };
  },
});
