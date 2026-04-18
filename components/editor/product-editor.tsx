'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Redo2, Undo2 } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

type ProductEditorProps = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

function ToolbarButton({
  title,
  disabled,
  onClick,
  children,
}: {
  title: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
        disabled
          ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
          : 'border-orange-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600'
      }`}
    >
      {children}
    </button>
  );
}

export default function ProductEditor({
  content,
  onChange,
  placeholder = 'Describe your product in detail...',
}: ProductEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'min-h-[220px] px-4 py-3 text-sm text-gray-700 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;

    if (content !== editor.getHTML()) {
      editor.commands.setContent(content || '', { emitUpdate: false });
    }
  }, [content, editor]);

  if (!isMounted || !editor) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
          <div className="h-9 w-24 animate-pulse rounded-md bg-gray-200" />
          <div className="h-9 w-24 animate-pulse rounded-md bg-gray-200" />
        </div>
        <div className="min-h-[220px] bg-white px-4 py-3" />
      </div>
    );
  }

  const canUndo = editor.can().chain().focus().undo().run();
  const canRedo = editor.can().chain().focus().redo().run();

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
        <ToolbarButton
          title="Undo"
          disabled={!canUndo}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
          Undo
        </ToolbarButton>
        <ToolbarButton
          title="Redo"
          disabled={!canRedo}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
          Redo
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
