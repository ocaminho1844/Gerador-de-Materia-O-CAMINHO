import { GoogleGenAI, Chat, GenerateContentResponse, Modality } from "@google/genai";
import { ArticleType, GeneratedImage } from "../types";
import { ARTICLE_CONFIG, YOUTUBE_CAPTION_CTA } from "../constants";
import { decode, pcmToWav } from "../utils/audioUtils";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

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
        audioResults.push({ base64: base64Audio, blobUrl });
      }
  }
  return audioResults;
}


export async function generateImages(chat: Chat): Promise<GeneratedImage[]> {
    const imageIdeasPrompt = `
      ETAPA 3: Geração de Imagens.
      Com base no artigo que acabamos de escrever, gere 3 conceitos de prompt distintos e criativos para imagens de capa. Os prompts devem ser detalhados e adequados para um gerador de imagens de IA, capturando a essência analítica e teológica do artigo.
      
      Responda APENAS com uma lista JSON de 3 strings. Exemplo: ["prompt 1", "prompt 2", "prompt 3"]
    `;
    const ideasResponse = await chat.sendMessage({ message: imageIdeasPrompt });
    let imagePrompts: string[] = [];
    try {
        const cleanedText = ideasResponse.text.replace(/```json|```/g, '').trim();
        imagePrompts = JSON.parse(cleanedText);
    } catch (e) {
        console.error("Failed to parse image prompts JSON:", e);
        return [];
    }

    const generatedImages: GeneratedImage[] = [];
    let id = 0;
    for (const prompt of imagePrompts) {
        try {
            const [resp16x9, resp9x16] = await Promise.all([
                ai.models.generateImages({ model: 'imagen-4.0-generate-001', prompt, config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' } }),
                ai.models.generateImages({ model: 'imagen-4.0-generate-001', prompt, config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '9:16' } }),
            ]);

            const src16x9 = `data:image/jpeg;base64,${resp16x9.generatedImages[0].image.imageBytes}`;
            const src9x16 = `data:image/jpeg;base64,${resp9x16.generatedImages[0].image.imageBytes}`;

            generatedImages.push({ id: id++, prompt, src16x9, src9x16 });
        } catch (error) {
            console.error(`Failed to generate images for prompt: "${prompt}"`, error);
        }
    }
    return generatedImages;
}

export async function generateTitles(chat: Chat, suggestions: string): Promise<string[]> {
    const suggestionText = suggestions ? `O usuário sugeriu as seguintes alterações para os títulos: "${suggestions}". Por favor, incorpore este feedback nas novas opções.` : '';
    const prompt = `
        ETAPA 4: Geração de Títulos.
        Com base no artigo, gere 3 opções de títulos criativos e virais.
        Cada opção deve seguir ESTRITAMENTE o formato: Título (máx 100 caracteres) | Subtítulo | #hashtag1 #hashtag2 #hashtag3
        
        ${suggestionText}
        
        Responda APENAS com uma lista JSON de 3 strings, cada uma contendo um título completo no formato especificado.
        Exemplo: ["Título 1 | Subtítulo 1 | #tagA #tagB", "Título 2 | Subtítulo 2 | #tagC #tagD"]
    `;
    const response = await chat.sendMessage({ message: prompt });
    try {
        const cleanedText = response.text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanedText);
    } catch (e) {
        console.error("Failed to parse titles JSON:", e);
        return [];
    }
}

export async function generateCaption(chat: Chat, title: string, suggestions: string): Promise<string> {
    const suggestionText = suggestions ? `O usuário sugeriu as seguintes alterações para a legenda: "${suggestions}". Por favor, incorpore este feedback na nova legenda.` : '';
    const prompt = `
        ETAPA 5: Geração de Legenda para YouTube.
        Com base no artigo e no título aprovado, gere uma legenda para o YouTube.
        A legenda deve ter:
        1. Uma indagação de início para prender a atenção.
        2. Uma breve descrição do que será abordado no vídeo.
        3. Uma pergunta para engajar os espectadores nos comentários.
        4. O bloco de call-to-action EXATAMENTE como fornecido abaixo.
        
        Título Aprovado: "${title}"
        ${suggestionText}

        Bloco Call-to-Action (obrigatório no final):
        ---
        ${YOUTUBE_CAPTION_CTA}
        ---
        Responda APENAS com o texto completo da legenda.
    `;
    const response = await chat.sendMessage({ message: prompt });
    return response.text;
}