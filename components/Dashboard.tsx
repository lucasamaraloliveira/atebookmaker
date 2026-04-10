'use client';

import { Ebook } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Plus, Book, Trash2, Clock, User, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardProps {
  ebooks: Ebook[];
  onCreateEbook: () => void;
  onSelectEbook: (id: string) => void;
  onDeleteEbook: (id: string) => void;
}

export default function Dashboard({ ebooks, onCreateEbook, onSelectEbook, onDeleteEbook }: DashboardProps) {
  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-12 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Biblioteca de Ebooks</h1>
            <p className="text-slate-500 mt-2">Crie, gerencie e edite suas obras literárias com IA.</p>
          </div>
          <Button 
            onClick={onCreateEbook}
            className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6 gap-2 shadow-lg shadow-indigo-200"
          >
            <Plus className="h-5 w-5" />
            Criar Novo Ebook
          </Button>
        </header>

        {ebooks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200"
          >
            <div className="bg-indigo-50 p-6 rounded-full mb-6">
              <Book className="h-12 w-12 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Sua biblioteca está vazia</h2>
            <p className="text-slate-500 mt-2 max-w-sm text-center">
              Parece que você ainda não começou nenhum ebook. Clique no botão acima para iniciar sua primeira criação!
            </p>
            <Button 
              variant="outline" 
              className="mt-8 gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              onClick={onCreateEbook}
            >
              Começar Agora
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ebooks.sort((a, b) => b.createdAt - a.createdAt).map((ebook, index) => (
              <motion.div
                key={ebook.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group hover:shadow-2xl transition-all duration-300 border-none bg-white shadow-sm overflow-hidden flex flex-col h-full cursor-pointer" onClick={() => onSelectEbook(ebook.id)}>
                  <div className={cn(
                    "h-48 w-full relative overflow-hidden",
                    ebook.theme === 'classic' && "bg-slate-800",
                    ebook.theme === 'modern' && "bg-indigo-600",
                    ebook.theme === 'minimal' && "bg-slate-200",
                    ebook.theme === 'elegant' && "bg-amber-800",
                    ebook.theme === 'technical' && "bg-emerald-600",
                    !ebook.theme && "bg-slate-500"
                  )}>
                    {ebook.coverImage ? (
                        <img src={ebook.coverImage} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Capa" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                             <Book className="h-12 w-12 text-white/20" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                      <ChevronRight className="h-10 w-10 text-white/70" />
                    </div>
                  </div>
                  
                  <CardHeader className="p-6">
                    <CardTitle className="text-xl font-bold line-clamp-1">{ebook.title || 'Sem Título'}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-2 h-10">
                      {ebook.description || 'Nenhuma descrição fornecida.'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="px-6 pb-6 flex-1">
                    <div className="flex flex-col gap-3 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{ebook.author || 'Autor desconhecido'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{format(ebook.createdAt, "d 'de' MMMM, yyyy", { locale: ptBR })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Book className="h-4 w-4" />
                        <span>{ebook.chapters.length} {ebook.chapters.length === 1 ? 'Capítulo' : 'Capítulos'}</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center mt-auto">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 gap-2 h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEbook(ebook.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </Button>
                    <Button variant="ghost" size="sm" className="text-indigo-600 font-bold group-hover:translate-x-1 transition-transform">
                      Editar Obra
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Utility function for conditional classes inside the component file if not imported
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
