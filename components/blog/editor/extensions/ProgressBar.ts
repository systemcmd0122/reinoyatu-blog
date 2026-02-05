import { Node, mergeAttributes } from '@tiptap/core';

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
    const value = node.attrs.value;
    const colorClass = 
      node.attrs.color === 'success' ? 'bg-green-500' :
      node.attrs.color === 'warning' ? 'bg-amber-500' :
      node.attrs.color === 'destructive' ? 'bg-red-500' : 'bg-primary';

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'progress-bar', 'data-value': value, 'data-label': node.attrs.label, 'data-color': node.attrs.color }),
      ['div', { class: 'flex justify-between items-center mb-1' },
        ['span', { class: 'text-xs font-bold' }, node.attrs.label],
        ['span', { class: 'text-xs font-mono' }, `${value}%`],
      ],
      ['div', { class: 'w-full h-2 bg-muted rounded-full overflow-hidden' },
        ['div', { class: `h-full ${colorClass} transition-all duration-500`, style: `width: ${value}%` }],
      ],
    ];
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
