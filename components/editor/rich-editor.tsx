'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import DragHandle from '@tiptap/extension-drag-handle-react';
import { SlashCommandExtension } from './slash-command';
import { Callout } from './callout';
import { Carousel, CarouselItem } from './carousel';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Link as LinkIcon,
  RemoveFormatting,
  CheckSquare,
  Minus,
  GripVertical,
  Trash2,
  LayoutGrid,
} from 'lucide-react';
import { useCallback } from 'react';
import { generateReactHelpers } from '@uploadthing/react';
import type { OurFileRouter } from '@/lib/uploadthing';

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

type RichEditorProps = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

function ToolbarButton({
  onClick,
  isActive,
  title,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md hover:bg-gray-100 transition-colors ${
        isActive ? 'bg-orange-100 text-orange-600' : 'text-gray-500'
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="w-px h-6 bg-gray-200 mx-0.5" />;
}

export default function RichEditor({
  content,
  onChange,
  placeholder,
}: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
        inline: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-orange-500 underline hover:text-orange-600',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing your product description...',
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: false,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      SlashCommandExtension as any,
      Callout as any,
      CarouselItem,
      Carousel,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap min-h-[300px] focus:outline-none',
      },
    },
    immediatelyRender: false,
  });

  const { startUpload, isUploading } = useUploadThing('avatarUploader', {
    onClientUploadComplete: async (res) => {
      const url = res?.[0]?.ufsUrl;
      if (url && editor) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    },
  });

  const addImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        await startUpload(Array.from(files));
      }
    };
    input.click();
  }, [startUpload]);

  const handleAddLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url })
      .run();
  }, [editor]);

  const addHorizontalRule = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().setHorizontalRule().run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white relative">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50/80 sticky top-0 z-10">
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleUnderline().run()
            }
            isActive={editor.isActive('underline')}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleStrike().run()
            }
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleCode().run()
            }
            isActive={editor.isActive('code')}
            title="Code"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <ToolbarSeparator />

        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .toggleHeading({ level: 1 })
                .run()
            }
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .toggleHeading({ level: 2 })
                .run()
            }
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .toggleHeading({ level: 3 })
                .run()
            }
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <ToolbarSeparator />

        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleBulletList().run()
            }
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleOrderedList().run()
            }
            isActive={editor.isActive('orderedList')}
            title="Ordered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleTaskList().run()
            }
            isActive={editor.isActive('taskList')}
            title="Checklist"
          >
            <CheckSquare className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <ToolbarSeparator />

        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleBlockquote().run()
            }
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().setTextAlign('left').run()
            }
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .setTextAlign('center')
                .run()
            }
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .setTextAlign('right')
                .run()
            }
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={addHorizontalRule}
            title="Divider"
          >
            <Minus className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <ToolbarSeparator />

        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={handleAddLink}
            isActive={editor.isActive('link')}
            title="Add Link"
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={addImage} title="Add Image">
            {isUploading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-orange-500" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().insertCarousel().run()}
            title="Carousel"
          >
            <LayoutGrid className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <ToolbarSeparator />

        <ToolbarButton
          onClick={() =>
            editor
              .chain()
              .focus()
              .unsetAllMarks()
              .clearNodes()
              .run()
          }
          title="Clear Formatting"
        >
          <RemoveFormatting className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <div className="px-8 py-3 pl-12 min-h-[300px] relative">
        <DragHandle editor={editor}>
          <div className="drag-handle">
            <button type="button" className="drag-handle-grip">
              <GripVertical className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="drag-handle-delete"
              title="Delete block"
              onPointerDown={(e: React.PointerEvent) => {
                e.preventDefault();
                e.stopPropagation();
                if (!editor) return;
                const { from } = editor.state.selection;
                const $pos = editor.state.doc.resolve(from);
                const nodeStart = Number($pos.start) - 1;
                const nodeEnd = nodeStart + Number($pos.parent.nodeSize);
                editor
                  .chain()
                  .focus()
                  .deleteRange({ from: nodeStart, to: nodeEnd })
                  .run();
              }}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </DragHandle>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
