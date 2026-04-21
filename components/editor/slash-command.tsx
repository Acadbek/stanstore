'use client';

import { Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { Suggestion } from '@tiptap/suggestion';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
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
  Youtube,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Editor = any;

interface CommandItem {
  title: string;
  description: string;
  keywords?: string[];
  icon: LucideIcon;
  command: (editor: Editor) => void;
  preview?: React.ReactNode;
}

const commandItems: CommandItem[] = [
  {
    title: 'Paragraph',
    description: 'Plain text block',
    icon: Type,
    command: (editor) => editor.chain().focus().setParagraph().run(),
    preview: (
      <div className="scp-text">
        Plain text block for writing paragraphs and general content.
      </div>
    ),
  },
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: Heading1,
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
    preview: <div className="scp-h1">Heading 1</div>,
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
    preview: <div className="scp-h2">Heading 2</div>,
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: Heading3,
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 3 }).run(),
    preview: <div className="scp-h3">Heading 3</div>,
  },
  {
    title: 'Bullet List',
    description: 'Unordered list',
    icon: List,
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
    preview: (
      <ul className="scp-list">
        <li>List item one</li>
        <li>List item two</li>
        <li>List item three</li>
      </ul>
    ),
  },
  {
    title: 'Ordered List',
    description: 'Numbered list',
    icon: ListOrdered,
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
    preview: (
      <ol className="scp-list scp-ordered">
        <li>First item</li>
        <li>Second item</li>
        <li>Third item</li>
      </ol>
    ),
  },
  {
    title: 'Checkbox',
    description: 'Checkbox list',
    keywords: ['checklist', 'task', 'todo'],
    icon: CheckSquare,
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
    preview: (
      <div className="scp-checkbox-list">
        <label className="scp-checkbox">
          <span className="scp-checkbox-box" /> Buy groceries
        </label>
        <label className="scp-checkbox">
          <span className="scp-checkbox-box scp-checked" /> Finish report
        </label>
        <label className="scp-checkbox">
          <span className="scp-checkbox-box" /> Call dentist
        </label>
      </div>
    ),
  },
  {
    title: 'Quote',
    description: 'Quote',
    keywords: ['qoute', 'blockquote', 'citation'],
    icon: Quote,
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
    preview: (
      <blockquote className="scp-quote scp-quote-line">
        The only way to do great work is to love what you do.
      </blockquote>
    ),
  },
  {
    title: 'Quote ("")',
    description: 'Quote with double marks',
    keywords: ['qoute', 'double quote', 'citation'],
    icon: Quote,
    command: (editor) => {
      if (editor.isActive('blockquote')) {
        editor
          .chain()
          .focus()
          .updateAttributes('blockquote', { quoteStyle: 'double' })
          .run();
        return;
      }
      editor.chain().focus().toggleBlockquote({ quoteStyle: 'double' }).run();
    },
    preview: (
      <blockquote className="scp-quote scp-quote-double">
        The only way to do great work is to love what you do.
      </blockquote>
    ),
  },
  {
    title: 'Code Block',
    description: 'Code snippet',
    icon: Code,
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    preview: (
      <pre className="scp-code-block">
        <code>
          const greeting = &apos;Hello&apos;;{'\n'}console.log(greeting);
        </code>
      </pre>
    ),
  },
  {
    title: 'Divider',
    description: 'Horizontal line',
    icon: Minus,
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
    preview: (
      <div className="scp-divider-preview">
        <div className="scp-divider-line" />
      </div>
    ),
  },
  {
    title: 'Callout: Info',
    description: 'Info callout block',
    icon: Info,
    command: (editor) => editor.chain().focus().setCallout('info').run(),
    preview: (
      <div className="scp-callout scp-callout-info">
        <Info className="scp-callout-icon" />
        <span>Helpful information for the reader.</span>
      </div>
    ),
  },
  {
    title: 'Callout: Hint',
    description: 'Hint callout block',
    icon: Lightbulb,
    command: (editor) => editor.chain().focus().setCallout('hint').run(),
    preview: (
      <div className="scp-callout scp-callout-hint">
        <Lightbulb className="scp-callout-icon" />
        <span>A useful tip to keep in mind.</span>
      </div>
    ),
  },
  {
    title: 'Callout: Warning',
    description: 'Warning callout block',
    icon: AlertTriangle,
    command: (editor) => editor.chain().focus().setCallout('warning').run(),
    preview: (
      <div className="scp-callout scp-callout-warning">
        <AlertTriangle className="scp-callout-icon" />
        <span>Be careful when editing this section.</span>
      </div>
    ),
  },
  {
    title: 'Callout: Error',
    description: 'Error callout block',
    icon: XCircle,
    command: (editor) => editor.chain().focus().setCallout('error').run(),
    preview: (
      <div className="scp-callout scp-callout-error">
        <XCircle className="scp-callout-icon" />
        <span>Something went wrong. Try again.</span>
      </div>
    ),
  },
  {
    title: 'Callout: Success',
    description: 'Success callout block',
    icon: CheckCircle2,
    command: (editor) => editor.chain().focus().setCallout('success').run(),
    preview: (
      <div className="scp-callout scp-callout-success">
        <CheckCircle2 className="scp-callout-icon" />
        <span>Operation completed successfully!</span>
      </div>
    ),
  },
  {
    title: 'Bold',
    description: 'Thicken text',
    icon: Bold,
    command: (editor) => editor.chain().focus().toggleBold().run(),
    preview: (
      <div className="scp-text">
        <strong>Bold text</strong> makes words stand out.
      </div>
    ),
  },
  {
    title: 'Italic',
    description: 'Emphasize text',
    icon: Italic,
    command: (editor) => editor.chain().focus().toggleItalic().run(),
    preview: (
      <div className="scp-text">
        <em>Italic text</em> adds emphasis.
      </div>
    ),
  },
  {
    title: 'Underline',
    description: 'Underline text',
    icon: Underline,
    command: (editor) => editor.chain().focus().toggleUnderline().run(),
    preview: (
      <div className="scp-text">
        <u>Underlined text</u> draws attention.
      </div>
    ),
  },
  {
    title: 'Strikethrough',
    description: 'Cross out text',
    icon: Strikethrough,
    command: (editor) => editor.chain().focus().toggleStrike().run(),
    preview: (
      <div className="scp-text">
        <s>Strikethrough</s> marks deleted content.
      </div>
    ),
  },
  {
    title: 'Code',
    description: 'Inline code',
    icon: Code,
    command: (editor) => editor.chain().focus().toggleCode().run(),
    preview: (
      <div className="scp-text">
        Use <code className="scp-inline-code">inline code</code> for technical
        terms.
      </div>
    ),
  },
  {
    title: 'Align Left',
    description: 'Left align text',
    icon: AlignLeft,
    command: (editor) => editor.chain().focus().setTextAlign('left').run(),
    preview: (
      <div className="scp-text" style={{ textAlign: 'left' }}>
        Text aligned to the left side.
      </div>
    ),
  },
  {
    title: 'Align Center',
    description: 'Center align text',
    icon: AlignCenter,
    command: (editor) => editor.chain().focus().setTextAlign('center').run(),
    preview: (
      <div className="scp-text" style={{ textAlign: 'center' }}>
        Centered text
      </div>
    ),
  },
  {
    title: 'Align Right',
    description: 'Right align text',
    icon: AlignRight,
    command: (editor) => editor.chain().focus().setTextAlign('right').run(),
    preview: (
      <div className="scp-text" style={{ textAlign: 'right' }}>
        Right-aligned text
      </div>
    ),
  },
  {
    title: 'Link',
    description: 'Insert web link',
    icon: LinkIcon,
    command: () => {
      window.dispatchEvent(new Event('tiptap-open-link-modal'));
    },
    preview: (
      <div className="scp-text">
        Click this <span className="scp-link">hyperlink</span> to navigate.
      </div>
    ),
  },
  {
    title: 'Image',
    description: 'Upload image from device',
    icon: ImageIcon,
    command: () => {
      window.dispatchEvent(new Event('tiptap-open-image-picker'));
    },
    preview: (
      <div className="scp-image-preview">
        <ImageIcon className="scp-image-placeholder-icon" />
        <span>Uploaded image</span>
      </div>
    ),
  },
  {
    title: 'YouTube',
    description: 'Embed a YouTube video',
    keywords: ['youtube', 'video', 'embed'],
    icon: Youtube,
    command: () => {
      window.dispatchEvent(new Event('tiptap-open-youtube-modal'));
    },
    preview: (
      <div className="scp-youtube-preview">
        <div className="scp-youtube-placeholder">
          <Youtube className="scp-youtube-icon" />
          <span>▶ YouTube Video</span>
        </div>
      </div>
    ),
  },
  {
    title: 'Geist Sans',
    description: 'Apply Geist Sans font',
    keywords: ['font', 'geist', 'sans'],
    icon: Type,
    command: (editor) =>
      editor.chain().focus().setFontFamily("'Geist Sans'").run(),
    preview: (
      <div
        className="scp-text"
        style={{ fontFamily: "'Geist Sans', sans-serif" }}
      >
        Geist Sans font preview
      </div>
    ),
  },
  {
    title: 'Geist Mono',
    description: 'Apply Geist Mono font',
    keywords: ['font', 'geist', 'mono', 'code'],
    icon: Type,
    command: (editor) =>
      editor.chain().focus().setFontFamily("'Geist Mono'").run(),
    preview: (
      <div
        className="scp-text"
        style={{ fontFamily: "'Geist Mono', monospace" }}
      >
        Geist Mono font preview
      </div>
    ),
  },
  {
    title: 'Hedvig Sans',
    description: 'Apply Hedvig Sans font',
    keywords: ['font', 'hedvig', 'sans'],
    icon: Type,
    command: (editor) =>
      editor.chain().focus().setFontFamily("'Hedvig Sans'").run(),
    preview: (
      <div
        className="scp-text"
        style={{ fontFamily: "'Hedvig Sans', sans-serif" }}
      >
        Hedvig Sans font preview
      </div>
    ),
  },
  {
    title: 'Hedvig Serif',
    description: 'Apply Hedvig Serif font',
    keywords: ['font', 'hedvig', 'serif'],
    icon: Type,
    command: (editor) =>
      editor.chain().focus().setFontFamily("'Hedvig Serif'").run(),
    preview: (
      <div className="scp-text" style={{ fontFamily: "'Hedvig Serif', serif" }}>
        Hedvig Serif font preview
      </div>
    ),
  },
  {
    title: 'Clear Formatting',
    description: 'Remove all styles',
    icon: RemoveFormatting,
    command: (editor) =>
      editor.chain().focus().unsetAllMarks().clearNodes().run(),
    preview: (
      <div className="scp-text">
        <s style={{ textDecorationColor: '#ef4444' }}>formatted</s> → plain
      </div>
    ),
  },
  {
    title: 'Reset Font',
    description: 'Reset to default font',
    keywords: ['font', 'reset', 'default', 'manrope'],
    icon: RemoveFormatting,
    command: (editor) => editor.chain().focus().unsetFontFamily().run(),
    preview: (
      <div className="scp-text">
        <span style={{ fontFamily: 'monospace', fontSize: '0.7em' }}>
          Custom
        </span>{' '}
        → <span>Default (Manrope)</span>
      </div>
    ),
  },
];

