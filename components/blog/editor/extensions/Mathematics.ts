import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import MathView from './MathView';

export interface MathematicsOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mathematics: {
      setMathematics: (options: { latex: string; inline?: boolean }) => ReturnType;
    };
  }
}

export const Mathematics = Node.create<MathematicsOptions>({
  name: 'mathematics',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'mathematics',
      },
    };
  },

  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: '',
      },
      inline: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-latex]',
        getAttrs: (element) => ({
          latex: (element as HTMLElement).getAttribute('data-latex'),
          inline: (element as HTMLElement).getAttribute('data-inline') !== 'false',
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      node.attrs.inline ? 'span' : 'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'mathematics',
        'data-latex': node.attrs.latex,
        'data-inline': node.attrs.inline,
        class: node.attrs.inline ? 'math-inline' : 'math-block my-6 text-center',
      }),
      node.attrs.inline ? `$${node.attrs.latex}$` : `$$${node.attrs.latex}$$`,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathView);
  },

  addCommands() {
    return {
      setMathematics:
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
          if (node.attrs.inline) {
            state.write(`$${node.attrs.latex}$`);
          } else {
            state.write(`\n\n$$${node.attrs.latex}$$\n\n`);
          }
        },
        parse: {
          // tiptap-markdown will handle $...$ and $$...$$ if we use a specific plugin, 
          // but for now we rely on the editor's ability to parse pasted markdown or use a custom parser.
        },
      },
    };
  },
});
