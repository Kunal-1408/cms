"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Image as TiptapImage } from "@tiptap/extension-image"
import { Link as TiptapLink } from "@tiptap/extension-link"
import { Table as TiptapTable } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import TextAlign from "@tiptap/extension-text-align"
import { Bold, Italic, Link2, ImageIcon, TableIcon, List, AlignLeft, AlignCenter, AlignRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapImage,
      TiptapLink,
      TiptapTable.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) {
    return null
  }

  const addImage = () => {
    const url = window.prompt("Enter the image URL")
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addLink = () => {
    const url = window.prompt("Enter the URL")
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  return (
    <div className="rich-text-editor border rounded-md">
      <div className="menu-bar flex items-center gap-1 p-2 border-b bg-muted/50">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn("p-2 hover:bg-muted rounded-md transition-colors", editor.isActive("bold") && "bg-muted")}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn("p-2 hover:bg-muted rounded-md transition-colors", editor.isActive("italic") && "bg-muted")}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          onClick={addLink}
          className={cn("p-2 hover:bg-muted rounded-md transition-colors", editor.isActive("link") && "bg-muted")}
          title="Add Link"
        >
          <Link2 className="h-4 w-4" />
        </button>
        <button onClick={addImage} className="p-2 hover:bg-muted rounded-md transition-colors" title="Add Image">
          <ImageIcon className="h-4 w-4" />
        </button>
        <button
          onClick={addTable}
          className={cn("p-2 hover:bg-muted rounded-md transition-colors", editor.isActive("table") && "bg-muted")}
          title="Add Table"
        >
          <TableIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn("p-2 hover:bg-muted rounded-md transition-colors", editor.isActive("bulletList") && "bg-muted")}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={cn(
            "p-2 hover:bg-muted rounded-md transition-colors",
            editor.isActive({ textAlign: "left" }) && "bg-muted",
          )}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={cn(
            "p-2 hover:bg-muted rounded-md transition-colors",
            editor.isActive({ textAlign: "center" }) && "bg-muted",
          )}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={cn(
            "p-2 hover:bg-muted rounded-md transition-colors",
            editor.isActive({ textAlign: "right" }) && "bg-muted",
          )}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </button>
      </div>
      <EditorContent editor={editor} className="prose prose-sm max-w-none p-4 focus:outline-none" />
    </div>
  )
}

