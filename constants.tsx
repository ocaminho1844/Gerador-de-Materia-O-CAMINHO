import { ArticleType } from './types';

export const ARTICLE_CONFIG = {
  [ArticleType.PAUTA]: {
    words: 400,
    prompt: "Matéria Rápida - 400 palavras - 70% Informações e dados / 25% Análise / 5% Apelo (reflexão)",
  },
  [ArticleType.ANALISE]: {
    words: 1000,
    prompt: "Matéria Média - 1000 palavras - 60% Informações e dados / 35% Análise / 5% Apelo (reflexão)",
  },
  [ArticleType.DOSSIE]: {
    words: 2000,
    prompt: "Matéria Extensa - 2000 palavras - 5% Introdução / 40% desenvolvimento / 40% Análise / 10% Conclusão / 5% Apelo (reflexão)",
  },
};

export const YOUTUBE_CAPTION_CTA = `
MINISTÉRIO O CAMINHO:
🔔 NOTÍCIAS E ESTUDOS EM PRIMEIRA MÃO: Junte-se ao nosso canal no Telegram, onde as notícias e estudos proféticos chegam primeiro: https://t.me/o_caminho

Quer ver mais conteúdos? 👉 Inscreva-se em nosso canal do YouTube: www.youtube.com/@OCaminho7

📸 Siga-nos também no Instagram: https://www.instagram.com/o_caminho_7/
`;

export const Logo = () => (
  <img 
    src="https://yt3.googleusercontent.com/rGF5uq2sl2DOvT-Hs3wb70ZDRcRuL9P0LrabBqTzr2xiPoUL041N6Knh9OW5WLxZv9ZGUgF8=s160-c-k-c0x00ffffff-no-rj" 
    alt="O Caminho Logo" 
    className="h-24 w-24 mx-auto rounded-full border-2 border-brand-red shadow-lg" 
  />
);

export const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

export const AudioIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

export const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

export const ImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
    </svg>
);

export const TitleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 4a1 1 0 011 1v1.333a1 1 0 001 1h2.333a1 1 0 110 2H12a1 1 0 00-1 1v4.333a1 1 0 11-2 0V9a1 1 0 00-1-1H5.667a1 1 0 110-2H8a1 1 0 001-1V5a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

export const CaptionIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
);