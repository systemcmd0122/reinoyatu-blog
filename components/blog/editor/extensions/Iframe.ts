import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import IframeView from './IframeView';

export interface IframeOptions {
  allowFullscreen: boolean,
  HTMLAttributes: Record<string, any>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    iframe: {
      /**
       * Add an iframe
       */
      setIframe: (options: { src: string }) => ReturnType,
    }
  }
}

export const Iframe = Node.create<IframeOptions>({
  name: 'iframe',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      allowFullscreen: true,
      HTMLAttributes: {
        class: 'iframe-wrapper',
      },
    }
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      frameborder: {
        default: 0,
      },
      allowfullscreen: {
        default: this.options.allowFullscreen,
        parseHTML: element => element.getAttribute('allowfullscreen'),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'iframe',
      },
      {
        tag: 'div[data-iframe]',
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      { 'data-iframe': '', 'data-src': HTMLAttributes.src, class: 'iframe-container my-6' },
      ['iframe', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)],
      `{{iframe:${HTMLAttributes.src}}}`
    ]
  },

  addCommands() {
    return {
      setIframe: (options: { src: string }) => ({ tr, dispatch }) => {
        const { selection } = tr
        const node = this.type.create(options)

        if (dispatch) {
          tr.replaceRangeWith(selection.from, selection.to, node)
        }

        return true
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(IframeView)
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.write(`{{iframe:${node.attrs.src}}}`);
        },
        parse: {
          setup(markdownit: any) {
            markdownit.inline.ruler.after('escape', 'iframe', (state: any, silent: any) => {
              const regex = /\{\{iframe:([^}]+)\}\}/;
              const match = regex.exec(state.src.slice(state.pos));
              if (!match) return false;
              if (!silent) {
                const token = state.push('iframe', 'div', 0);
                token.attrs = [['src', match[1]]];
              }
              state.pos += match[0].length;
              return true;
            });
          }
        },
      },
    };
  },
})
