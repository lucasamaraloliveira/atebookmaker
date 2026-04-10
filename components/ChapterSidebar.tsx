import { Chapter } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, FileText, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ChapterSidebarProps {
  chapters: Chapter[];
  activeChapterId: string | null;
  onSelectChapter: (id: string) => void;
  onAddChapter: () => void;
  onDeleteChapter: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function ChapterSidebar({
  chapters,
  activeChapterId,
  onSelectChapter,
  onAddChapter,
  onDeleteChapter,
  isCollapsed,
  onToggleCollapse,
}: ChapterSidebarProps) {
  return (
    <motion.div 
      initial={false}
      animate={{ 
        width: isCollapsed ? 64 : (typeof window !== 'undefined' && window.innerWidth < 640 ? window.innerWidth : 256),
        x: 0
      }}
      className={cn(
        "border-r border-slate-200 h-full flex flex-col bg-slate-50 relative z-30",
        !isCollapsed && "absolute inset-y-0 left-0 shadow-2xl sm:relative sm:shadow-none"
      )}
    >
      <div className={cn(
        "p-4 border-b border-slate-200 flex items-center",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && <h2 className="font-semibold text-slate-700">Capítulos</h2>}
        <Button size="icon" variant="ghost" onClick={onToggleCollapse} className="h-8 w-8">
          {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {!isCollapsed && (
          <div className="p-2">
            <Button variant="outline" className="w-full justify-start gap-2 text-xs h-8" onClick={onAddChapter}>
              <Plus className="h-3 w-3" />
              Novo Capítulo
            </Button>
          </div>
        )}
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {/* Introduction Section */}
            <div
                className={cn(
                  "group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all",
                  activeChapterId === 'introduction'
                    ? "bg-indigo-100 text-indigo-700 font-bold" 
                    : "hover:bg-slate-200 text-slate-600",
                  isCollapsed && "justify-center"
                )}
                onClick={() => onSelectChapter('introduction')}
              >
                <div className="relative">
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full border border-white" />
                </div>
                {!isCollapsed && (
                  <span className="flex-1 truncate text-sm font-medium">
                    Introdução
                  </span>
                )}
            </div>

            <div className="h-px bg-slate-200 my-2 mx-2" />

            {chapters.sort((a, b) => a.order - b.order).map((chapter) => (
              <div
                key={chapter.id}
                className={cn(
                  "group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all",
                  activeChapterId === chapter.id 
                    ? "bg-indigo-100 text-indigo-700" 
                    : "hover:bg-slate-200 text-slate-600",
                  isCollapsed && "justify-center"
                )}
                onClick={() => onSelectChapter(chapter.id)}
              >
                <FileText className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 truncate text-sm font-medium">
                      {chapter.title || "Capítulo sem título"}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChapter(chapter.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {isCollapsed && (
        <div className="p-2 border-t border-slate-200 flex justify-center">
          <Button size="icon" variant="ghost" onClick={onAddChapter} className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
