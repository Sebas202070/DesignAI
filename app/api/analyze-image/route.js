// app/api/analyze-image/route.js
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ message: 'Missing imageBase64 in request body.' }, { status: 400 });
    }

    const prompt = "Describe esta imagen en un texto conciso y objetivo, identificando los elementos clave, estilo, colores, iluminación y perspectiva. El texto servirá como base para un rediseño de interior.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageBase64, detail: "high" } },
          ],
        },
      ],
      max_tokens: 300,
    });

    const analysis = response.choices[0].message.content;
    
    return NextResponse.json({ analysis }, { status: 200 });

  } catch (error) {
    console.error('Error al analizar la imagen:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}