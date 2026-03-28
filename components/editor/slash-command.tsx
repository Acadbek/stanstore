'use client'

import { Extension } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import { Suggestion } from '@tiptap/suggestion'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  Info,
  Lightbulb,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  RemoveFormatting,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Editor = any

interface CommandItem {
  title: string
  description: string
  icon: LucideIcon
  command: (editor: Editor) => void
}

const commandItems: CommandItem[] = [
  {
    title: 'Paragraph',
    description: 'Plain text block',
    icon: Type,
    command: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: Heading1,
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: Heading3,
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: 'Bullet List',
    description: 'Unordered list',
    icon: List,
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: 'Ordered List',
    description: 'Numbered list',
    icon: ListOrdered,
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: 'Task List',
    description: 'Checkbox list',
    icon: CheckSquare,
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    title: 'Blockquote',
    description: 'Quote block',
    icon: Quote,
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: 'Code Block',
    description: 'Code snippet',
    icon: Code,
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: 'Divider',
    description: 'Horizontal line',
    icon: Minus,
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    title: 'Callout: Info',
    description: 'Info callout block',
    icon: Info,
    command: (editor) => editor.chain().focus().setCallout('info').run(),
  },
  {
    title: 'Callout: Hint',
    description: 'Hint callout block',
    icon: Lightbulb,
    command: (editor) => editor.chain().focus().setCallout('hint').run(),
  },
  {
    title: 'Callout: Warning',
    description: 'Warning callout block',
    icon: AlertTriangle,
    command: (editor) => editor.chain().focus().setCallout('warning').run(),
  },
  {
    title: 'Callout: Error',
    description: 'Error callout block',
    icon: XCircle,
    command: (editor) => editor.chain().focus().setCallout('error').run(),
  },
  {
    title: 'Callout: Success',
    description: 'Success callout block',
    icon: CheckCircle2,
    command: (editor) => editor.chain().focus().setCallout('success').run(),
  },
  {
    title: 'Bold',
    description: 'Thicken text',
    icon: Bold,
    command: (editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    title: 'Italic',
    description: 'Emphasize text',
    icon: Italic,
    command: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    title: 'Underline',
    description: 'Underline text',
    icon: Underline,
    command: (editor) => editor.chain().focus().toggleUnderline().run(),
  },
  {
    title: 'Strikethrough',
    description: 'Cross out text',
    icon: Strikethrough,
    command: (editor) => editor.chain().focus().toggleStrike().run(),
  },
  {
    title: 'Code',
    description: 'Inline code',
    icon: Code,
    command: (editor) => editor.chain().focus().toggleCode().run(),
  },
  {
    title: 'Align Left',
    description: 'Left align text',
    icon: AlignLeft,
    command: (editor) => editor.chain().focus().setTextAlign('left').run(),
  },
  {
    title: 'Align Center',
    description: 'Center align text',
    icon: AlignCenter,
    command: (editor) => editor.chain().focus().setTextAlign('center').run(),
  },
  {
    title: 'Align Right',
    description: 'Right align text',
    icon: AlignRight,
    command: (editor) => editor.chain().focus().setTextAlign('right').run(),
  },
  {
    title: 'Link',
    description: 'Insert web link',
    icon: LinkIcon,
    command: (editor) => {
      const url = window.prompt('URL:');
      if (url) {
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      }
    },
  },
  {
    title: 'Image',
    description: 'Insert image URL',
    icon: ImageIcon,
    command: (editor) => {
      const url = window.prompt('Image URL:');
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    },
  },
  {
    title: 'Clear Formatting',
    description: 'Remove all styles',
    icon: RemoveFormatting,
    command: (editor) => editor.chain().focus().unsetAllMarks().clearNodes().run(),
  },
]

interface CommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

interface CommandListProps {
  items: CommandItem[]
  command: (item: CommandItem) => void
  editor: Editor
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let component: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let popup: any

const CommandList = forwardRef<CommandListRef, CommandListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    useEffect(() => {
      if (containerRef.current) {
        const item = containerRef.current.querySelector('.is-selected') as HTMLElement
        if (item) {
          item.scrollIntoView({ block: 'nearest' })
        }
      }
    }, [selectedIndex])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length)
          return true
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % items.length)
          return true
        }

        if (event.key === 'Enter') {
          const item = items[selectedIndex]
          if (item) command(item)
          return true
        }

        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div className="slash-command-menu">
          <div className="slash-command-no-results">No results</div>
        </div>
      )
    }

    return (
      <div ref={containerRef} className="slash-command-menu">
        <div className="slash-command-label">Block type</div>
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <button
              key={item.title}
              type="button"
              className={`slash-command-item ${index === selectedIndex ? 'is-selected' : ''}`}
              onClick={() => command(item)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <Icon className="h-4 w-4 shrink-0 text-gray-500" />
              <div className="flex flex-col">
                <span className="slash-command-item-title">{item.title}</span>
                <span className="slash-command-item-desc">
                  {item.description}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    )
  }
)

CommandList.displayName = 'CommandList'

export const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor
          range: { from: number; to: number }
          props: CommandItem
        }) => {
          editor.chain().focus().deleteRange(range).run()
          props.command(editor)
        },
        items: ({ query }: { query: string }) => {
          const normalizedQuery = query.trim().toLowerCase()

          if (!normalizedQuery) {
            return commandItems
          }

          return commandItems.filter((item) => {
            const title = item.title.toLowerCase()
            const description = item.description.toLowerCase()

            return (
              title.includes(normalizedQuery) ||
              description.includes(normalizedQuery)
            )
          })
        },
        render: () => {
          return {
            onStart(props: {
              editor: Editor
              clientRect: (() => DOMRect) | null
              command: (item: CommandItem) => void
              items: CommandItem[]
            }) {
              component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
              })

              if (!props.clientRect) return

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
                arrow: false,
                animation: false,
              })
            },
            onUpdate(props: {
              editor: Editor
              clientRect: (() => DOMRect) | null
              command: (item: CommandItem) => void
              items: CommandItem[]
            }) {
              component?.updateProps(props)

              if (props.clientRect && popup) {
                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                })
              }
            },
            onKeyDown(props: { event: KeyboardEvent }) {
              if (props.event.key === 'Escape') {
                popup?.[0].hide()
                return true
              }
              return component?.ref?.onKeyDown(props) ?? false
            },
            onExit() {
              popup?.[0].destroy()
              component?.destroy()
            },
          }
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