interface CommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface CommandListProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
  editor: Editor;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let component: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let popup: any;

const CommandList = forwardRef<CommandListRef, CommandListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useEffect(() => {
      if (containerRef.current) {
        const item = containerRef.current.querySelector(
          '.is-selected'
        ) as HTMLElement;
        if (item) {
          item.scrollIntoView({ block: 'nearest' });
        }
      }
    }, [selectedIndex]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
          return true;
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % items.length);
          return true;
        }

        if (event.key === 'Enter') {
          const item = items[selectedIndex];
          if (item) command(item);
          return true;
        }

        return false;
      },
    }));

    const selectedItem = items[selectedIndex];

    if (items.length === 0) {
      return (
        <div className="slash-command-menu">
          <div className="slash-command-no-results">No results</div>
        </div>
      );
    }

    return (
      <div className="slash-command-menu">
        <div className="slash-command-list">
          <div className="slash-command-label">Block type</div>
          <div ref={containerRef} className="slash-command-items">
            {items.map((item, index) => {
              const Icon = item.icon;
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
                    <span className="slash-command-item-title">
                      {item.title}
                    </span>
                    <span className="slash-command-item-desc">
                      {item.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="slash-command-preview">
          <div className="slash-command-preview-label">Preview</div>
          <div className="slash-command-preview-content">
            {selectedItem?.preview ?? (
              <span className="text-gray-400 text-xs">No preview</span>
            )}
          </div>
        </div>
      </div>
    );
  }
);

CommandList.displayName = 'CommandList';

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
          editor: Editor;
          range: { from: number; to: number };
          props: CommandItem;
        }) => {
          editor.chain().focus().deleteRange(range).run();
          props.command(editor);
        },
        items: ({ query }: { query: string }) => {
          const normalizedQuery = query.trim().toLowerCase();
          if (!normalizedQuery) return commandItems;

          return commandItems.filter((item) => {
            const searchable = [
              item.title,
              item.description,
              ...(item.keywords ?? []),
            ]
              .join(' ')
              .toLowerCase();
            return searchable.includes(normalizedQuery);
          });
        },
        render: () => {
          return {
            onStart(props: {
              editor: Editor;
              clientRect: (() => DOMRect) | null;
              command: (item: CommandItem) => void;
              items: CommandItem[];
            }) {
              component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) return;

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
                maxWidth: 600,
              });
            },
            onUpdate(props: {
              editor: Editor;
              clientRect: (() => DOMRect) | null;
              command: (item: CommandItem) => void;
              items: CommandItem[];
            }) {
              component?.updateProps(props);

              if (props.clientRect && popup) {
                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              }
            },
            onKeyDown(props: { event: KeyboardEvent }) {
              if (props.event.key === 'Escape') {
                popup?.[0].hide();
                return true;
              }
              return component?.ref?.onKeyDown(props) ?? false;
            },
            onExit() {
              popup?.[0].destroy();
              component?.destroy();
            },
          };
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
