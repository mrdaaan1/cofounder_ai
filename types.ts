
export type ArtifactId = 
  | 'idea' 
  | 'target_audience' 
  | 'hypotheses' 
  | 'market_analysis' 
  | 'competitors' 
  | 'business_model' 
  | 'financial_model' 
  | 'mvp' 
  | 'marketing' 
  | 'roadmap' 
  | 'team';

export interface Artifact {
  id: ArtifactId;
  title: string;
  description: string;
  content: string;
  isCompleted: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'assistant';
  text: string;
}

export interface AIResponse {
  reply: string;
  artifactUpdate?: {
    id: ArtifactId;
    content: string;
    isCompleted: boolean;
  };
  suggestedAction?: string;
}
