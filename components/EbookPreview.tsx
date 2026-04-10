'use client';

import { Ebook, EbookTheme } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileType, CheckCircle2, Layout, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface EbookPreviewProps {
  ebook: Ebook;
  isOpen: boolean;
  onClose: () => void;
}

const THEME_STYLES: Record<EbookTheme, { container: string; title: string; chapterTitle: string; prose: string }> = {
  classic: {
    container: "font-serif bg-white text-slate-900",
    title: "text-4xl font-bold border-b-4 border-slate-900 pb-6",
    chapterTitle: "text-3xl font-bold border-b-2 border-slate-900 pb-4 mb-8",
    prose: "prose-slate lg:prose-lg prose-li:marker:text-slate-900 prose-ul:list-disc prose-ol:list-decimal"
  },
  modern: {
    container: "font-sans bg-white text-slate-900",
    title: "text-5xl font-black tracking-tighter text-indigo-600 uppercase",
    chapterTitle: "text-4xl font-extrabold text-slate-800 mb-10 tracking-tight",
    prose: "prose-indigo lg:prose-lg prose-li:marker:text-indigo-600 prose-ul:list-square prose-ol:list-decimal"
  },
  minimal: {
    container: "font-sans bg-slate-50 text-slate-800",
    title: "text-3xl font-light tracking-widest text-slate-500 uppercase",
    chapterTitle: "text-xl font-medium text-slate-400 uppercase tracking-[0.2em] mb-12",
    prose: "prose-slate prose-sm sm:prose-base prose-li:marker:text-slate-400 prose-ul:list-dash prose-ol:list-decimal"
  },
  elegant: {
    container: "font-serif bg-[#fdfbf7] text-[#2c1810]",
    title: "text-5xl italic font-medium border-double border-b-4 border-amber-200 pb-8",
    chapterTitle: "text-3xl italic font-semibold text-amber-900 mb-8 border-l-4 border-amber-200 pl-6",
    prose: "prose-stone lg:prose-lg italic-headings prose-li:marker:text-amber-700 prose-ul:list-disc prose-ol:list-decimal"
  },
  technical: {
    container: "font-mono bg-slate-900 text-emerald-400",
    title: "text-3xl font-bold border-2 border-emerald-500 p-6 inline-block",
    chapterTitle: "text-2xl font-bold text-emerald-300 mb-6 flex items-center gap-2 before:content-['>']",
    prose: "prose-invert prose-emerald lg:prose-lg prose-li:marker:text-emerald-500 prose-ul:list-none prose-ul:before:content-['*'] prose-ul:before:mr-2 prose-ol:list-decimal"
  }
};

// A4 proportions (roughly 1:1.41)
const PAGE_HEIGHT = 1123; // Height for a "virtual page" in px at standard density
const PAGE_WIDTH = 794;   // Width for a "virtual page" in px

