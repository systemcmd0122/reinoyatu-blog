import { Extension } from '@tiptap/core';

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
      {
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
      },
    ];
  },
});
