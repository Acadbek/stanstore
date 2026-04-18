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
import FontFamily from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import { SlashCommandExtension } from './slash-command';
import { Callout } from './callout';
import { Carousel, CarouselItem } from './carousel';
import { QuoteBlock } from './quote-block';
import { YoutubeEmbed } from './youtube-embed';
import { TocSidebar } from './toc-sidebar';
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
  Plus,
  ChevronDown,
  GalleryHorizontal,
  Sparkles,
  X,
  Youtube,
  Undo2,
  Redo2,
  MoreHorizontal,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generateReactHelpers } from '@uploadthing/react';
import type { OurFileRouter } from '@/lib/uploadthing';

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

type RichEditorProps = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onYoutubeThumbnail?: (thumbnailUrl: string) => void;
};

type QuoteStyle = 'line' | 'double';

type SelectionHint = {
  from: number;
  to: number;
  text: string;
  x: number;
  y: number;
};

type InlineCompletion = {
  text: string;
  from: number;
  contextKey: string;
};

type AiSuggestion = {
  id: string;
  label: string;
  text: string;
};

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded-md transition-colors ${disabled
        ? 'text-gray-300 cursor-not-allowed'
        : isActive
          ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
          : 'text-gray-500 hover:bg-gray-100'
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toSentenceCase(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function buildAiSuggestions(selectedText: string): AiSuggestion[] {
  const compact = selectedText.replace(/\s+/g, ' ').trim();
  const short =
    compact.length > 120 ? `${compact.slice(0, 117).trimEnd()}...` : compact;
  const benefit = toSentenceCase(
    `perfect for customers who want ${short.charAt(0).toLowerCase()}${short.slice(1)}`
  );
  const cta = short.endsWith('.')
    ? `${short} Grab it now.`
    : `${short}. Grab it now.`;

  return [
    { id: 'original', label: 'Original', text: compact },
    { id: 'short', label: 'Short', text: short },
    { id: 'benefit', label: 'Benefit Focus', text: benefit },
    { id: 'cta', label: 'CTA', text: cta },
  ];
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
  const editorRootRef = useRef<HTMLDivElement>(null);
  const [selectionHint, setSelectionHint] = useState<SelectionHint | null>(
    null
  );
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [inlineCompletion, setInlineCompletion] =
    useState<InlineCompletion | null>(null);
  const [isInlineCompletionLoading, setIsInlineCompletionLoading] =
    useState(false);
  const [inlineCompletionError, setInlineCompletionError] = useState<
    string | null
  >(null);
  const [inlineCompletionSource, setInlineCompletionSource] = useState<
    'local' | 'ai' | null
  >(null);
  const [editorText, setEditorText] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inlineCompletionRef = useRef<InlineCompletion | null>(null);
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionAbortRef = useRef<AbortController | null>(null);
  const completionRequestIdRef = useRef(0);

  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const youtubeUrlInputRef = useRef<HTMLInputElement>(null);
  const [currentFont, setCurrentFont] = useState('Manrope');
  const savedSelectionRef = useRef<{ from: number; to: number } | null>(null);
  const debugLogRef = useRef<string[]>([]);

  const debugLog = useCallback((...args: any[]) => {
    const msg = args
      .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
      .join(' ');
    debugLogRef.current.push(msg);
    console.log('[RICH-EDITOR]', ...args);
  }, []);

  const copyDebugLogs = useCallback(() => {
    const text = debugLogRef.current.join('\n');
    navigator.clipboard.writeText(text);
    console.log('[RICH-EDITOR] Logs copied!');
  }, []);

  const extractYoutubeEmbedUrl = (url: string): string | null => {
    try {
      const u = new URL(url);
      let videoId = '';
      if (u.hostname === 'youtu.be') {
        videoId = u.pathname.slice(1);
      } else if (u.hostname.includes('youtube.com')) {
        videoId = u.searchParams.get('v') || '';
        if (!videoId && u.pathname.startsWith('/embed/')) {
          videoId = u.pathname.replace('/embed/', '');
        }
        if (!videoId && u.pathname.startsWith('/shorts/')) {
          videoId = u.pathname.replace('/shorts/', '');
        }
      }
      if (!videoId) return null;
      videoId = videoId.split(/[?&]/)[0];
      return `https://www.youtube.com/embed/${videoId}`;
    } catch {
      return null;
    }
  };

  const resolveFontFamily = useCallback((ed: any): string => {
    const fromAttr = ed
      .getAttributes('textStyle')
      .fontFamily?.replace(/['"]/g, '');
    if (fromAttr) return fromAttr;
    const { from } = ed.state.selection;
    if (from === 0) return 'Manrope';
    const $pos = ed.state.doc.resolve(from);
    const textStyleMark = ed.state.schema.marks.textStyle;
    if (!textStyleMark) return 'Manrope';
    for (let d = $pos.depth; d > 0; d--) {
      const nodeAfter = $pos.parent.childAfter($pos.parentOffset);
      if (nodeAfter.node) {
        const found = nodeAfter.node.marks.find(
          (m: any) => m.type === textStyleMark
        );
        if (found) {
          return (
            (found.attrs.fontFamily as string)?.replace(/['"]/g, '') ||
            'Manrope'
          );
        }
      }
    }
    const storedMarks = ed.state.storedMarks;
    if (storedMarks) {
      const found = storedMarks.find((m: any) => m.type === textStyleMark);
      if (found) {
        return (
          (found.attrs.fontFamily as string)?.replace(/['"]/g, '') || 'Manrope'
        );
      }
    }
    return 'Manrope';
  }, []);

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
      YoutubeEmbed as any,
      TextStyle,
      FontFamily,
    ],
    content,
    onUpdate: ({ editor }) => {
      setEditorText(
        normalizeWhitespace(
          editor.state.doc.textBetween(
            0,
            editor.state.doc.content.size,
            '\n',
            '\n'
          )
        )
      );
      setCursorPosition(editor.state.selection.from);
      onChange(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const font = resolveFontFamily(editor);
      debugLog('onSelectionUpdate', {
        font,
        hasFocus: editor.view.hasFocus(),
        selection: {
          from: editor.state.selection.from,
          to: editor.state.selection.to,
          empty: editor.state.selection.empty,
        },
      });
      setCurrentFont(font);
    },
    editorProps: {
      attributes: {
        class: 'tiptap focus:outline-none',
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
    return () =>
      window.removeEventListener('tiptap-open-image-picker', onOpenImagePicker);
  }, [addImage]);

  const clearInlineCompletion = useCallback(() => {
    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
    completionAbortRef.current?.abort();
    completionAbortRef.current = null;
    setIsInlineCompletionLoading(false);
    setInlineCompletionError(null);
    setInlineCompletionSource(null);
    setInlineCompletion(null);
  }, []);

  useEffect(() => {
    inlineCompletionRef.current = inlineCompletion;
  }, [inlineCompletion]);

  const closeLinkModal = useCallback(() => {
    linkModalContextRef.current = null;
    setIsLinkModalOpen(false);
    setLinkModalContext(null);
  }, []);

  const openLinkModal = useCallback(() => {
    if (!editor) return;

    const { from, to, empty } = editor.state.selection;
    const wasLinkActive = editor.isActive('link');
    const selectedText = empty
      ? ''
      : editor.state.doc.textBetween(from, to, ' ');
    const previousUrl =
      (editor.getAttributes('link').href as string | undefined) || '';

    linkModalContextRef.current = {
      from,
      to,
      wasEmpty: empty,
      wasLinkActive,
      selectedText,
    };
    setLinkModalContext({ wasEmpty: empty, wasLinkActive, selectedText });
    setLinkUrl(previousUrl);
    setLinkText(selectedText);
    setIsLinkModalOpen(true);
  }, [editor]);

  const applyLinkFromModal = useCallback(() => {
    if (!editor) return;

    const context = linkModalContextRef.current;
    const href = normalizeLinkHref(linkUrl);
    const shouldInsertText = Boolean(
      context?.wasEmpty && !context.wasLinkActive
    );

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

  const updateSelectionHint = useCallback(() => {
    if (!editor || !editorRootRef.current) return;

    const { from, to, empty } = editor.state.selection;
    if (empty || from === to) {
      setSelectionHint(null);
      setIsAiPanelOpen(false);
      return;
    }

    const selectedText = editor.state.doc
      .textBetween(from, to, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!selectedText) {
      setSelectionHint(null);
      setIsAiPanelOpen(false);
      return;
    }

    const rootRect = editorRootRef.current.getBoundingClientRect();
    const start = editor.view.coordsAtPos(from);
    const end = editor.view.coordsAtPos(to);
    const centerX = (start.left + end.right) / 2;
    const topY = Math.min(start.top, end.top);

    setSelectionHint({
      from,
      to,
      text: selectedText,
      x: centerX - rootRect.left,
      y: topY - rootRect.top - 10,
    });
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      setIsAiPanelOpen(false);
      updateSelectionHint();
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    editor.on('blur', handleSelectionUpdate);

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
      editor.off('blur', handleSelectionUpdate);
    };
  }, [editor, updateSelectionHint]);

  useEffect(() => {
    if (!selectionHint) return;

    const updatePosition = () => updateSelectionHint();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [selectionHint, updateSelectionHint]);

  const aiSuggestions = useMemo(
    () => (selectionHint ? buildAiSuggestions(selectionHint.text) : []),
    [selectionHint]
  );

  const openAiPanel = useCallback(() => {
    if (!selectionHint) return;
    setIsAiPanelOpen(true);
  }, [selectionHint]);

  const applyAiSuggestion = useCallback(
    (suggestion: string) => {
      if (!editor || !selectionHint) return;

      editor
        .chain()
        .focus()
        .insertContentAt(
          { from: selectionHint.from, to: selectionHint.to },
          suggestion
        )
        .run();

      setIsAiPanelOpen(false);
      setSelectionHint(null);
    },
    [editor, selectionHint]
  );

  const applyInlineCompletion = useCallback(() => {
    const completion = inlineCompletionRef.current;
    if (!editor || !completion) return;

    editor.chain().focus().insertContent(completion.text).run();

    clearInlineCompletion();
  }, [clearInlineCompletion, editor]);

  const addHorizontalRule = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().setHorizontalRule().run();
  }, [editor]);

  useEffect(() => {
    const onOpen = () => {
      setYoutubeUrl('');
      setIsYoutubeModalOpen(true);
    };
    window.addEventListener('tiptap-open-youtube-modal', onOpen);
    return () =>
      window.removeEventListener('tiptap-open-youtube-modal', onOpen);
  }, []);

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
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      if (!editor.state.selection.empty) {
        clearInlineCompletion();
        return;
      }

      setCursorPosition(editor.state.selection.from);
    };

    editor.on('selectionUpdate', handleSelectionUpdate);

    const dom = editor.view.dom;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && inlineCompletionRef.current) {
        event.preventDefault();
        applyInlineCompletion();
      }

      if (event.key === 'Escape' && inlineCompletionRef.current) {
        event.preventDefault();
        clearInlineCompletion();
      }
    };

    dom.addEventListener('keydown', handleKeyDown);

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
      dom.removeEventListener('keydown', handleKeyDown);
    };
  }, [applyInlineCompletion, clearInlineCompletion, editor]);

  useEffect(() => {
    if (!editor) return;
    if (!editor.isFocused || !editor.state.selection.empty) return;

    const context = getCompletionContext(editor);
    if (!context) {
      clearInlineCompletion();
      return;
    }

    if (inlineCompletion?.contextKey === context.contextKey) {
      return;
    }

    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
    }

    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
    }

    completionAbortRef.current?.abort();
    setInlineCompletionError(null);
    setInlineCompletion(null);
    setInlineCompletionSource(null);
    setIsInlineCompletionLoading(false);

    completionTimerRef.current = setTimeout(async () => {
      const requestId = completionRequestIdRef.current + 1;
      completionRequestIdRef.current = requestId;

      const fallback = buildLocalContinuation(
        context.currentBlock,
        context.contextBefore
      );

      const applySuggestion = (
        suggestion: string,
        source: 'local' | 'ai',
        error?: string
      ) => {
        if (completionRequestIdRef.current !== requestId) return;
        if (!suggestion) {
          setInlineCompletion(null);
          setInlineCompletionError(error || 'No continuation available yet.');
          setInlineCompletionSource(null);
          setIsInlineCompletionLoading(false);
          return;
        }

        setInlineCompletion({
          text:
            suggestion.startsWith('.') || suggestion.startsWith(',')
              ? suggestion
              : ` ${suggestion}`,
          from: context.from,
          contextKey: context.contextKey,
        });
        setInlineCompletionSource(source);
        setInlineCompletionError(error || null);
        setIsInlineCompletionLoading(false);
      };

      setIsInlineCompletionLoading(true);

      const controller = new AbortController();
      completionAbortRef.current = controller;

      try {
        const response = await fetch('/api/editor/continue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contextBefore: context.contextBefore,
            currentBlock: context.currentBlock,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          applySuggestion(
            fallback,
            'local',
            'AI unavailable, showing local suggestion.'
          );
          setIsInlineCompletionLoading(false);
          return;
        }

        const data = (await response.json()) as {
          suggestion?: string;
          source?: 'local' | 'ai';
        };
        const remoteSuggestion = normalizeWhitespace(data.suggestion || '');
        applySuggestion(
          remoteSuggestion || fallback,
          data.source === 'ai' && remoteSuggestion ? 'ai' : 'local',
          remoteSuggestion ? undefined : 'Using local continuation.'
        );
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        applySuggestion(
          fallback,
          'local',
          'AI unavailable, showing local suggestion.'
        );
      }
    }, 900);
  }, [
    clearInlineCompletion,
    cursorPosition,
    editor,
    editorText,
    inlineCompletion?.contextKey,
  ]);

  const closeYoutubeModal = useCallback(() => {
    setIsYoutubeModalOpen(false);
    setYoutubeUrl('');
  }, []);

  useEffect(() => {
    if (!isYoutubeModalOpen) return;
    const frame = window.requestAnimationFrame(() => {
      youtubeUrlInputRef.current?.focus();
    });
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeYoutubeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isYoutubeModalOpen, closeYoutubeModal]);

  if (!editor) return null;

  const applyYoutubeEmbed = () => {
    if (!youtubeUrl.trim()) return;
    const embedUrl = extractYoutubeEmbedUrl(youtubeUrl.trim());
    if (embedUrl) {
      editor.chain().focus().setYoutubeEmbed(embedUrl).run();
      const videoId = extractVideoIdFromUrl(youtubeUrl.trim());
      if (videoId && onYoutubeThumbnail) {
        onYoutubeThumbnail(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
      }
    }
    closeYoutubeModal();
  };

  const extractVideoIdFromUrl = (url: string): string | null => {
    try {
      const u = new URL(url);
      let videoId = '';
      if (u.hostname === 'youtu.be') {
        videoId = u.pathname.slice(1);
      } else if (u.hostname.includes('youtube.com')) {
        videoId = u.searchParams.get('v') || '';
        if (!videoId && u.pathname.startsWith('/embed/')) {
          videoId = u.pathname.replace('/embed/', '');
        }
        if (!videoId && u.pathname.startsWith('/shorts/')) {
          videoId = u.pathname.replace('/shorts/', '');
        }
      }
      if (!videoId) return null;
      return videoId.split(/[?&]/)[0];
    } catch {
      return null;
    }
  };

  const rootWidth = editorRootRef.current?.clientWidth ?? 560;
  const aiPanelWidth = Math.min(420, Math.max(280, rootWidth - 16));
  const aiHintX = selectionHint
    ? clamp(selectionHint.x, 30, Math.max(30, rootWidth - 30))
    : 30;
  const aiPanelLeft = selectionHint
    ? clamp(
      aiHintX - aiPanelWidth / 2,
      8,
      Math.max(8, rootWidth - aiPanelWidth - 8)
    )
    : 8;
  const aiPanelTop = selectionHint ? Math.max(selectionHint.y + 26, 56) : 56;
  const shouldShowInlineBar =
    Boolean(inlineCompletion) ||
    isInlineCompletionLoading ||
    Boolean(inlineCompletionError);

  return (
    <div
      ref={editorRootRef}
      className="rounded-xl border border-gray-200 bg-white relative overflow-hidden h-screen flex flex-col"
    >
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50/80 sticky top-0 z-10">
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
        </div>
        <ToolbarSeparator />
        <DropdownMenu
          onOpenChange={(open) => {
            if (open) {
              const { from, to } = editor.state.selection;
              savedSelectionRef.current = { from, to };
              debugLog(
                'DROPDOWN OPEN - saved selection',
                savedSelectionRef.current
              );
            } else {
              savedSelectionRef.current = null;
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title="Font family"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-gray-100 transition-colors text-gray-700 max-w-[140px] truncate shrink-0"
            >
              <span className="truncate">{currentFont}</span>
              <ChevronDown className="h-3 w-3 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuItem
              onClick={() => {
                const sel = savedSelectionRef.current;
                debugLog('FONT CLICK Manrope', {
                  sel,
                  hasFocus: editor.view.hasFocus(),
                });
                if (!sel) return;
                editor.chain().setTextSelection(sel).unsetFontFamily().run();
                debugLog('FONT CLICK Manrope applied', {
                  currentFont: resolveFontFamily(editor),
                });
              }}
            >
              <span style={{ fontFamily: 'Manrope' }}>Manrope</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const sel = savedSelectionRef.current;
                debugLog('FONT CLICK Geist Sans', {
                  sel,
                  hasFocus: editor.view.hasFocus(),
                });
                if (!sel) return;
                editor
                  .chain()
                  .setTextSelection(sel)
                  .setFontFamily("'Geist Sans'")
                  .run();
                debugLog('FONT CLICK Geist Sans applied', {
                  currentFont: resolveFontFamily(editor),
                });
              }}
            >
              <span style={{ fontFamily: "'Geist Sans'" }}>Geist Sans</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const sel = savedSelectionRef.current;
                debugLog('FONT CLICK Geist Mono', {
                  sel,
                  hasFocus: editor.view.hasFocus(),
                });
                if (!sel) return;
                editor
                  .chain()
                  .setTextSelection(sel)
                  .setFontFamily("'Geist Mono'")
                  .run();
                debugLog('FONT CLICK Geist Mono applied', {
                  currentFont: resolveFontFamily(editor),
                });
              }}
            >
              <span style={{ fontFamily: "'Geist Mono'" }}>Geist Mono</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const sel = savedSelectionRef.current;
                debugLog('FONT CLICK Hedvig Sans', {
                  sel,
                  hasFocus: editor.view.hasFocus(),
                });
                if (!sel) return;
                editor
                  .chain()
                  .setTextSelection(sel)
                  .setFontFamily("'Hedvig Sans'")
                  .run();
                debugLog('FONT CLICK Hedvig Sans applied', {
                  currentFont: resolveFontFamily(editor),
                });
              }}
            >
              <span style={{ fontFamily: "'Hedvig Sans'" }}>Hedvig Sans</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const sel = savedSelectionRef.current;
                debugLog('FONT CLICK Hedvig Serif', {
                  sel,
                  hasFocus: editor.view.hasFocus(),
                });
                if (!sel) return;
                editor
                  .chain()
                  .setTextSelection(sel)
                  .setFontFamily("'Hedvig Serif'")
                  .run();
                debugLog('FONT CLICK Hedvig Serif applied', {
                  currentFont: resolveFontFamily(editor),
                });
              }}
            >
              <span style={{ fontFamily: "'Hedvig Serif'" }}>Hedvig Serif</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ToolbarSeparator />
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
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="Code"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <div className="ml-auto shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="Quote style"
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1.5 hover:bg-gray-100 transition-colors ${editor.isActive('blockquote')
                  ? 'bg-orange-100 text-orange-600'
                  : 'text-gray-500'
                  }`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              >
                <List className="h-4 w-4 mr-2" />
                Bullet List
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
              >
                <ListOrdered className="h-4 w-4 mr-2" />
                Ordered List
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleTaskList().run()}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Checkbox
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyQuoteStyle('line')}>
                <Quote className="h-4 w-4 mr-2" />
                Quote (line)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyQuoteStyle('double')}>
                <Quote className="h-4 w-4 mr-2" />
                Quote (&quot;&quot;)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().unsetBlockquote().run()}
              >
                <Quote className="h-4 w-4 mr-2" />
                Remove quote
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().setTextAlign('left').run()
                }
              >
                <AlignLeft className="h-4 w-4 mr-2" />
                Align Left
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().setTextAlign('center').run()
                }
              >
                <AlignCenter className="h-4 w-4 mr-2" />
                Align Center
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().setTextAlign('right').run()
                }
              >
                <AlignRight className="h-4 w-4 mr-2" />
                Align Right
              </DropdownMenuItem>
              <DropdownMenuItem onClick={addHorizontalRule}>
                <Minus className="h-4 w-4 mr-2" />
                Divider
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openLinkModal}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Add Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={addImage}>
                <ImageIcon className="h-4 w-4 mr-2" />
                Add Image
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().insertCarousel().run()}
              >
                <GalleryHorizontal className="h-4 w-4 mr-2" />
                Carousel
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setYoutubeUrl('');
                  setIsYoutubeModalOpen(true);
                }}
              >
                <Youtube className="h-4 w-4 mr-2" />
                YouTube Video
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().unsetAllMarks().clearNodes().run()
                }
              >
                <RemoveFormatting className="h-4 w-4 mr-2" />
                Clear Formatting
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="py-3 relative">
            <DragHandle editor={editor}>
              <div className="drag-handle">
                <button type="button" className="drag-handle-grip">
                  <GripVertical className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="drag-handle-add"
                  title="Add block"
                  onPointerDown={(e: React.PointerEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!editor) return;
                    const { from } = editor.state.selection;
                    const $pos = editor.state.doc.resolve(from);
                    const nodeEnd = $pos.end() + 1;
                    editor
                      .chain()
                      .focus()
                      .insertContentAt(nodeEnd, { type: 'paragraph' })
                      .setTextSelection(nodeEnd + 1)
                      .run();
                    const tr = editor.state.tr.insertText('/');
                    editor.view.dispatch(tr);
                  }}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </DragHandle>
            <EditorContent editor={editor} />
          </div>
        </div>
        <div className="w-56 shrink-0 border-l border-gray-100 overflow-y-auto bg-gray-50/40">
          <TocSidebar maxShowCount={20} topOffset={80} />
        </div>
      </div>

      {shouldShowInlineBar && (
        <div className="flex items-center gap-2 border-t border-orange-100 bg-orange-50/70 px-3 py-2 text-xs">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-orange-500" />
          <div className="min-w-0 flex-1 text-gray-600">
            {inlineCompletion ? (
              <span className="truncate">
                Suggestion:
                <span className="ml-1 text-gray-500">
                  {inlineCompletion.text}
                </span>
                {inlineCompletionSource && (
                  <span className="ml-2 rounded-full border border-orange-200 bg-white px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-orange-600">
                    {inlineCompletionSource}
                  </span>
                )}
              </span>
            ) : isInlineCompletionLoading ? (
              <span>AI is generating a continuation...</span>
            ) : (
              <span>{inlineCompletionError}</span>
            )}
          </div>
          {inlineCompletion && (
            <>
              <button
                type="button"
                className="rounded-md border border-orange-200 bg-white px-2 py-1 font-medium text-orange-600 hover:bg-orange-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={applyInlineCompletion}
              >
                Accept Tab
              </button>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-gray-500 hover:bg-white"
                onMouseDown={(e) => e.preventDefault()}
                onClick={clearInlineCompletion}
              >
                Dismiss
              </button>
            </>
          )}
        </div>
      )}

      {selectionHint && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={openAiPanel}
          className="absolute z-30 inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-medium text-orange-600 shadow-sm hover:bg-orange-50"
          style={{
            left: `${aiHintX}px`,
            top: `${Math.max(selectionHint.y, 42)}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI
        </button>
      )}

      {selectionHint && isAiPanelOpen && (
        <div
          className="absolute z-30 rounded-xl border border-orange-100 bg-white p-3 shadow-lg"
          style={{
            top: `${aiPanelTop}px`,
            left: `${aiPanelLeft}px`,
            width: `${aiPanelWidth}px`,
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900">
                AI Suggestions
              </p>
              <p className="text-xs text-gray-500 truncate">
                {selectionHint.text}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close AI panel"
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              onClick={() => setIsAiPanelOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-2.5 py-2 font-medium">Style</th>
                  <th className="px-2.5 py-2 font-medium">Preview</th>
                  <th className="px-2.5 py-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {aiSuggestions.map((suggestion) => (
                  <tr
                    key={suggestion.id}
                    className="border-t border-gray-100 align-top"
                  >
                    <td className="px-2.5 py-2 text-gray-800">
                      {suggestion.label}
                    </td>
                    <td className="px-2.5 py-2 text-gray-600">
                      {suggestion.text}
                    </td>
                    <td className="px-2.5 py-2 text-right">
                      <button
                        type="button"
                        className="rounded-md border border-orange-200 px-2 py-1 text-[11px] font-medium text-orange-600 hover:bg-orange-50"
                        onClick={() => applyAiSuggestion(suggestion.text)}
                      >
                        Use
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
              {linkModalContext?.wasEmpty &&
                !linkModalContext.wasLinkActive && (
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={removeLinkFromModal}
                >
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

      {isYoutubeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onMouseDown={(e) => {
              e.preventDefault();
              closeYoutubeModal();
            }}
          />
          <div
            className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-label="YouTube Video"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  YouTube Video
                </h3>
                <p className="text-xs text-gray-500">
                  Paste a YouTube video link
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 text-gray-400 hover:text-gray-700 px-2 py-1 rounded-md"
                onClick={closeYoutubeModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="youtubeUrl">Video URL</Label>
                <Input
                  id="youtubeUrl"
                  ref={youtubeUrlInputRef}
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  autoComplete="off"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applyYoutubeEmbed();
                    }
                  }}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeYoutubeModal}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={applyYoutubeEmbed}
              >
                Add Video
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
