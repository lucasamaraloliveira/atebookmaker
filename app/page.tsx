'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Ebook, Chapter, EbookTheme } from '@/types';
import ChapterSidebar from '@/components/ChapterSidebar';
import Editor from '@/components/Editor';
import AIAssistant from '@/components/AIAssistant';
import EbookPreview from '@/components/EbookPreview';
import Dashboard from '@/components/Dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  BookOpen, 
  Settings, 
  Eye, 
  ChevronLeft,
  BookMarked,
  Menu as MenuIcon,
  Sparkles,
  Library,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Wand2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { generateImage, generateImagePrompt } from '@/services/ai';

const STORAGE_KEY = 'atebookmaker_library';

export default function Home() {
  // Persistence States
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [currentEbookId, setCurrentEbookId] = useState<string | null>(null);
  
  // UI States
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userRules, setUserRules] = useState('');
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setEbooks(parsed);
      } catch (e) {
        console.error("Failed to parse saved ebooks", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ebooks));
    }
  }, [ebooks, isLoaded]);

  // Handle Window Resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
      setIsMobile(mobile);
      if (mobile) {
        setLeftSidebarCollapsed(true);
        setRightSidebarCollapsed(true);
      } else {
        setLeftSidebarCollapsed(false);
        setRightSidebarCollapsed(false);
      }
    };
    
    checkMobile();
    if (typeof window !== 'undefined') {
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  // Sync current ebook state
  const ebook = ebooks.find(e => e.id === currentEbookId) || null;

  const updateEbook = useCallback((updated: Ebook) => {
    setEbooks(prev => prev.map(e => e.id === updated.id ? updated : e));
  }, []);

  const handleCreateEbook = () => {
    const newEbook: Ebook = {
      id: uuidv4(),
      title: 'Novo Ebook',
      author: '',
      description: '',
      chapters: [
        { id: uuidv4(), title: 'Capítulo 1', content: '<p>Comece a escrever seu capítulo aqui...</p>', order: 1 }
      ],
      theme: 'classic',
      createdAt: Date.now(),
    };
    setEbooks(prev => [...prev, newEbook]);
    setCurrentEbookId(newEbook.id);
    setActiveChapterId(newEbook.chapters[0].id);
    setShowSettings(true); // Open settings for new ebook
  };

  const handleSelectEbook = (id: string) => {
    setCurrentEbookId(id);
    const selected = ebooks.find(e => e.id === id);
    if (selected && selected.chapters.length > 0) {
      setActiveChapterId(selected.chapters[0].id);
    }
  };

  const handleDeleteEbook = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este ebook permanentemente?')) {
      setEbooks(prev => prev.filter(e => e.id !== id));
      if (currentEbookId === id) {
        setCurrentEbookId(null);
      }
    }
  };

  const editorRef = useRef<{ insertImage: (url: string) => void }>(null);
  const activeChapter = ebook?.chapters.find(c => c.id === activeChapterId) || null;

  const handleUpdateChapterContent = (content: string) => {
    if (!ebook || !activeChapterId) return;
    const updated = {
      ...ebook,
      chapters: ebook.chapters.map(c => 
        c.id === activeChapterId ? { ...c, content } : c
      )
    };
    updateEbook(updated);
  };

  const handleUpdateIntroduction = (content: string) => {
    if (!ebook) return;
    updateEbook({ ...ebook, introduction: content });
  };


  const handleUpdateChapterTitle = (title: string) => {
    if (!ebook || !activeChapterId) return;
    const updated = {
      ...ebook,
      chapters: ebook.chapters.map(c => 
        c.id === activeChapterId ? { ...c, title } : c
      )
    };
    updateEbook(updated);
  };

  const handleSelectChapter = (id: string) => {
    setActiveChapterId(id);
    if (isMobile) {
      setLeftSidebarCollapsed(true);
    }
  };

  const handleAddChapter = () => {
    if (!ebook) return;
    const newId = uuidv4();
    const newChapter: Chapter = {
      id: newId,
      title: `Capítulo ${ebook.chapters.length + 1}`,
      content: '<p>Novo capítulo...</p>',
      order: ebook.chapters.length + 1,
    };
    const updated = {
      ...ebook,
      chapters: [...ebook.chapters, newChapter]
    };
    updateEbook(updated);
    setActiveChapterId(newId);
    if (isMobile) {
      setLeftSidebarCollapsed(true);
    }
  };

  const handleDeleteChapter = (id: string) => {
    if (!ebook || ebook.chapters.length <= 1) return;
    const updatedChapters = ebook.chapters.filter(c => c.id !== id);
    const updated = {
      ...ebook,
      chapters: updatedChapters
    };
    updateEbook(updated);
    if (activeChapterId === id) {
      setActiveChapterId(updatedChapters[0].id);
    }
  };

  const handleInsertImage = (url: string) => {
    if (editorRef.current) {
      editorRef.current.insertImage(url);
    }
    if (isMobile) {
      setRightSidebarCollapsed(true);
    }
  };

  const handleGenerateCover = async () => {
    if (!ebook?.title) {
        alert("Por favor, defina um título para o ebook primeiro.");
        return;
    }
    setIsGeneratingCover(true);
    try {
        const prompt = await generateImagePrompt(`Capa de livro profissional para: ${ebook.title}. Estilo cinematográfico, limpo, alta resolução.`);
        if (prompt) {
            const imageUrl = await generateImage(prompt);
            if (imageUrl) {
                updateEbook({...ebook, coverImage: imageUrl});
            }
        }
    } catch (error) {
        console.error("Erro ao gerar capa:", error);
    } finally {
        setIsGeneratingCover(false);
    }
  };

  const toggleLeftSidebar = () => {
    setLeftSidebarCollapsed(!leftSidebarCollapsed);
    if (isMobile && leftSidebarCollapsed) {
      setRightSidebarCollapsed(true);
    }
  };

  const toggleRightSidebar = () => {
    setRightSidebarCollapsed(!rightSidebarCollapsed);
    if (isMobile && rightSidebarCollapsed) {
      setLeftSidebarCollapsed(true);
    }
  };

  if (!isLoaded) {
    return <div className="h-screen w-full flex items-center justify-center bg-white text-indigo-600 font-bold">Carregando...</div>;
  }

  if (!currentEbookId) {
    return (
      <Dashboard 
        ebooks={ebooks} 
        onCreateEbook={handleCreateEbook} 
        onSelectEbook={handleSelectEbook} 
        onDeleteEbook={handleDeleteEbook} 
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white text-slate-900 overflow-hidden">
      {/* Header */}
        <header className="h-16 border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 bg-white z-40 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
               variant="ghost" 
               size="icon" 
               onClick={() => setCurrentEbookId(null)}
               className="mr-2 text-slate-400 hover:text-indigo-600"
               title="Voltar para Biblioteca"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            {isMobile && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleLeftSidebar}
                className="lg:hidden"
              >
                <MenuIcon className="h-5 w-5" />
              </Button>
            )}
            <div className="bg-indigo-600 p-1.5 sm:p-2 rounded-lg">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="hidden xs:block">
              <h1 className="font-bold text-sm sm:text-lg leading-none truncate max-w-[150px] sm:max-w-[300px]">
                {ebook?.title || 'Ebook Maker'}
              </h1>
              <p className="hidden sm:block text-[10px] sm:text-xs text-slate-500 mt-1">Editor de Obra Profissional</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1 sm:gap-2 px-2 sm:px-3 text-slate-500 hover:text-indigo-600 hidden md:flex"
              onClick={() => setCurrentEbookId(null)}
            >
              <Library className="h-4 w-4" />
              <span>Sair</span>
            </Button>
            {isMobile && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleRightSidebar}
                className="lg:hidden text-indigo-600"
              >
                <Sparkles className="h-5 w-5" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1 sm:gap-2 px-2 sm:px-3"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configurações</span>
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="bg-indigo-600 hover:bg-indigo-700 gap-1 sm:gap-2 px-2 sm:px-3"
              onClick={() => setIsPreviewOpen(true)}
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Pré-visualização</span>
              <span className="sm:hidden">Ver</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden relative">
          {/* Left Sidebar: Chapters */}
          <ChapterSidebar 
            chapters={ebook?.chapters || []}
            activeChapterId={activeChapterId}
            onSelectChapter={handleSelectChapter}
            onAddChapter={handleAddChapter}
            onDeleteChapter={handleDeleteChapter}
            isCollapsed={leftSidebarCollapsed}
            onToggleCollapse={toggleLeftSidebar}
          />

          {/* Center: Editor */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
            {showSettings && ebook ? (
              <div className="p-8 max-w-2xl mx-auto w-full space-y-6 overflow-y-auto">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Configurações do Ebook</h2>
                  <p className="text-slate-500">Defina os metadados e regras de estilo.</p>
                </div>
                
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Título do Livro</label>
                    <Input 
                      placeholder="Ex: O Guia da Inteligência Artificial" 
                      value={ebook.title}
                      onChange={(e) => updateEbook({...ebook, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Autor</label>
                    <Input 
                      placeholder="Seu nome" 
                      value={ebook.author}
                      onChange={(e) => updateEbook({...ebook, author: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <label className="text-sm font-bold flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-indigo-500" />
                        Capa do Ebook (Opcional)
                    </label>
                    
                    {ebook.coverImage ? (
                        <div className="relative group max-w-sm mx-auto">
                            <img src={ebook.coverImage} className="w-full aspect-[2/3] object-cover rounded-xl shadow-2xl border-4 border-white" alt="Capa" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 rounded-xl backdrop-blur-sm">
                                <Button variant="secondary" size="sm" onClick={handleGenerateCover} disabled={isGeneratingCover}>
                                    {isGeneratingCover ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2 text-indigo-500" />}
                                    Regerar com IA
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => updateEbook({...ebook, coverImage: undefined})}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remover Capa
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button 
                            variant="outline" 
                            className="w-full h-40 border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 flex flex-col gap-3 rounded-xl transition-all"
                            onClick={handleGenerateCover}
                            disabled={isGeneratingCover}
                        >
                            {isGeneratingCover ? (
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                            ) : (
                                <ImageIcon className="h-8 w-8 text-slate-300" />
                            )}
                            <div className="text-center">
                                <p className="text-sm font-bold text-slate-600">Gerar Capa com IA</p>
                                <p className="text-xs text-slate-400 mt-1">Cria uma arte baseada no seu título</p>
                            </div>
                        </Button>
                    )}

                    <div className="space-y-4 pt-4">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Posição do Texto na Capa</label>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            {(['top', 'middle', 'bottom'] as const).map((l) => (
                                <Button
                                    key={l}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateEbook({...ebook, coverLayout: l})}
                                    className={cn(
                                        "flex-1 text-[10px] font-bold uppercase transition-all rounded-lg",
                                        (ebook.coverLayout || 'top') === l ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"
                                    )}
                                >
                                    {l === 'top' ? 'Acima' : l === 'middle' ? 'Centralizado' : 'Abaixo'}
                                </Button>
                            ))}
                        </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <label className="text-sm font-medium">Tema do Ebook</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(['classic', 'modern', 'minimal', 'elegant', 'technical'] as EbookTheme[]).map((t) => (
                        <Button
                          key={t}
                          variant={ebook.theme === t ? 'default' : 'outline'}
                          className="capitalize h-20 flex flex-col gap-1"
                          onClick={() => updateEbook({...ebook, theme: t})}
                        >
                          <span className="text-sm">{t}</span>
                          <div className={cn(
                            "w-full h-2 rounded-full",
                            t === 'classic' && "bg-slate-800",
                            t === 'modern' && "bg-indigo-600",
                            t === 'minimal' && "bg-slate-200",
                            t === 'elegant' && "bg-amber-800",
                            t === 'technical' && "bg-emerald-600"
                          )} />
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Regras de Escrita (Opcional)</label>
                    <Textarea 
                      placeholder="Ex: Use um tom formal, evite gírias, foque em exemplos práticos..." 
                      className="min-h-[100px]"
                      value={userRules}
                      onChange={(e) => setUserRules(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={() => setShowSettings(false)} className="w-full">Salvar e Voltar ao Editor</Button>
              </div>
            ) : (activeChapter || activeChapterId === 'introduction') ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-3 sm:p-4 bg-white border-b border-slate-200 flex items-center gap-4">
                  <div className="flex-1 flex flex-col">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5 sm:mb-1">
                        {activeChapterId === 'introduction' ? 'Seção de Abertura' : 'Título do Capítulo'}
                    </label>
                    <Input 
                      className="text-lg sm:text-xl font-bold border-none focus-visible:ring-0 p-0 h-auto bg-transparent hover:bg-slate-50 transition-colors cursor-text"
                      value={activeChapterId === 'introduction' ? 'Introdução' : (activeChapter?.title || '')}
                      onChange={(e) => activeChapterId !== 'introduction' && handleUpdateChapterTitle(e.target.value)}
                      readOnly={activeChapterId === 'introduction'}
                      placeholder={activeChapterId === 'introduction' ? 'Introdução' : "Dê um nome ao seu capítulo..."}
                    />
                  </div>
              <div className="flex items-center text-[10px] sm:text-xs text-slate-400 gap-1 self-end mb-1">
                <BookMarked className="h-3 w-3" />
                {activeChapterId === 'introduction' ? (
                  <span className="font-bold text-indigo-500 italic">Seção Pré-Textual</span>
                ) : (
                  <>
                    <span className="hidden xs:inline">Ordem:</span> {activeChapter?.order}
                  </>
                )}
              </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                  <div className="max-w-5xl mx-auto bg-white shadow-sm rounded-lg border border-slate-200">
                    <Editor 
                      ref={editorRef}
                      content={activeChapterId === 'introduction' ? (ebook?.introduction || '') : (activeChapter?.content || '')} 
                      onChange={activeChapterId === 'introduction' ? handleUpdateIntroduction : handleUpdateChapterContent} 
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                Selecione um capítulo para começar a editar.
              </div>
            )}
          </div>

          {/* Right Sidebar: AI Assistant */}
          <AIAssistant 
            content={activeChapter?.content || ''} 
            rules={userRules}
            onInsertImage={handleInsertImage}
            isCollapsed={rightSidebarCollapsed}
            onToggleCollapse={toggleRightSidebar}
          />
        </main>

        {/* Preview Modal */}
        {ebook && (
          <EbookPreview 
            ebook={ebook} 
            isOpen={isPreviewOpen} 
            onClose={() => setIsPreviewOpen(false)} 
          />
        )}
      </div>
  );
}
