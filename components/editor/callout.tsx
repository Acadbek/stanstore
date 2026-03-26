'use client'

import { Node, mergeAttributes } from '@tiptap/core'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Tr = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type St = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Disp = any

const CALLOUT_ICONS: Record<string, string> = {
  info: 'ℹ️',
  hint: '💡',
  warning: '⚠️',
  error: '🚫',
  success: '✅',
}

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-callout-type'),
        renderHTML: (attributes: Record<string, string>) => ({
          'data-callout-type': attributes.type,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-callout-type]' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    const icon = CALLOUT_ICONS[node.attrs.type] || 'ℹ️'
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: 'callout',
        'data-callout-icon': icon,
      }),
      0,
    ]
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addCommands() {
    return {
      setCallout:
        (type: string) =>
        ({ tr, state, dispatch }: { tr: Tr; state: St; dispatch: Disp }) => {
          const { $from } = state.selection
          const parent = $from.parent

          if (parent.type.name !== 'paragraph') return false

          const callout = this.type.create({ type }, parent.content)

          if (dispatch) {
            tr.replaceWith($from.before(), $from.after(), callout)
          }

          return true
        },
      unsetCallout:
        () =>
        ({ tr, state, dispatch }: { tr: Tr; state: St; dispatch: Disp }) => {
          const { $from } = state.selection
          const parent = $from.parent

          if (parent.type.name !== this.name) return false

          const paragraph = state.schema.nodes.paragraph.create(null, parent.content)

          if (dispatch) {
            tr.replaceWith($from.before(), $from.after(), paragraph)
          }

          return true
        },
    } as any
  },
})
