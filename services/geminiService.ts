import { GoogleGenAI } from "@google/genai";
import { ImageResolution } from '../types';

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a team logo or banner using Gemini 3 Pro Image Preview.
 * Allows specifying resolution.
 */
export const generateTeamImage = async (
  prompt: string,
  resolution: ImageResolution
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
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
          imageSize: resolution, 
        },
      },
    });

    // Extract image from response
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          return `data:image/png;base64,${base64EncodeString}`;
        }
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

/**
 * Edits an uploaded image using text prompts with Gemini 2.5 Flash Image.
 * Ideal for "adding a retro filter" or "removing background elements".
 */
export const editMatchPhoto = async (
  base64Image: string,
  editPrompt: string
): Promise<string> => {
  try {
    // Strip header if present to get raw base64
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/png', // Assuming PNG or standard format
            },
          },
          {
            text: editPrompt,
          },
        ],
      },
      // Nano banana models do not support imageSize or strict schema, so we stick to defaults
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          return `data:image/png;base64,${base64EncodeString}`;
        }
      }
    }
    throw new Error("No edited image returned");
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};