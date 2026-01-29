
import React from 'react';
import { Artifact } from '../types';

interface ArtifactItemProps {
  artifact: Artifact;
  onEdit: (id: string, content: string) => void;
  isActive: boolean;
  onClick: () => void;
}

const ArtifactItem: React.FC<ArtifactItemProps> = ({ artifact, onEdit, isActive, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all cursor-pointer mb-3 ${
        isActive 
          ? 'bg-blue-50 border-blue-200 shadow-sm' 
          : 'bg-white border-gray-100 hover:border-blue-200 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className={`font-semibold text-sm ${isActive ? 'text-blue-700' : 'text-gray-800'}`}>
          {artifact.title}
        </h3>
        {artifact.isCompleted && (
          <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
            Готово
          </span>
        )}
      </div>
      
      {artifact.content ? (
        <p className="text-xs text-gray-600 line-clamp-2 italic">
          {artifact.content}
        </p>
      ) : (
        <p className="text-xs text-gray-400">
          {artifact.description}
        </p>
      )}

      {isActive && (
        <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <textarea
            className="w-full p-2 text-xs border border-blue-100 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 min-h-[100px]"
            value={artifact.content}
            onChange={(e) => onEdit(artifact.id, e.target.value)}
            placeholder="Введите информацию здесь..."
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ArtifactItem;
