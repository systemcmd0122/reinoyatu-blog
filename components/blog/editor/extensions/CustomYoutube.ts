import Youtube from '@tiptap/extension-youtube';
import { mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import YoutubeView from './YoutubeView';

export const CustomYoutube = Youtube.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      showDetails: {
        default: true,
        parseHTML: (element) => element.getAttribute('data-show-details') !== 'false',
        renderHTML: (attributes) => ({
          'data-show-details': attributes.showDetails,
        }),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      { 
        'data-youtube-video': '',
        'data-id': HTMLAttributes.src,
        'data-show-details': HTMLAttributes.showDetails,
        class: 'youtube-container my-6' 
      },
      `{{youtube:${HTMLAttributes.src}:showDetails=${HTMLAttributes.showDetails}}}`,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(YoutubeView);
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const showDetails = node.attrs.showDetails !== false ? ':showDetails=true' : ':showDetails=false';
          state.write(`{{youtube:${node.attrs.src}${showDetails}}}`);
        },
        parse: {
          setup(markdownit: any) {
            markdownit.inline.ruler.after('escape', 'youtube', (state: any, silent: any) => {
              const regex = /\{\{youtube:([^:}]+)(?::showDetails=(true|false))?\}\}/;
              const match = regex.exec(state.src.slice(state.pos));
              if (!match) return false;
              if (!silent) {
                const token = state.push('youtube', 'div', 0);
                token.attrs = [['src', match[1]], ['showDetails', match[2] !== 'false']];
              }
              state.pos += match[0].length;
              return true;
            });
          }
        },
      },
    };
  },
});
