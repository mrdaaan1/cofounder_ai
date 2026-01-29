import { supabase } from '../lib/supabaseClient';
import { Artifact, ChatMessage } from '../types';
import { INITIAL_ARTIFACTS } from '../constants';

export async function createProject(userId: string, title: string = 'Новый проект') {
  const { data, error } = await supabase
    .from('projects')
    .insert({ user_id: userId, title })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserProjects(userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateProjectTimestamp(projectId: string) {
  const { error } = await supabase
    .from('projects')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', projectId);

  if (error) throw error;
}

export async function saveArtifacts(projectId: string, artifacts: Artifact[]) {
  // Удаляем старые артефакты
  await supabase.from('artifacts').delete().eq('project_id', projectId);

  // Вставляем новые
  const artifactsToSave = artifacts.map(art => ({
    project_id: projectId,
    artifact_type: art.id,
    content: art.content,
    is_completed: art.isCompleted
  }));

  const { error } = await supabase.from('artifacts').insert(artifactsToSave);
  if (error) throw error;

  // Обновляем timestamp проекта
  await updateProjectTimestamp(projectId);
}

export async function loadArtifacts(projectId: string): Promise<Artifact[]> {
  const { data, error } = await supabase
    .from('artifacts')
    .select('*')
    .eq('project_id', projectId);

  if (error) throw error;

  // Преобразуем из БД в формат приложения
  return INITIAL_ARTIFACTS.map(template => {
    const saved = data?.find(a => a.artifact_type === template.id);
    if (saved) {
      return {
        ...template,
        content: saved.content || '',
        isCompleted: saved.is_completed
      };
    }
    return template;
  });
}

export async function deleteProject(projectId: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) throw error;
}
