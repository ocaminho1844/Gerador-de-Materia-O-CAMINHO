import { Chat } from "@google/genai";

export enum Step {
  INPUT,
  STRUCTURE_APPROVAL,
  ARTICLE_VIEW,
  IMAGE_APPROVAL,
  TITLE_APPROVAL,
  CAPTION_APPROVAL,
  COMPLETE,
}

export enum ArticleType {
  PAUTA = 'Pauta',
  ANALISE = 'Análise',
  DOSSIE = 'Dossiê',
}

export interface GeneratedImage {
  id: number;
  prompt: string;
  src16x9: string;
  src9x16: string;
}

export interface AppState {
  step: Step;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  theme: string;
  articleType: ArticleType;
  analyticalLine: string;
  chat: Chat | null;
  structure: string;
  articleText: string;
  audioData: { base64: string; blobUrl: string }[];
  images: GeneratedImage[];
  selectedImageId: number | null;
  titleOptions: string[];
  selectedTitle: string | null;
  youtubeCaption: string;
  showSuggestions: {
    structure: boolean;
    title: boolean;
    caption: boolean;
  };
  suggestions: {
    structure: string;
    title: string;
    caption: string;
  }
}