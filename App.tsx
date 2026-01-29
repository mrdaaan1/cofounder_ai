
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { INITIAL_ARTIFACTS } from './constants';
import { Artifact, ChatMessage, ArtifactId } from './types';
import { getMentorResponse } from './services/gigachatService';
import ChatInterface from './components/ChatInterface';
import ArtifactItem from './components/ArtifactItem';
import Auth from './components/Auth';
import ProjectSelector from './components/ProjectSelector';
import { supabase } from './lib/supabaseClient';
import { createProject, loadArtifacts, saveArtifacts } from './services/projectService';
import type { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>(INITIAL_ARTIFACTS);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Привет! Я твой ИИ-ментор для построения стартапа. Расскажи мне, на какой стадии сейчас твой проект? У тебя есть только идея, или уже есть первые результаты?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const initializingRef = useRef(false); // Флаг для предотвращения дублирования

  // Проверка авторизации при загрузке
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Инициализация первого проекта для нового пользователя
  useEffect(() => {
    if (session && !currentProjectId && !initializingRef.current) {
      initializeProject();
    }
  }, [session, currentProjectId]);

  const initializeProject = async () => {
    if (!session?.user || initializingRef.current) return;

    initializingRef.current = true; // Устанавливаем флаг

    try {
      // Проверяем, есть ли у пользователя проекты
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (projects && projects.length > 0) {
        // Загружаем последний проект
        setCurrentProjectId(projects[0].id);
      } else {
        // Создаём первый проект
        const newProject = await createProject(session.user.id, 'Мой первый проект');
        setCurrentProjectId(newProject.id);
      }
    } catch (error) {
      console.error('Error initializing project:', error);
    } finally {
      initializingRef.current = false; // Сбрасываем флаг
    }
  };

  // Загрузка артефактов при выборе проекта
  useEffect(() => {
    if (currentProjectId) {
      loadProjectArtifacts();
    }
  }, [currentProjectId]);

  const loadProjectArtifacts = async () => {
    if (!currentProjectId) return;

    try {
      const loadedArtifacts = await loadArtifacts(currentProjectId);
      setArtifacts(loadedArtifacts);
    } catch (error) {
      console.error('Error loading artifacts:', error);
    }
  };

  // Автосохранение артефактов
  useEffect(() => {
    if (currentProjectId && session) {
      const timeout = setTimeout(() => {
        saveArtifacts(currentProjectId, artifacts).catch(error => {
          console.error('Error auto-saving artifacts:', error);
        });
      }, 2000); // Автосохранение через 2 секунды после изменений

      return () => clearTimeout(timeout);
    }
  }, [artifacts, currentProjectId, session]);

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = [...messages, userMsg];
      const aiResponse = await getMentorResponse(history, artifacts);
      
      setMessages(prev => [...prev, { role: 'model', text: aiResponse.reply }]);
      
      if (aiResponse.artifactUpdate) {
        setArtifacts(prev => prev.map(art => 
          art.id === aiResponse.artifactUpdate!.id 
            ? { ...art, content: aiResponse.artifactUpdate!.content, isCompleted: aiResponse.artifactUpdate!.isCompleted }
            : art
        ));
        // Highlight updated artifact
        setActiveArtifactId(aiResponse.artifactUpdate.id);
      }
    } catch (error) {
      console.error("Error in AI chain:", error);
      setMessages(prev => [...prev, { role: 'model', text: 'Извини, что-то пошло не так. Давай попробуем еще раз.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateArtifactContent = (id: string, content: string) => {
    setArtifacts(prev => prev.map(art => art.id === id ? { ...art, content } : art));
  };

  const handleProjectSelect = async (projectId: string) => {
    setCurrentProjectId(projectId);

    // Сбросить контекст чата
    setMessages([
      { role: 'model', text: 'Привет! Я твой ИИ-ментор для построения стартапа. Расскажи мне, на какой стадии сейчас твой проект? У тебя есть только идея, или уже есть первые результаты?' }
    ]);

    // Артефакты загрузятся автоматически через useEffect
  };

  const handleLogout = () => {
    setSession(null);
    setCurrentProjectId(null);
    setArtifacts(INITIAL_ARTIFACTS);
    setMessages([
      { role: 'model', text: 'Привет! Я твой ИИ-ментор для построения стартапа. Расскажи мне, на какой стадии сейчас твой проект? У тебя есть только идея, или уже есть первые результаты?' }
    ]);
  };

  // Показываем экран загрузки
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Показываем форму авторизации
  if (!session) {
    return <Auth />;
  }

  const allCompleted = artifacts.every(a => a.isCompleted);
  const completionCount = artifacts.filter(a => a.isCompleted).length;
  const completionPercent = Math.round((completionCount / artifacts.length) * 100);

  const downloadPitchDeck = () => {
    const content = artifacts.map(art => `## ${art.title}\n${art.content || 'Информация отсутствует'}\n`).join('\n---\n\n');
    const header = `# Питч-дек проекта\nСформировано с помощью FoundersPath AI\n\n`;
    const blob = new Blob([header + content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pitch_deck_summary.doc'; // Note: It's actually a text file with .doc extension for convenience
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Top Bar with Project Selector */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800 flex items-center">
            FoundersPath
            <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded font-black">BETA</span>
          </h1>
        </div>
        <ProjectSelector
          currentProjectId={currentProjectId}
          onProjectSelect={handleProjectSelect}
          onLogout={handleLogout}
        />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Artifacts */}
        <aside className="w-80 border-r border-gray-200 bg-white flex flex-col shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">Ваши Артефакты</p>
          
          <div className="mt-4">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[11px] font-bold text-gray-500">Прогресс готовности</span>
              <span className="text-[11px] font-bold text-blue-600">{completionPercent}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-500 ease-out" 
                style={{ width: `${completionPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {artifacts.map(art => (
            <ArtifactItem 
              key={art.id} 
              artifact={art} 
              onEdit={updateArtifactContent}
              isActive={activeArtifactId === art.id}
              onClick={() => setActiveArtifactId(activeArtifactId === art.id ? null : art.id)}
            />
          ))}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white">
          <button 
            onClick={downloadPitchDeck}
            disabled={!artifacts.some(a => a.content)}
            className={`w-full flex items-center justify-center space-x-2 py-3 rounded-xl font-bold text-sm transition-all ${
              artifacts.some(a => a.content)
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Скачать Питч Дек</span>
          </button>
          {!allCompleted && artifacts.some(a => a.content) && (
            <p className="text-[10px] text-center text-gray-400 mt-2">
              Заполните все блоки для полноценного документа
            </p>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col p-6 h-full">
        <div className="max-w-4xl w-full mx-auto flex-1 h-full">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
};

export default App;
