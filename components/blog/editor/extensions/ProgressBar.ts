import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ProgressBarView from './ProgressBarView';

export interface ProgressBarOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    progressBar: {
      setProgressBar: (attributes?: { value: number; label: string; color: string }) => ReturnType;
    };
  }
}

export const ProgressBar = Node.create<ProgressBarOptions>({
  name: 'progressBar',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'progress-bar-container my-6 w-full',
      },
    };
  },

  group: 'block',
  atom: true,

  addAttributes() {
    return {
      value: {
        default: 50,
      },
      label: {
        default: 'Progress',
      },
      color: {
        default: 'primary', // primary, success, warning, destructive
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="progress-bar"]',
        getAttrs: (element) => ({
          value: parseInt((element as HTMLElement).getAttribute('data-value') || '0', 10),
          label: (element as HTMLElement).getAttribute('data-label'),
          color: (element as HTMLElement).getAttribute('data-color'),
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'progress-bar',
        'data-value': node.attrs.value,
        'data-label': node.attrs.label,
        'data-color': node.attrs.color
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ProgressBarView);
  },

  addCommands() {
    return {
      setProgressBar:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
    };
  },
});
