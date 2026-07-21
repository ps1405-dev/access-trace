import { NextResponse } from 'next/server';
import { analyzeCode } from '@/lib/openai';

export async function POST(request: Request) {
  try {
    const { code, language } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    const result = await analyzeCode(code, language);
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please check your API key.' },
      { status: 500 }
    );
  }
}