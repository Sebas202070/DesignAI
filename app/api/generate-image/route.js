// app/api/generate-image/route.js
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { analysis, redesignPrompt } = await req.json();

    if (!analysis || !redesignPrompt) {
      return NextResponse.json({ message: 'Missing analysis or redesignPrompt in request body.' }, { status: 400 });
    }

    // El prompt de rediseño se recibe ahora directamente desde el frontend
    const sugerenciasDeRediseño = redesignPrompt;

    // 1. Crear un prompt altamente detallado combinando el análisis y las sugerencias
    const prompt = `
      A high-quality, photorealistic interior design photograph.
      Original room details: ${analysis}.
      
      Instructions: ${sugerenciasDeRediseño}.
      
      The new image must maintain the original room's perspective, structure, and overall lighting.
      Do not include any people or pets.
    `;

    // 2. Llamar a la API de OpenAI (DALL-E 3)
    console.log("Generando imagen con DALL-E 3...");
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      style: "natural",
    });
    
    // 3. Obtener la URL de la imagen generada
    const generatedImageUrl = response.data[0].url;

    if (!generatedImageUrl) {
      throw new Error("OpenAI no devolvió una URL de imagen válida.");
    }
    
    return NextResponse.json({ imageUrl: generatedImageUrl }, { status: 200 });

  } catch (error) {
    console.error('Error al generar la imagen con OpenAI:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}