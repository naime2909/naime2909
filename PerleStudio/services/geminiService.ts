import { GoogleGenAI, Type } from "@google/genai";
import { AIResponseSchema } from '../types';

export const generateBeadPalette = async (theme: string): Promise<AIResponseSchema | null> => {
  if (!process.env.API_KEY) {
    console.error("API Key is missing");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Génère une palette de couleurs de perles pour bracelet basée sur le thème : "${theme}". Donne 5 à 8 couleurs cohérentes.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            paletteName: { type: Type.STRING },
            description: { type: Type.STRING },
            colors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Nom créatif de la couleur en français" },
                  hex: { type: Type.STRING, description: "Code hexadécimal de la couleur" },
                  suggestion: { type: Type.STRING, description: "Type de perle suggéré (Mat, Brillant, Cristal, Bois, Métal)" }
                },
                required: ["name", "hex", "suggestion"]
              }
            }
          },
          required: ["paletteName", "description", "colors"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as AIResponseSchema;

  } catch (error) {
    console.error("Erreur lors de la génération de la palette:", error);
    return null;
  }
};
