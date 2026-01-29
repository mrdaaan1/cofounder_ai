import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getUserProjects, createProject, deleteProject } from '../services/projectService';
import type { Project } from '../lib/supabaseClient';

interface ProjectSelectorProps {
  currentProjectId: string | null;
  onProjectSelect: (projectId: string) => void;
  onLogout: () => void;
}

export default function ProjectSelector({ currentProjectId, onProjectSelect, onLogout }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userProjects = await getUserProjects(user.id);
      setProjects(userProjects || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    setCreatingProject(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newProject = await createProject(user.id, `Проект ${projects.length + 1}`);
      setProjects([newProject, ...projects]);
      onProjectSelect(newProject.id);
      setShowDropdown(false);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Ошибка при создании проекта');
    } finally {
      setCreatingProject(false);
    }
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Удалить этот проект? Все данные будут потеряны.')) return;

    try {
      await deleteProject(projectId);
      setProjects(projects.filter(p => p.id !== projectId));

      // Если удалили текущий проект, выбираем другой
      if (projectId === currentProjectId && projects.length > 1) {
        const nextProject = projects.find(p => p.id !== projectId);
        if (nextProject) onProjectSelect(nextProject.id);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Ошибка при удалении проекта');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const currentProject = projects.find(p => p.id === currentProjectId);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
        <span>Загрузка...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        {/* Выбор проекта */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="font-medium text-gray-800">
              {currentProject?.title || 'Выберите проект'}
            </span>
            <svg className={`w-4 h-4 text-gray-600 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Выпадающий список */}
          {showDropdown && (
            <div className="absolute top-full mt-2 left-0 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-2">
                <button
                  onClick={handleCreateProject}
                  disabled={creatingProject}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">
                    {creatingProject ? 'Создание...' : 'Создать новый проект'}
                  </span>
                </button>
              </div>

              <div className="border-t border-gray-200">
                {projects.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Нет проектов. Создайте первый!
                  </div>
                ) : (
                  <div className="py-1">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className={`flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer ${
                          project.id === currentProjectId ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => {
                          onProjectSelect(project.id);
                          setShowDropdown(false);
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-800 truncate">
                            {project.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(project.updated_at).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteProject(project.id, e)}
                          className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition"
                          title="Удалить проект"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Кнопка выхода */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          title="Выйти из аккаунта"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="font-medium">Выйти</span>
        </button>
      </div>

      {/* Закрытие по клику вне */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </div>
  );
}
