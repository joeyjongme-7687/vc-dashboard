import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const aiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!aiApiKey || aiApiKey === "your_api_key_here") {
      return NextResponse.json(
        { error: "API key is missing in server environment" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { modelName, prompt } = body;

    const genAI = new GoogleGenerativeAI(aiApiKey);
    const model = genAI.getGenerativeModel({ model: modelName || 'gemini-1.5-pro' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid AI format returned");
    }

    return NextResponse.json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    console.error("AI Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate insights" },
      { status: 500 }
    );
  }
}
