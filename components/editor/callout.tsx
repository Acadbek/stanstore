'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import {
  Info,
  Lightbulb,
  AlertTriangle,
  XCircle,
  CheckCircle2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Tr = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type St = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Disp = any

const CALLOUT_CONFIG: Record<string, { icon: LucideIcon; label: string; iconColor: string; bgColor: string; borderColor: string }> = {
  info: { icon: Info, label: 'Info', iconColor: '#3b82f6', bgColor: '#eff6ff', borderColor: '#bfdbfe' },
  hint: { icon: Lightbulb, label: 'Hint', iconColor: '#f59e0b', bgColor: '#fffbeb', borderColor: '#fde68a' },
  warning: { icon: AlertTriangle, label: 'Warning', iconColor: '#f97316', bgColor: '#fff7ed', borderColor: '#fed7aa' },
  error: { icon: XCircle, label: 'Error', iconColor: '#ef4444', bgColor: '#fef2f2', borderColor: '#fecaca' },
  success: { icon: CheckCircle2, label: 'Success', iconColor: '#22c55e', bgColor: '#f0fdf4', borderColor: '#bbf7d0' },
}

function CalloutNodeView({ node }: NodeViewProps) {
  const calloutType = (node.attrs.type as string) || 'info'
  const config = CALLOUT_CONFIG[calloutType] || CALLOUT_CONFIG.info
  const Icon = config.icon

  return (
    <NodeViewWrapper>
      <div
        data-callout-type={calloutType}
        className="callout"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.625rem',
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          background: config.bgColor,
          margin: '0.75rem 0',
          lineHeight: 1.5,
          fontSize: '0.875rem',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
        }}
      >
        <span
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '20px',
            height: '20px',
            marginTop: '1px',
            color: config.iconColor,
          }}
        >
          <Icon size={18} strokeWidth={2} />
        </span>
        <NodeViewContent style={{ flex: 1, minWidth: 0 }} />
      </div>
    </NodeViewWrapper>
  )
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

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: 'callout',
      }),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutNodeView)
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
