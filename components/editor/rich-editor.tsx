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
import { QuoteBlock } from './quote-block';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  ChevronDown,
  GalleryHorizontal,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { generateReactHelpers } from '@uploadthing/react';
import type { OurFileRouter } from '@/lib/uploadthing';

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

type RichEditorProps = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

type QuoteStyle = 'line' | 'double';

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

function normalizeLinkHref(href: string) {
  const trimmed = href.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return trimmed;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function RichEditor({
  content,
  onChange,
  placeholder,
}: RichEditorProps) {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const linkUrlInputRef = useRef<HTMLInputElement>(null);
  const linkModalContextRef = useRef<{
    from: number;
    to: number;
    wasEmpty: boolean;
    wasLinkActive: boolean;
    selectedText: string;
  } | null>(null);
  const [linkModalContext, setLinkModalContext] = useState<{
    wasEmpty: boolean;
    wasLinkActive: boolean;
    selectedText: string;
  } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        blockquote: false,
      }),
      QuoteBlock,
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

  useEffect(() => {
    const onOpenImagePicker = () => addImage();
    window.addEventListener('tiptap-open-image-picker', onOpenImagePicker);
    return () => window.removeEventListener('tiptap-open-image-picker', onOpenImagePicker);
  }, [addImage]);

  const closeLinkModal = useCallback(() => {
    linkModalContextRef.current = null;
    setIsLinkModalOpen(false);
    setLinkModalContext(null);
  }, []);

  const openLinkModal = useCallback(() => {
    if (!editor) return;

    const { from, to, empty } = editor.state.selection;
    const wasLinkActive = editor.isActive('link');
    const selectedText = empty ? '' : editor.state.doc.textBetween(from, to, ' ');
    const previousUrl = (editor.getAttributes('link').href as string | undefined) || '';

    linkModalContextRef.current = { from, to, wasEmpty: empty, wasLinkActive, selectedText };
    setLinkModalContext({ wasEmpty: empty, wasLinkActive, selectedText });
    setLinkUrl(previousUrl);
    setLinkText(selectedText);
    setIsLinkModalOpen(true);
  }, [editor]);

  const applyLinkFromModal = useCallback(() => {
    if (!editor) return;

    const context = linkModalContextRef.current;
    const href = normalizeLinkHref(linkUrl);
    const shouldInsertText = Boolean(context?.wasEmpty && !context.wasLinkActive);

    let chain = editor.chain().focus();
    if (context) {
      chain = chain.setTextSelection({ from: context.from, to: context.to });
    }

    if (!href) {
      chain.extendMarkRange('link').unsetLink().run();
      closeLinkModal();
      return;
    }

    if (shouldInsertText) {
      const text = linkText.trim() || href;
      chain.setLink({ href }).insertContent(text).unsetLink().run();
      closeLinkModal();
      return;
    }

    chain.extendMarkRange('link').setLink({ href }).run();
    closeLinkModal();
  }, [closeLinkModal, editor, linkText, linkUrl]);

  const removeLinkFromModal = useCallback(() => {
    if (!editor) return;

    const context = linkModalContextRef.current;
    let chain = editor.chain().focus();
    if (context) {
      chain = chain.setTextSelection({ from: context.from, to: context.to });
    }

    chain.extendMarkRange('link').unsetLink().run();
    closeLinkModal();
  }, [closeLinkModal, editor]);

  useEffect(() => {
    if (!isLinkModalOpen) return;

    const frame = window.requestAnimationFrame(() => {
      linkUrlInputRef.current?.focus();
      linkUrlInputRef.current?.select();
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLinkModal();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [closeLinkModal, isLinkModalOpen]);

  useEffect(() => {
    const onOpen = () => openLinkModal();
    window.addEventListener('tiptap-open-link-modal', onOpen);
    return () => window.removeEventListener('tiptap-open-link-modal', onOpen);
  }, [openLinkModal]);

  const addHorizontalRule = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().setHorizontalRule().run();
  }, [editor]);

  const applyQuoteStyle = useCallback(
    (style: QuoteStyle) => {
      if (!editor) return;

      if (editor.isActive('blockquote')) {
        editor
          .chain()
          .focus()
          .updateAttributes('blockquote', { quoteStyle: style })
          .run();
        return;
      }

      editor
        .chain()
        .focus()
        .toggleBlockquote()
        .updateAttributes('blockquote', { quoteStyle: style })
        .run();
    },
    [editor]
  );

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
            title="Checkbox"
          >
            <CheckSquare className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <ToolbarSeparator />

        <div className="flex items-center gap-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="Quote style"
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1.5 hover:bg-gray-100 transition-colors ${
                  editor.isActive('blockquote') ? 'bg-orange-100 text-orange-600' : 'text-gray-500'
                }`}
              >
                <Quote className="h-4 w-4" />
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem onClick={() => applyQuoteStyle('line')}>
                Quote (line)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyQuoteStyle('double')}>
                Quote ("")
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().unsetBlockquote().run()}
              >
                Remove quote
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            onClick={openLinkModal}
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
            <GalleryHorizontal className="h-4 w-4" />
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

      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onMouseDown={(e) => {
              e.preventDefault();
              closeLinkModal();
            }}
          />
          <div
            className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-label="Link"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {linkModalContext?.wasLinkActive ? 'Edit link' : 'Add link'}
                </h3>
                {!!linkModalContext?.selectedText && (
                  <p className="text-xs text-gray-500 truncate">
                    {linkModalContext.selectedText}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="shrink-0 text-gray-400 hover:text-gray-700 px-2 py-1 rounded-md"
                onClick={closeLinkModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {linkModalContext?.wasEmpty && !linkModalContext.wasLinkActive && (
                <div className="space-y-1.5">
                  <Label htmlFor="linkText">Text</Label>
                  <Input
                    id="linkText"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="Link text"
                    autoComplete="off"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applyLinkFromModal();
                      }
                    }}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="linkUrl">URL</Label>
                <Input
                  id="linkUrl"
                  ref={linkUrlInputRef}
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  autoComplete="off"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applyLinkFromModal();
                    }
                  }}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeLinkModal}>
                Cancel
              </Button>
              {linkModalContext?.wasLinkActive && (
                <Button type="button" variant="outline" onClick={removeLinkFromModal}>
                  Remove
                </Button>
              )}
              <Button
                type="button"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={applyLinkFromModal}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
