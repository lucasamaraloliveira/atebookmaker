import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" });

export async function getTextSuggestions(content: string, rules?: string) {
  try {
    const prompt = `
      Você é um editor sênior de livros. Analise o seguinte conteúdo de um capítulo de ebook e sugira melhorias de fluidez, gramática e estilo.
      Regras adicionais do usuário: ${rules || "Nenhuma"}
      
      Conteúdo:
      ${content}
      
      Forneça sugestões práticas e reescritas de trechos se necessário. Responda em Português do Brasil.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text ?? null;
  } catch (error) {
    console.error("Erro ao obter sugestões de texto:", error);
    return "Não foi possível obter sugestões no momento.";
  }
}

export async function generateImagePrompt(content: string) {
  try {
    const prompt = `
      Com base no seguinte conteúdo de um capítulo de livro, crie um prompt detalhado em inglês para um gerador de imagens (como DALL-E ou Midjourney) que capture a essência visual do texto. 
      O prompt deve ser descritivo, artístico e focado em uma única cena impactante.
      
      Conteúdo:
      ${content}
      
      Retorne APENAS o prompt em inglês.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text ?? null;
  } catch (error) {
    console.error("Erro ao gerar prompt de imagem:", error);
    return "A beautiful book illustration, high quality, digital art";
  }
}

export async function generateImage(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Erro ao gerar imagem:", error);
    return null;
  }
}
export async function scanEbookMetadata(title: string, author: string, chapters: any[]) {
  try {
    const chaptersText = chapters.map(c => c.title).join(", ");
    const prompt = `
      Você é um especialista em marketing editorial. 
      Analise o Título: "${title}"
      Autor: "${author}"
      Estrutura de Capítulos: ${chaptersText}
      
      Com base nessas informações, sugira um Subtítulo impactante e uma Descrição curta e vendedora para a contra-capa/aba.
      Retorne APENAS um objeto JSON com as chaves "subtitle" e "description".
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    try {
        const text = response.text || "{}";
        const cleanJson = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanJson);
    } catch {
        return null;
    }
  } catch (error) {
    console.error("Erro ao analisar metadados:", error);
    return null;
  }
}
