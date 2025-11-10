import { GoogleGenAI, Chat, GenerateContentResponse, Modality } from "@google/genai";
import { ArticleType, GeneratedImage } from "../types";
import { ARTICLE_CONFIG, YOUTUBE_CAPTION_CTA } from "../constants";
import { decode, pcmToWav } from "../utils/audioUtils";

// Fix: Per coding guidelines, initialize GoogleGenAI with process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


export function createChat(): Chat {
  const systemInstruction = `Você é um assistente especializado em jornalismo analítico com uma perspectiva teológica baseada nos escritos de Ellen G. White e dos pioneiros adventistas (Tiago White, Uriah Smith, A.T. Jones, etc.). Sua tarefa é seguir um processo passo a passo para criar conteúdo de alta qualidade. Você deve manter o contexto de cada etapa para as etapas seguintes.`;
  return ai.chats.create({
    model: 'gemini-2.5-pro',
    config: { systemInstruction },
  });
}

export async function generateStructure(chat: Chat, theme: string, articleType: ArticleType, analyticalLine: string, suggestions: string): Promise<string> {
    const config = ARTICLE_CONFIG[articleType];
    const suggestionText = suggestions ? `O usuário sugeriu as seguintes alterações: "${suggestions}". Por favor, incorpore este feedback na nova estrutura.` : '';
    const prompt = `
      ETAPA 1: Geração de Estrutura.
      Tema: "${theme}"
      Tipo de Matéria: ${articleType} (${config.prompt})
      Linha Analítica: "${analyticalLine}"
      
      Tarefa:
      1. Pesquise o tema de forma exaustiva.
      2. Aplique a técnica 5W1H (O quê, Quem, Onde, Quando, Por que, Como).
      3. Analise o assunto com a lente de Ellen White e dos pioneiros adventistas.
      4. Monte uma estrutura detalhada em markdown para a matéria, apontando os tópicos principais, as citações de Ellen White/pioneiros que você planeja usar e os versículos bíblicos de apoio para cada seção.
      
      ${suggestionText}

      A resposta DEVE ser apenas a estrutura em formato markdown.
    `;
    const response = await chat.sendMessage({ message: prompt });
    return response.text;
}

export async function generateArticle(chat: Chat, structure: string): Promise<string> {
    const prompt = `
      ETAPA 2: Redação do Roteiro de Áudio.
      Com base na estrutura APROVADA abaixo, escreva o roteiro completo para uma narração. Siga rigorosamente a estrutura e a distribuição de conteúdo.

      IMPORTANTE: O texto DEVE ser otimizado para uma narração neural (Text-to-Speech) com um tom humano e conversacional. Para isso, incorpore anotações semânticas entre colchetes [ ] para guiar a entonação, ritmo e emoção da voz.

      Guia de Anotações TTS:
      - Emoção: Use [emoção:séria], [emoção:reflexiva], [emoção:preocupada] para definir o tom.
      - Pausa: Use [pausa:curta], [pausa:média], [pausa:longa] para criar respirações e momentos dramáticos.
      - Ênfase: Use [ênfase:forte]Isso é crucial[/ênfase] para destacar palavras-chave.
      - Ritmo e Tom: Use [ritmo:lento] ou [tom:baixo] para variar a cadência.
      - Use as anotações de forma sutil, a cada 2-3 frases, para não soar artificial.

      Formato do Roteiro:
      - Deve ser um texto corrido, como uma conversa com o ouvinte.
      - NÃO inclua títulos ou subtítulos. A narração deve fluir naturalmente de um tópico para o outro.
      
      Estrutura Aprovada:
      ${structure}

      A resposta DEVE ser apenas o texto completo do roteiro otimizado para TTS em formato markdown.
    `;
    const response = await chat.sendMessage({ message: prompt });
    return response.text;
}

export async function generateAudio(articleText: string, articleType: ArticleType): Promise<{ base64: string; blobUrl: string }[]> {
  const words = articleText.split(/\s+/).length;
  // 9 minutes * 150 wpm = 1350 words threshold
  const splitAudio = words > 1350;
  
  const textsToProcess: string[] = [];

  if (splitAudio) {
    const paragraphs = articleText.split('\n\n');
    const midPoint = Math.ceil(paragraphs.length / 2);
    const firstHalf = paragraphs.slice(0, midPoint).join('\n\n');
    const secondHalf = paragraphs.slice(midPoint).join('\n\n');
    textsToProcess.push(firstHalf, secondHalf);
  } else {
    textsToProcess.push(articleText);
  }

  let voiceName = 'Kore'; // Default: Análise (mulher madura)
  switch (articleType) {
    case ArticleType.PAUTA:
      voiceName = 'Puck'; // Jovem dinâmico
      break;
    case ArticleType.DOSSIE:
      voiceName = 'Fenrir'; // Homem mais velho, grave
      break;
  }

  const audioResults = [];
  for (const text of textsToProcess) {
      if (!text) continue;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const decodedPcm = decode(base64Audio);
        const wavBlob = pcmToWav(decodedPcm, 24000, 1, 16);
        const blobUrl = URL.createObjectURL(wavBlob);
        audio