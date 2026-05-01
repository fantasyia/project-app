"use client";

import { useEffect } from "react";
import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

type RichTextEditorProps = {
  initialContent: string;
  placeholder?: string;
  onChange: (payload: { html: string; text: string }) => void;
  onEditorReady?: (editor: any) => void;
  onSelectionChange?: (selection: string) => void;
};

export function RichTextEditor({
  initialContent,
  placeholder = "Escreva o corpo do artigo...",
  onChange,
  onEditorReady,
  onSelectionChange,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-brand-400 underline underline-offset-4",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "min-h-[380px] rounded-[20px] bg-white px-5 py-5 text-base font-light leading-8 text-slate-900 outline-none [&_blockquote]:rounded-[20px] [&_blockquote]:border-l-4 [&_blockquote]:border-teal-700/60 [&_blockquote]:bg-teal-50 [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote_p]:m-0 [&_h2]:mt-8 [&_h2]:text-3xl [&_h2]:font-light [&_h2]:tracking-[-0.03em] [&_h2]:text-teal-900 [&_h3]:mt-6 [&_h3]:text-2xl [&_h3]:font-light [&_h3]:tracking-[-0.02em] [&_h3]:text-teal-900 [&_h4]:mt-5 [&_h4]:text-xl [&_h4]:font-semibold [&_h4]:text-teal-900 [&_li]:ml-5 [&_li]:list-disc [&_p]:my-3 [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-slate-400 [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
      },
    },
    onCreate: ({ editor: nextEditor }) => {
      onChange({
        html: nextEditor.getHTML(),
        text: nextEditor.getText(),
      });
      onEditorReady?.(nextEditor);
    },
    onUpdate: ({ editor: nextEditor }) => {
      onChange({
        html: nextEditor.getHTML(),
        text: nextEditor.getText(),
      });
    },
    onSelectionUpdate: ({ editor: nextEditor }) => {
      const { from, to } = nextEditor.state.selection;
      onSelectionChange?.(nextEditor.state.doc.textBetween(from, to, " ").trim());
    },
  });

  useEffect(() => {
    onEditorReady?.(editor);
    return () => onEditorReady?.(null);
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() === initialContent) return;
    editor.commands.setContent(initialContent, { emitUpdate: false });
  }, [editor, initialContent]);

  if (!editor) {
    return (
      <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6 text-sm text-brand-text-muted">
        Preparando editor...
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white">
      <EditorContent editor={editor} />
    </div>
  );
}
