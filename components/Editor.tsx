import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import ImageResize from 'tiptap-extension-resize-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { FontFamily } from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import { Heading } from '@tiptap/extension-heading';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, Heading1, Heading2, Heading3, Heading4, Link as LinkIcon,
  Image as ImageIcon, Undo, Redo, Eraser, Scissors, Upload, Link2, X, Type
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { cn } from '@/lib/utils';

export type EditorRef = {
  insertImage: (url: string) => void;
};

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
}

const Editor = forwardRef<EditorRef, EditorProps>(({ content, onChange }, ref) => {
  const [pageCount, setPageCount] = useState(1);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable built-in heading to use the custom extension
        link: false,    // Avoid duplicates
        underline: false, // Avoid duplicates
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Heading.configure({
        levels: [1, 2, 3, 4],
      }),
      Underline,
      ImageResize,
      Typography,
      TextStyle,
      FontFamily,
      Placeholder.configure({
        placeholder: 'Comece a escrever seu capítulo aqui...',
      }),
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    immediatelyRender: false,
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      // Estimate page count (A4 height is ~1123px)
      const height = editor.view.dom.scrollHeight;
      const pages = Math.max(1, Math.ceil(height / 1050)); // Using 1050 for a bit of margin
      setPageCount(pages);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[600px] p-8 bg-white rounded-b-md border border-slate-200 shadow-sm ebook-editor-content transition-all duration-300',
      },
    },
  });

  useImperativeHandle(ref, () => ({
    insertImage: (url: string) => {
      if (editor) {
        (editor.chain().focus() as any).setImage({ src: url }).run();
      }
    }
  }));

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
      const height = editor.view.dom.scrollHeight;
      setPageCount(Math.max(1, Math.ceil(height / 1050)));
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const addImageByUrl = () => {
    if (imageUrl) {
      (editor?.chain().focus() as any).setImage({ src: imageUrl }).run();
      setImageUrl('');
      setIsImageModalOpen(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        (editor?.chain().focus() as any).setImage({ src: result }).run();
        setIsImageModalOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const setLink = () => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL do link:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Custom Simple Image Modal to avoid library hook issues */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Inserir Imagem</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsImageModalOpen(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4">
              <div className="flex p-1 bg-slate-100 rounded-lg mb-4">
                <button
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all",
                    activeTab === 'url' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
                  )}
                  onClick={() => setActiveTab('url')}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  URL
                </button>
                <button
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all",
                    activeTab === 'upload' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
                  )}
                  onClick={() => setActiveTab('upload')}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload
                </button>
              </div>

              {activeTab === 'url' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Link da Imagem</label>
                    <input
                      type="text"
                      placeholder="https://exemplo.com/imagem.jpg"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addImageByUrl()}
                      autoFocus
                    />
                  </div>
                  <Button onClick={addImageByUrl} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={!imageUrl}>
                    Inserir Imagem
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center cursor-pointer hover:bg-slate-50 hover:border-indigo-300 transition-all group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="h-6 w-6 text-indigo-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">Clique para selecionar</p>
                  <p className="text-xs text-slate-400 mt-1">ou arraste uma imagem aqui</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 p-1.5 sm:p-2 bg-slate-50 border border-slate-200 rounded-t-md sticky top-0 z-10 transition-all">
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn("h-8 w-8", editor.isActive('bold') ? 'bg-slate-200' : '')}
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn("h-8 w-8", editor.isActive('italic') ? 'bg-slate-200' : '')}
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn("h-8 w-8", editor.isActive('underline') ? 'bg-slate-200' : '')}
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), "h-8 gap-2 px-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer outline-none")}>
              <Type className="h-3.5 w-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Fonte</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Inter').run()} className="font-sans">Inter (Padrão)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('serif').run()} className="font-serif">Serifado (Clássico)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('monospace').run()} className="font-mono">Monoespaçado</DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Georgia').run()} style={{ fontFamily: 'Georgia' }}>Georgia</DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Impact').run()} style={{ fontFamily: 'Impact' }}>Impact (Destaque)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="w-[1px] h-6 bg-slate-300 mx-0.5 self-center" />

        <div className="flex flex-wrap gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn("h-8 w-8", editor.isActive('heading', { level: 1 }) ? 'bg-slate-200 text-indigo-600' : '')}
          >
            <Heading1 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn("h-8 w-8", editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 text-indigo-600' : '')}
          >
            <Heading2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn("h-8 w-8", editor.isActive('heading', { level: 3 }) ? 'bg-slate-200 text-indigo-600' : '')}
          >
            <Heading3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
            className={cn("h-8 w-8", editor.isActive('heading', { level: 4 }) ? 'bg-slate-200 text-indigo-600' : '')}
          >
            <Heading4 className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="w-[1px] h-6 bg-slate-300 mx-0.5 self-center" />

        <div className="flex flex-wrap gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn("h-8 w-8", editor.isActive('bulletList') ? 'bg-slate-200' : '')}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn("h-8 w-8", editor.isActive('orderedList') ? 'bg-slate-200' : '')}
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="w-[1px] h-6 bg-slate-300 mx-0.5 self-center" />

        <div className="flex flex-wrap gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={cn("h-8 w-8", editor.isActive({ textAlign: 'left' }) ? 'bg-slate-200' : '')}
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={cn("h-8 w-8", editor.isActive({ textAlign: 'center' }) ? 'bg-slate-200' : '')}
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={cn("h-8 w-8", editor.isActive({ textAlign: 'right' }) ? 'bg-slate-200' : '')}
          >
            <AlignRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={cn("h-8 w-8", editor.isActive({ textAlign: 'justify' }) ? 'bg-slate-200' : '')}
          >
            <AlignJustify className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="w-[1px] h-6 bg-slate-300 mx-0.5 self-center" />

        <div className="flex flex-wrap gap-1">
          <Button variant="ghost" size="icon" onClick={setLink} className={cn("h-8 w-8", editor.isActive('link') ? 'bg-slate-200' : '')}>
            <LinkIcon className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsImageModalOpen(true)} className="h-8 w-8">
            <ImageIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            className="h-8 w-8"
            title="Limpar Formatação"
          >
            <Eraser className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="h-8 w-8"
            title="Inserir Quebra de Página"
          >
            <Scissors className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            Páginas: {pageCount}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().undo().run()} className="h-8 w-8">
              <Undo className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().redo().run()} className="h-8 w-8">
              <Redo className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
      <div className="relative bg-slate-200/40 p-12 overflow-x-auto rounded-b-md border-x border-b border-slate-200">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
});

export default Editor;
