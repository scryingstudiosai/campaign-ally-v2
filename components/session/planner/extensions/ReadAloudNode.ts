import { Node, mergeAttributes } from '@tiptap/core';

export const ReadAloudNode = Node.create({
  name: 'readAloud',
  group: 'block',
  content: 'block+',
  defining: true,

  parseHTML() {
    return [
      { tag: 'div[data-read-aloud]' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-read-aloud': 'true',
        class: 'relative bg-slate-800/50 border-l-4 border-teal-500 p-4 my-4 rounded-r-lg',
      }),
      [
        'div',
        { class: 'absolute top-2 right-2 text-xs text-teal-400 uppercase tracking-wider font-semibold' },
        '📖 Read Aloud',
      ],
      ['div', { class: 'italic text-slate-300 pt-4' }, 0],
    ];
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-r': () => this.editor.commands.toggleWrap('readAloud'),
    };
  },
});