export default function EbookPreview({ ebook, isOpen, onClose }: EbookPreviewProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(true);
  const [pageCount, setPageCount] = useState(1);
  const previewRef = useRef<HTMLDivElement>(null);
  const theme = ebook.theme || 'classic';
  const styles = THEME_STYLES[theme];

  useEffect(() => {
    if (isOpen) {
      const viewport = document.getElementById('preview-scroll-viewport');
      if (viewport) viewport.scrollTop = 0;
      setIsReviewing(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (previewRef.current && isOpen) {
       // Wait for images and layout to settle
       const updatePages = () => {
         if (previewRef.current) {
            const height = previewRef.current.scrollHeight;
            setPageCount(Math.max(1, Math.ceil(height / PAGE_HEIGHT)));
         }
       };
       
       const timeoutId = setTimeout(updatePages, 500);
       return () => clearTimeout(timeoutId);
    }
  }, [isOpen, ebook, isReviewing]);

  const exportToPDF = async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    
    try {
      // DEFINITIVE FIX: Create a sandbox iframe to isolate the content from the main app's modern CSS
      const iframe = document.createElement('iframe');
      iframe.style.visibility = 'hidden';
      iframe.style.position = 'fixed';
      iframe.style.left = '-10000px';
      iframe.style.width = `${PAGE_WIDTH}px`;
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error("Could not create sandbox");
      
      // Copy the HTML content and wrap it in a properly styled A4-width container
      const content = previewRef.current.innerHTML;
      iframeDoc.body.innerHTML = `
        <div class="${styles.container} ebook-content-render" style="width: 210mm; min-height: 297mm; padding: 20mm; margin: 0 auto; background: ${theme === 'technical' ? '#0f172a' : (theme === 'elegant' ? '#fdfbf7' : '#ffffff')}">
          ${content}
        </div>
      `;

      // Add COMPATIBLE CSS that mirrors the main styles but avoids modern CSS functions
      const style = iframeDoc.createElement('style');
      style.innerHTML = `
        @page { size: A4; margin: 0; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
        body { 
          margin: 0; 
          padding: 0; 
          width: 210mm;
          background: ${theme === 'technical' ? '#0f172a' : (theme === 'elegant' ? '#fdfbf7' : '#ffffff')};
          color: ${theme === 'technical' ? '#10b981' : (theme === 'elegant' ? '#2c1810' : '#1e293b')};
          font-family: ${theme === 'technical' ? 'monospace' : (theme.includes('classic') || theme.includes('elegant') ? 'serif' : 'sans-serif')};
        }
        
        .ebook-content-render { width: 100%; }
        .ebook-content-render h1 { font-size: 2.5rem; font-weight: 800; margin-top: 2rem; margin-bottom: 1.5rem; line-height: 1.2; text-align: center; }
        .ebook-content-render h2 { font-size: 2rem; font-weight: 700; margin-top: 1.8rem; margin-bottom: 1rem; line-height: 1.3; border-bottom: ${theme === 'classic' || theme === 'elegant' ? '2px solid #e2e8f0' : 'none'}; padding-bottom: 0.3rem; }
        .ebook-content-render h3 { font-size: 1.5rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.8rem; line-height: 1.4; }
        .ebook-content-render h4 { font-size: 1.2rem; font-weight: 600; margin-top: 1.2rem; margin-bottom: 0.5rem; line-height: 1.5; text-transform: uppercase; letter-spacing: 0.05em; }
        .ebook-content-render p { margin-bottom: 1.2rem; line-height: 1.7; font-size: 11pt; }
        .ebook-content-render ul { padding-left: 1.5rem; margin-bottom: 1.5rem; list-style-type: disc; }
        .ebook-content-render ol { padding-left: 1.5rem; margin-bottom: 1.5rem; list-style-type: decimal; }
        .ebook-content-render li { margin-bottom: 0.5rem; line-height: 1.6; }
        .ebook-content-render img { max-width: 100%; height: auto; display: block; margin: 2rem auto; border-radius: 8px; }
        
        /* Page Segment Isolation */
        .chapter-preview { margin-bottom: 4rem; page-break-after: always; position: relative; }
        .chapter-preview h2 { color: ${theme === 'modern' ? '#4f46e5' : 'inherit'}; }
        
        /* Theme Specific Adjustments */
        ${theme === 'elegant' ? 'h1, h2, h3 { font-style: italic; color: #78350f; } .ebook-content-render p { line-height: 1.8; }' : ''}
        ${theme === 'modern' ? 'h1 { color: #4f46e5; text-transform: uppercase; letter-spacing: -0.02em; } .ebook-content-render { letter-spacing: -0.01em; }' : ''}
        ${theme === 'technical' ? 'h2:before { content: "> "; } .ebook-content-render { font-family: "Courier New", monospace; }' : ''}
      `;
      iframeDoc.head.appendChild(style);

      // Wait for content and layout
      await new Promise(resolve => setTimeout(resolve, 800));

      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: theme === 'technical' ? '#0f172a' : (theme === 'elegant' ? '#fdfbf7' : '#ffffff')
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Cleanup sandbox
      document.body.removeChild(iframe);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const totalImgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = totalImgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalImgHeight);
      heightLeft -= pdfHeight;

      // Subsequent pages
      while (heightLeft >= 0) {
        position = heightLeft - totalImgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalImgHeight);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`${ebook.title || 'ebook'}.pdf`);
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] sm:max-w-7xl h-[95vh] sm:h-[92vh] flex flex-col p-0 overflow-hidden bg-white border-slate-200">
        <DialogHeader className="p-4 sm:p-6 border-b border-slate-200 bg-white text-slate-900 shrink-0">
          <div className="flex items-center justify-between w-full pr-8">
            <DialogTitle className="flex items-center gap-3 text-lg sm:text-2xl font-black text-slate-800">
              {isReviewing ? (
                <>
                  <Layout className="h-6 w-6 text-indigo-400" />
                  Visualização de Impressão
                </>
              ) : (
                <>
                  <FileType className="h-6 w-6 text-indigo-400" />
                  Exportação Final
                </>
              )}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div id="preview-scroll-viewport" className="flex-1 bg-slate-200/50 overflow-y-auto scroll-smooth custom-scrollbar relative">
          <div className="p-4 sm:p-12 flex flex-col items-center min-h-full">
            {isReviewing && (
              <div className="w-full max-w-4xl mb-12 p-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl flex items-start gap-4 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 border border-white/20">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
                   <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-black text-xl mb-1 uppercase tracking-tight">Pronto para Publicar?</p>
                  <p className="text-indigo-100 text-sm leading-relaxed opacity-90">
                    Seu ebook no tema <strong className="text-white">{theme.toUpperCase()}</strong> está formatado para exportação profissional.
                    Verifique os títulos, o espaçamento e as imagens antes de gerar o arquivo final.
                  </p>
                </div>
              </div>
            )}

            {/* Canvas Layout - Divided Pages */}
            <div 
              ref={previewRef}
              className={cn(
                "relative transition-all duration-700 flex flex-col gap-[10px] bg-slate-400 p-[10px]",
                isReviewing ? "opacity-90 scale-[0.98]" : "opacity-100 scale-100"
              )}
              style={{
                width: '210mm',
                minHeight: '297mm',
              }}
            >
              <div className={cn(
                "w-full p-[20mm] sm:p-[25mm] whitespace-pre-wrap overflow-hidden flex flex-col min-h-[297mm] shadow-2xl",
                styles.container
              )}>
                {/* Cover Page */}
                <div className="flex flex-col items-center justify-center text-center min-h-[247mm] relative mb-12 border-b border-dashed border-slate-200 px-8 pb-32">
                  <div className="absolute top-10 left-10 text-[9px] uppercase tracking-[0.2em] opacity-30 font-sans">Página de Capa</div>
                  
                  <div className="flex flex-col items-center justify-center flex-1 w-full gap-16">
                    {ebook.coverImage && (
                        <div className="w-full max-w-md animate-in fade-in zoom-in duration-700 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-lg overflow-hidden shrink-0">
                            <img src={ebook.coverImage} className="w-full aspect-[3/4] object-cover" alt="Capa do Ebook" />
                        </div>
                    )}

                    <div className="space-y-12 w-full max-w-2xl px-4">
                        {(() => {
                            const layout = ebook.coverLayout || 'top';
                            return (
                                <div className={cn(
                                    "flex flex-col gap-8",
                                    layout === 'bottom' ? "flex-col-reverse" : "flex-col"
                                )}>
                                    {/* Optional Subtitle/Label (for Top/Bottom layouts) */}
                                    {(layout === 'top' || layout === 'bottom') && (
                                        <p className={cn(
                                            "text-xs uppercase tracking-[0.3em] opacity-40 font-sans",
                                            layout === 'bottom' && "mt-12"
                                        )}>
                                            Série Digital Especial
                                        </p>
                                    )}

                                    <div className="space-y-6">
                                        <h1 className={cn("leading-tight break-words drop-shadow-md", styles.title)}>
                                            {ebook.title || "Título da Obra"}
                                        </h1>
                                        
                                        {/* Middle Label */}
                                        {layout === 'middle' && (
                                            <p className="text-sm uppercase tracking-[0.4em] opacity-50 font-sans font-bold">
                                                Série Digital Especial
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="w-48 h-2 bg-current mx-auto opacity-20 rounded-full" />
                        
                        <p className="text-4xl font-light opacity-90 italic font-serif">
                          {ebook.author || "Seu Nome"}
                        </p>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-10 text-sm uppercase tracking-[0.3em] opacity-40 font-sans">
                    Publicado em {new Date().getFullYear()}
                  </div>
                </div>

                {/* Introduction */}
                {ebook.introduction && (
                    <div className="chapter-preview mb-24 border-b border-dashed border-slate-200 pb-24">
                        <h2 className={cn("leading-tight mb-12", styles.chapterTitle)}>Introdução</h2>
                        <div 
                            className={cn("prose max-w-none prose-img:shadow-xl prose-img:rounded-xl ebook-content-render", styles.prose)}
                            dangerouslySetInnerHTML={{ __html: ebook.introduction }} 
                        />
                    </div>
                )}

                {/* Content */}
                <div className="space-y-24">
                  {ebook.chapters.sort((a, b) => a.order - b.order).map((chapter) => (
                    <div key={chapter.id} className="chapter-preview">
                      <h2 className={cn("leading-tight mb-12", styles.chapterTitle)}>{chapter.title}</h2>
                      <div 
                        className={cn("prose max-w-none prose-img:shadow-xl prose-img:rounded-xl ebook-content-render", styles.prose)}
                        dangerouslySetInnerHTML={{ __html: chapter.content }} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-12 text-slate-500 text-xs uppercase tracking-widest flex items-center gap-4">
                <div className="h-px w-20 bg-slate-800" />
                Fim do Ebook
                <div className="h-px w-20 bg-slate-800" />
            </div>
          </div>

          {/* Floating Minimalist Page Counter */}
          <div className="absolute bottom-6 right-6 z-50 pointer-events-none">
              <div className="bg-white/70 backdrop-blur-md border border-slate-200/50 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 animate-in fade-in zoom-in slide-in-from-right-4 duration-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                    {pageCount} {pageCount === 1 ? 'Página' : 'Páginas'} estimadas
                  </span>
              </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t border-slate-200 bg-white flex flex-col sm:flex-row gap-4 sm:justify-between items-center shrink-0">
          {isReviewing ? (
            <>
              <div className="flex flex-col gap-1 items-center sm:items-start">
                  <p className="text-sm font-bold text-slate-800 uppercase tracking-wider">Visualização de Segurança</p>
                  <p className="text-xs text-slate-500">Confirme se o conteúdo está correto antes de exportar.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto text-slate-500 hover:text-slate-900">Voltar ao Editor</Button>
                <Button onClick={() => setIsReviewing(false)} className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto font-black shadow-lg shadow-indigo-500/20">
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  AVANÇAR PARA EXPORTAR
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button 
                  onClick={exportToPDF} 
                  disabled={isExporting}
                  className="gap-2 w-full sm:w-auto bg-red-600 hover:bg-red-700 font-bold min-w-[200px]"
                >
                  {isExporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileType className="h-5 w-5" />}
                  {isExporting ? 'GERANDO PDF...' : 'BAIXAR PDF COMPLETO'}
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2 w-full sm:w-auto border-slate-200 text-slate-600 hover:bg-slate-50"
                  onClick={() => window.open('about:blank', '_blank')?.document.write('Funcionalidade em desenvolvimento')}
                >
                  <Download className="h-5 w-5" />
                  BAIXAR EPUB
                </Button>
              </div>
              <Button variant="ghost" onClick={() => setIsReviewing(true)} className="w-full sm:w-auto text-slate-500 hover:text-slate-900">Voltar Revisão</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


