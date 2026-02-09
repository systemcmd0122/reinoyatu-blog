import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';

export const FocusMode = Extension.create({
  name: 'focusMode',

  addOptions() {
    return {
      className: 'has-focus',
      mode: 'all', // 'all' | 'shallow'
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            focus: (view) => {
              view.dom.classList.add('focus-mode-active');
              return false;
            },
            blur: (view) => {
              view.dom.classList.remove('focus-mode-active');
              return false;
            },
          },
        },
      }),
    ];
  },
});
