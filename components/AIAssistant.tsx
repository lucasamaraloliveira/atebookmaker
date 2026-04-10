'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Wand2, 
  Loader2, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Scan,
  AlertCircle,
  FileSearch,
  CheckCircle2
} from 'lucide-react';
import { getTextSuggestions, generateImagePrompt, generateImage } from '@/services/ai';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Section {
  id: string;
  title: string;
  content: string;
  hasImage: boolean;
  generatedImage?: string | null;
  isGenerating?: boolean;
}

interface AIAssistantProps {
  content: string;
  rules: string;
  onInsertImage: (url: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function AIAssistant({ content, rules, onInsertImage, isCollapsed, onToggleCollapse }: AIAssistantProps) {
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [copied, setCopied] = useState(false);

  // Helper to parse HTML into sections by headings
  const scanContent = useMemo(() => {
    if (typeof window === 'undefined') return [];
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const result: Section[] = [];
    
    // Check for intro text before first heading
    let introContent = "";
    let firstElem = doc.body.firstElementChild;
    let curr = firstElem;
    while (curr && !['H1', 'H2', 'H3'].includes(curr.tagName)) {
        introContent += curr.outerHTML;
        curr = curr.nextElementSibling;
    }
    
    if (introContent.trim() && introContent.length > 20) {
        result.push({
            id: 'intro',
            title: 'Introdução',
            content: introContent,
            hasImage: introContent.includes('<img')
        });
    }

    const headings = doc.querySelectorAll('h1, h2, h3');
    headings.forEach((heading, idx) => {
      let sectionContent = "";
      let next = heading.nextElementSibling;
      let hasImage = false;
      
      while (next && !['H1', 'H2', 'H3'].includes(next.tagName)) {
        if (next.tagName === 'IMG' || next.querySelector('img')) hasImage = true;
        sectionContent += next.outerHTML;
        next = next.nextElementSibling;
      }
      
      if (sectionContent.trim().length > 10) {
        result.push({
          id: `section-${idx}`,
          title: heading.textContent || `Seção ${idx + 1}`,
          content: sectionContent,
          hasImage: hasImage
        });
      }
    });

    return result;
  }, [content]);

  const [isScanning, setIsScanning] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Update sections state when content is scanned
  const handleScan = () => {
    setIsScanning(true);
    setErrorStatus(null);
    
    // Simulate deep scanning visual feedback
    setTimeout(() => {
        setSections(scanContent.map(s => ({
            ...s,
        })));
        setIsScanning(false);
        if (scanContent.length === 0) {
            setErrorStatus("Nenhum subtítulo (H1-H3) encontrado para escanear neste capítulo.");
        }
    }, 800);
  };

  const handleGetSuggestions = async () => {
    setIsGeneratingText(true);
    const result = await getTextSuggestions(content, rules);
    setSuggestions(result);
    setIsGeneratingText(false);
  };

  const handleGenerateSectionImage = async (sectionId: string) => {
    const sectionIndex = sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return;

    const newSections = [...sections];
    newSections[sectionIndex].isGenerating = true;
    setSections(newSections);

    try {
      const section = sections[sectionIndex];
      const prompt = await generateImagePrompt(section.content);
      if (prompt) {
        const imageUrl = await generateImage(prompt);
        if (!imageUrl) throw new Error("Falha ao gerar imagem");
        
        const updatedSections = [...sections];
        updatedSections[sectionIndex].generatedImage = imageUrl;
        updatedSections[sectionIndex].isGenerating = false;
        setSections(updatedSections);
      }
    } catch (error) {
      console.error("Erro ao gerar imagem para seção:", error);
      const updatedSections = [...sections];
      updatedSections[sectionIndex].isGenerating = false;
      // Mark as error
      setSections(updatedSections);
      setErrorStatus("Ocorreu um erro ao gerar a imagem. Verifique sua conexão ou limite de API.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={false}
      animate={{ 
        width: isCollapsed ? 48 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? (window.innerWidth < 640 ? window.innerWidth : 400) : 380),
      }}
      className={cn(
        "border-l border-slate-200 h-full flex flex-col bg-slate-50 relative overflow-hidden z-30 shadow-inner",
        !isCollapsed && "absolute inset-y-0 right-0 shadow-2xl sm:relative sm:shadow-none"
      )}
    >
      <div className={cn(
        "p-4 border-b border-slate-200 flex items-center shrink-0",
        isCollapsed ? "justify-center" : "justify-between bg-white"
      )}>
        {!isCollapsed && (
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            Assistente IA
          </h2>
        )}
        <Button size="icon" variant="ghost" onClick={onToggleCollapse} className="h-8 w-8 hover:bg-slate-100">
          {isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      {!isCollapsed && (
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-8 pb-32">
            {/* Context Scanning Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Varredura de Contexto</h3>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                        "h-7 text-[10px] gap-1 font-bold transition-all",
                        isScanning ? "text-slate-400" : "text-indigo-600 hover:text-indigo-700 font-black"
                    )} 
                    onClick={handleScan}
                    disabled={isScanning}
                >
                   {isScanning ? (
                        <><Loader2 className="h-3 w-3 animate-spin" /> Escaneando...</>
                   ) : (
                        <><Scan className="h-3 w-3" /> Escanear Capítulos e Subtítulos</>
                   )}
                </Button>
              </div>

              {errorStatus && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-[10px] text-red-600 animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    <span className="flex-1">{errorStatus}</span>
                    <button onClick={() => setErrorStatus(null)} className="opacity-50 hover:opacity-100 font-bold px-1">×</button>
                </div>
              )}

              {sections.length === 0 && !isScanning ? (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center space-y-3 bg-white/50">
                    <FileSearch className="h-8 w-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500">Escaneie o capítulo para identificar subtítulos e gerar ilustrações contextuais.</p>
                </div>
              ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {sections.map((section) => (
                            <motion.div 
                                key={section.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-indigo-200 transition-colors"
                            >
                                <div className="p-3 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                                    <div className="flex items-center gap-2 max-w-[70%]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                        <span className="text-xs font-bold text-slate-700 truncate">{section.title}</span>
                                    </div>
                                    {section.hasImage ? (
                                        <Badge variant="outline" className="text-[9px] bg-green-50 text-green-600 border-green-200 gap-1">
                                            <CheckCircle2 className="h-2.5 w-2.5" /> Presente
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-600 border-amber-200 gap-1">
                                            <AlertCircle className="h-2.5 w-2.5" /> S/ Imagem
                                        </Badge>
                                    )}
                                </div>
                                
                                <CardContent className="p-3 space-y-3">
                                    {section.generatedImage ? (
                                        <div className="space-y-2">
                                            <img src={section.generatedImage} alt="IA" className="w-full aspect-video object-cover rounded-lg border border-slate-200" />
                                            <Button 
                                                className="w-full text-[10px] h-8 font-black uppercase tracking-wider" 
                                                variant="default"
                                                onClick={() => onInsertImage(section.generatedImage!)}
                                            >
                                                Inserir na Posição do Cursor
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="w-full h-8 text-[10px] font-bold"
                                            onClick={() => handleGenerateSectionImage(section.id)}
                                            disabled={section.isGenerating}
                                        >
                                            {section.isGenerating ? (
                                                <><Loader2 className="h-3 w-3 animate-spin mr-2" /> Gerando...</>
                                            ) : (
                                                <><ImageIcon className="h-3 w-3 mr-2 text-indigo-500" /> Gerar Ilustração para este bloco</>
                                            )}
                                        </Button>
                                    )}
                                </CardContent>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
              )}
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Otimização de Texto</h3>
              <Button 
                className="w-full justify-start gap-2 h-10 border-indigo-100 hover:bg-slate-100" 
                variant="outline" 
                onClick={handleGetSuggestions}
                disabled={isGeneratingText || !content}
              >
                {isGeneratingText ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4 text-indigo-500" />}
                <span className="font-bold text-xs text-slate-700">Reescrever Capítulo</span>
              </Button>
              {suggestions && (
                <Card className="bg-white border-indigo-100 shadow-lg">
                  <CardContent className="p-4 text-sm text-slate-600 relative">
                    <div className="whitespace-pre-wrap leading-relaxed">{suggestions}</div>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-sm"
                      onClick={() => copyToClipboard(suggestions)}
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </section>

            {rules && (
              <section className="space-y-2 pt-4 border-t border-slate-200">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Regras Ativas</h3>
                <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-500 italic leading-relaxed border border-slate-200 shadow-inner">
                  "{rules}"
                </div>
              </section>
            )}
          </div>
        </ScrollArea>
      )}

      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center py-6 gap-6 bg-white shrink-0 shadow-inner">
          <Button size="icon" variant="ghost" onClick={onToggleCollapse} title="Escanear Contexto" className="rounded-full bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600">
            <Scan className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onToggleCollapse} title="AI Writer" className="rounded-full bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600">
            <Wand2 className="h-5 w-5" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
