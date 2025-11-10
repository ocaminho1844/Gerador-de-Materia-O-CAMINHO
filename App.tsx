import React, { useState, useCallback, useReducer } from 'react';
import { ArticleType, Step, AppState, GeneratedImage } from './types';
import {
  createChat, generateStructure, generateArticle, generateAudio,
  generateImages, generateTitles, generateCaption
} from './services/geminiService';
import { ARTICLE_CONFIG, LoadingSpinner, CheckIcon, EditIcon, AudioIcon, DownloadIcon, ImageIcon, TitleIcon, CaptionIcon, Logo } from './constants';
import ReactMarkdown from 'react-markdown';

const initialState: AppState = {
  step: Step.INPUT,
  isLoading: false,
  loadingMessage: '',
  error: null,
  theme: '',
  articleType: ArticleType.PAUTA,
  analyticalLine: '',
  chat: null,
  structure: '',
  articleText: '',
  audioData: [],
  images: [],
  selectedImageId: null,
  titleOptions: [],
  selectedTitle: null,
  youtubeCaption: '',
  showSuggestions: { structure: false, title: false, caption: false },
  suggestions: { structure: '', title: '', caption: '' },
};

function appReducer(state: AppState, action: { type: string; payload?: any }): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: true, loadingMessage: action.payload, error: null };
    case 'SET_SUCCESS':
      return { ...state, isLoading: false, loadingMessage: '' };
    case 'SET_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'UPDATE_FIELD':
      return { ...state, [action.payload.field]: action.payload.value };
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'START_PROCESS':
      return { ...state, chat: action.payload, step: Step.STRUCTURE_APPROVAL, isLoading: false };
    case 'RESET':
        return {
            ...initialState,
            chat: state.chat, // Keep the chat session for history
        };
    case 'TOGGLE_SUGGESTIONS':
      return {
        ...state,
        showSuggestions: { ...state.showSuggestions, [action.payload]: !state.showSuggestions[action.payload] },
      };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const handleFieldChange = (field: keyof AppState, value: any) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { field, value } });
  };
   const handleSuggestionChange = (field: keyof AppState['suggestions'], value: any) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { field: 'suggestions', value: {...state.suggestions, [field]: value} } });
  };

  const handleGenerateStructure = async () => {
    dispatch({ type: 'SET_LOADING', payload: 'Analisando o tema e gerando a estrutura...' });
    try {
      const chatInstance = state.chat || createChat();
      if (!state.chat) {
          handleFieldChange('chat', chatInstance);
      }
      const newStructure = await generateStructure(chatInstance, state.theme, state.articleType, state.analyticalLine, state.suggestions.structure);
      handleFieldChange('structure', newStructure);
      dispatch({ type: 'SET_STEP', payload: Step.STRUCTURE_APPROVAL });
      dispatch({ type: 'SET_SUCCESS' });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao gerar a estrutura. Tente novamente.' });
      console.error(err);
    }
  };

  const handleGenerateArticle = async () => {
    if (!state.chat || !state.structure) return;
    dispatch({ type: 'SET_LOADING', payload: 'Escrevendo o artigo e gerando áudio...' });
    try {
      const article = await generateArticle(state.chat, state.structure);
      handleFieldChange('articleText', article);

      const audio = await generateAudio(article, state.articleType);
      handleFieldChange('audioData', audio);
      
      dispatch({ type: 'SET_STEP', payload: Step.ARTICLE_VIEW });
      dispatch({ type: 'SET_SUCCESS' });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao gerar o artigo ou áudio. Tente novamente.' });
      console.error(err);
    }
  };
  
  const handleGenerateImages = async () => {
    if(!state.chat) return;
    dispatch({ type: 'SET_LOADING', payload: 'Criando conceitos visuais e gerando imagens...'});
    try {
        const images = await generateImages(state.chat);
        handleFieldChange('images', images);
        dispatch({ type: 'SET_STEP', payload: Step.IMAGE_APPROVAL });
        dispatch({ type: 'SET_SUCCESS' });
    } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: 'Falha ao gerar imagens.' });
        console.error(err);
    }
  };

  const handleGenerateTitles = async () => {
    if (!state.chat) return;
    dispatch({ type: 'SET_LOADING', payload: 'Gerando opções de títulos...' });
    try {
      const titles = await generateTitles(state.chat, state.suggestions.title);
      handleFieldChange('titleOptions', titles);
      dispatch({ type: 'SET_STEP', payload: Step.TITLE_APPROVAL });
      dispatch({ type: 'SET_SUCCESS' });
    } catch(err) {
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao gerar títulos.'});
      console.error(err);
    }
  };

  const handleGenerateCaption = async () => {
    if (!state.chat || !state.selectedTitle) return;
    dispatch({ type: 'SET_LOADING', payload: 'Criando legenda para YouTube...' });
    try {
      const caption = await generateCaption(state.chat, state.selectedTitle, state.suggestions.caption);
      handleFieldChange('youtubeCaption', caption);
      dispatch({ type: 'SET_STEP', payload: Step.CAPTION_APPROVAL });
      dispatch({ type: 'SET_SUCCESS' });
    } catch(err) {
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao gerar legenda.'});
      console.error(err);
    }
  };

  const resetProcess = () => {
    dispatch({ type: 'RESET' });
  };
  
  const renderStep = () => {
    switch (state.step) {
      case Step.INPUT:
        return renderInputForm();
      case Step.STRUCTURE_APPROVAL:
        return renderStructureApproval();
      case Step.ARTICLE_VIEW:
        return renderArticleView();
      case Step.IMAGE_APPROVAL:
        return renderImageApproval();
      case Step.TITLE_APPROVAL:
        return renderTitleApproval();
      case Step.CAPTION_APPROVAL:
        return renderCaptionApproval();
      case Step.COMPLETE:
        return renderComplete();
      default:
        return renderInputForm();
    }
  };

  const renderInputForm = () => (
    <div className="space-y-6">
        <div>
            <label htmlFor="theme" className="block text-sm font-medium text-brand-muted">Tema ou URL da Matéria</label>
            <input type="text" id="theme" value={state.theme} onChange={e => handleFieldChange('theme', e.target.value)} className="mt-1 block w-full bg-brand-surface border border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-light focus:outline-none focus:ring-brand-red focus:border-brand-red sm:text-sm" placeholder="Ex: A profecia das 2300 tardes e manhãs" />
        </div>
        <div>
            <label className="block text-sm font-medium text-brand-muted">Tipo de Matéria</label>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(ArticleType).map(type => (
                    <button key={type} onClick={() => handleFieldChange('articleType', type)} className={`text-left p-4 rounded-lg border-2 transition-all ${state.articleType === type ? 'bg-brand-red border-brand-red-light' : 'bg-brand-surface border-brand-border hover:border-brand-red'}`}>
                        <p className="font-bold text-brand-light">{type}</p>
                        <p className="text-sm text-brand-muted">{ARTICLE_CONFIG[type].words} palavras</p>
                    </button>
                ))}
            </div>
        </div>
        <div>
            <label htmlFor="analyticalLine" className="block text-sm font-medium text-brand-muted">Linha de Desenvolvimento Analítico</label>
            <textarea id="analyticalLine" rows={3} value={state.analyticalLine} onChange={e => handleFieldChange('analyticalLine', e.target.value)} className="mt-1 block w-full bg-brand-surface border border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-light focus:outline-none focus:ring-brand-red focus:border-brand-red sm:text-sm" placeholder="Ex: Focar na precisão histórica e cumprimento profético..."></textarea>
        </div>
        <div className="text-right">
            <button onClick={handleGenerateStructure} disabled={!state.theme || !state.analyticalLine} className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-red hover:bg-brand-red-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red disabled:bg-gray-500 disabled:cursor-not-allowed">
                Gerar Estrutura
            </button>
        </div>
    </div>
  );

  const renderStructureApproval = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-brand-light">Estrutura Proposta</h2>
        <div className="prose prose-invert max-w-none bg-brand-surface p-4 rounded-md border border-brand-border max-h-[50vh] overflow-y-auto">
            <ReactMarkdown>{state.structure}</ReactMarkdown>
        </div>
        {state.showSuggestions.structure && (
            <div className='mt-4'>
                <label htmlFor="structure-suggestions" className="block text-sm font-medium text-brand-muted">Sugestões de Alteração</label>
                <textarea id="structure-suggestions" rows={3} value={state.suggestions.structure} onChange={e => handleSuggestionChange('structure', e.target.value)} className="mt-1 block w-full bg-brand-surface border border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-light focus:outline-none focus:ring-brand-red focus:border-brand-red sm:text-sm" placeholder="Ex: Gostaria de adicionar um tópico sobre..."></textarea>
            </div>
        )}
        <div className="flex justify-end space-x-4">
            <button onClick={() => dispatch({type: 'TOGGLE_SUGGESTIONS', payload: 'structure'})} className="inline-flex items-center justify-center py-2 px-4 border border-brand-muted shadow-sm text-sm font-medium rounded-md text-brand-light bg-transparent hover:bg-brand-surface focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red">
                <EditIcon /> {state.showSuggestions.structure ? 'Cancelar' : 'Sugerir Alterações'}
            </button>
            <button onClick={handleGenerateArticle} className="inline-flex items-center justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <CheckIcon /> Aprovar e Escrever Artigo
            </button>
             {state.showSuggestions.structure && <button onClick={handleGenerateStructure} className="inline-flex items-center justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-red hover:bg-brand-red-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red">Enviar Sugestão</button>}
        </div>
    </div>
  );
  
  const renderArticleView = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-brand-light">Artigo e Áudio</h2>
        <div className="prose prose-invert max-w-none bg-brand-surface p-4 rounded-md border border-brand-border max-h-[50vh] overflow-y-auto">
            <ReactMarkdown>{state.articleText}</ReactMarkdown>
        </div>
        <div className="space-y-4">
            <h3 className="font-semibold text-brand-light">Áudios Gerados</h3>
            {state.audioData.map((audio, index) => (
                <div key={index} className="flex items-center space-x-4 bg-brand-surface p-3 rounded-lg">
                    <p className="flex-shrink-0 text-brand-muted"><AudioIcon/> Parte {index + 1}</p>
                    <audio controls src={audio.blobUrl} className="w-full"></audio>
                    <a href={audio.blobUrl} download={`materia_parte_${index + 1}.wav`} className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-red hover:bg-brand-red-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red">
                        <DownloadIcon /> Baixar
                    </a>
                </div>
            ))}
        </div>
        <div className="flex justify-end">
             <button onClick={handleGenerateImages} className="inline-flex items-center justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <ImageIcon /> Aprovar e Gerar Imagens
            </button>
        </div>
    </div>
  );

  const renderImageApproval = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-brand-light">Escolha a Imagem de Capa</h2>
        <div className="space-y-8">
            {state.images.map(image => (
                <div key={image.id} onClick={() => handleFieldChange('selectedImageId', image.id)} className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${state.selectedImageId === image.id ? 'bg-brand-red/20 border-brand-red' : 'bg-brand-surface border-brand-border hover:border-brand-red'}`}>
                    <p className="text-sm text-brand-muted mb-4 italic">"{image.prompt}"</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <img src={image.src16x9} alt="16:9 aspect ratio" className="rounded-md w-full" />
                        <img src={image.src9x16} alt="9:16 aspect ratio" className="rounded-md w-full md:w-auto md:h-64 mx-auto" />
                    </div>
                     {state.selectedImageId === image.id && (
                        <div className="mt-4 flex justify-center space-x-4">
                            <a href={image.src16x9} download={`capa-${image.id}-16x9.jpg`} className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-red hover:bg-brand-red-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red">
                                <DownloadIcon /> Baixar 16:9
                            </a>
                            <a href={image.src9x16} download={`capa-${image.id}-9x16.jpg`} className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-red hover:bg-brand-red-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red">
                                <DownloadIcon /> Baixar 9:16
                            </a>
                        </div>
                    )}
                </div>
            ))}
        </div>
        <div className="flex justify-end">
             <button onClick={handleGenerateTitles} disabled={state.selectedImageId === null} className="inline-flex items-center justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-500">
                <TitleIcon/> Aprovar e Gerar Títulos
            </button>
        </div>
    </div>
  );
  
  const renderTitleApproval = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-brand-light">Escolha o Título</h2>
      <div className="space-y-4">
        {state.titleOptions.map((title, index) => (
          <div key={index} onClick={() => handleFieldChange('selectedTitle', title)} className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${state.selectedTitle === title ? 'bg-brand-red/20 border-brand-red' : 'bg-brand-surface border-brand-border hover:border-brand-red'}`}>
            <p className="font-mono text-brand-light">{title}</p>
          </div>
        ))}
      </div>
      {state.showSuggestions.title && (
            <div className='mt-4'>
                <label htmlFor="title-suggestions" className="block text-sm font-medium text-brand-muted">Sugestões de Alteração</label>
                <textarea id="title-suggestions" rows={3} value={state.suggestions.title} onChange={e => handleSuggestionChange('title', e.target.value)} className="mt-1 block w-full bg-brand-surface border border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-light focus:outline-none focus:ring-brand-red focus:border-brand-red sm:text-sm" placeholder="Ex: Tente um tom mais provocativo..."></textarea>
            </div>
      )}
      <div className="flex justify-end space-x-4">
        <button onClick={() => dispatch({type: 'TOGGLE_SUGGESTIONS', payload: 'title'})} className="inline-flex items-center justify-center py-2 px-4 border border-brand-muted shadow-sm text-sm font-medium rounded-md text-brand-light bg-transparent hover:bg-brand-surface focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red">
          <EditIcon /> {state.showSuggestions.title ? 'Cancelar' : 'Sugerir Alterações'}
        </button>
        <button onClick={handleGenerateCaption} disabled={!state.selectedTitle} className="inline-flex items-center justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-500">
          <CaptionIcon /> Aprovar e Gerar Legenda
        </button>
        {state.showSuggestions.title && <button onClick={handleGenerateTitles} className="inline-flex items-center justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-red hover:bg-brand-red-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red">Enviar Sugestão</button>}
      </div>
    </div>
  );

  const renderCaptionApproval = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-brand-light">Legenda para YouTube</h2>
      <div className="bg-brand-surface p-4 rounded-md border border-brand-border">
          <p className="text-brand-light whitespace-pre-wrap">{state.youtubeCaption}</p>
      </div>
      {state.showSuggestions.caption && (
        <div className='mt-4'>
          <label htmlFor="caption-suggestions" className="block text-sm font-medium text-brand-muted">Sugestões de Alteração</label>
          <textarea id="caption-suggestions" rows={3} value={state.suggestions.caption} onChange={e => handleSuggestionChange('caption', e.target.value)} className="mt-1 block w-full bg-brand-surface border border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-light focus:outline-none focus:ring-brand-red focus:border-brand-red sm:text-sm" placeholder="Ex: Adicione uma pergunta mais direta no início..."></textarea>
        </div>
      )}
      <div className="flex justify-end space-x-4">
        <button onClick={() => dispatch({type: 'TOGGLE_SUGGESTIONS', payload: 'caption'})} className="inline-flex items-center justify-center py-2 px-4 border border-brand-muted shadow-sm text-sm font-medium rounded-md text-brand-light bg-transparent hover:bg-brand-surface focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red">
          <EditIcon /> {state.showSuggestions.caption ? 'Cancelar' : 'Sugerir Alterações'}
        </button>
        <button onClick={() => dispatch({type: 'SET_STEP', payload: Step.COMPLETE})} className="inline-flex items-center justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
          <CheckIcon /> Aprovar e Finalizar
        </button>
        {state.showSuggestions.caption && <button onClick={handleGenerateCaption} className="inline-flex items-center justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-red hover:bg-brand-red-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red">Enviar Sugestão</button>}
      </div>
    </div>
  );

  const renderComplete = () => (
    <div className="text-center space-y-6 py-12">
        <CheckIcon className="mx-auto h-24 w-24 text-green-500" />
        <h2 className="text-3xl font-bold text-brand-light">Ciclo Concluído!</h2>
        <p className="text-brand-muted">A matéria foi gerada com sucesso. O contexto foi salvo para futuras referências.</p>
        <button onClick={resetProcess} className="inline-flex items-center justify-center py-3 px-8 border border-transparent shadow-sm text-lg font-medium rounded-md text-white bg-brand-red hover:bg-brand-red-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red">
            Iniciar Nova Matéria
        </button>
    </div>
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto bg-brand-surface rounded-xl shadow-2xl p-6 sm:p-8 space-y-8 border border-brand-border">
        <header className="text-center space-y-4">
            <Logo />
            <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-light">
                Gerador de Matéria Jornalística Analítica
            </h1>
            <p className="text-brand-muted">Uma ferramenta de IA para criação de conteúdo aprofundado.</p>
        </header>

        {state.isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
            <LoadingSpinner />
            <p className="mt-4 text-lg text-white">{state.loadingMessage}</p>
          </div>
        )}

        {state.error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-md relative" role="alert">
                <strong className="font-bold">Erro: </strong>
                <span className="block sm:inline">{state.error}</span>
            </div>
        )}
        
        <main>
            {renderStep()}
        </main>
      </div>
    </div>
  );
}