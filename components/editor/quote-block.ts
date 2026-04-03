import { Node, mergeAttributes } from '@tiptap/core';

type QuoteStyle = 'line' | 'double';

function normalizeQuoteStyle(style?: string): QuoteStyle {
  return style === 'double' ? 'double' : 'line';
}

export const QuoteBlock = Node.create({
  name: 'blockquote',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      quoteStyle: {
        default: 'line',
        parseHTML: (element: HTMLElement) =>
          normalizeQuoteStyle(element.getAttribute('data-quote-style') || undefined),
        renderHTML: (attributes: { quoteStyle?: string }) => {
          const quoteStyle = normalizeQuoteStyle(attributes.quoteStyle);
          return quoteStyle === 'double' ? { 'data-quote-style': 'double' } : {};
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'blockquote' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['blockquote', mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setBlockquote:
        () =>
        ({ commands }) =>
          commands.wrapIn(this.name),
      toggleBlockquote:
        (attributes?: { quoteStyle?: QuoteStyle }) =>
        ({ commands }) =>
          commands.toggleWrap(this.name, attributes),
      unsetBlockquote:
        () =>
        ({ commands }) =>
          commands.lift(this.name),
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-b': () => this.editor.commands.toggleBlockquote(),
    };
  },
});
