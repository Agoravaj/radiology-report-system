import { NextResponse } from 'next/server';

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error('ANTHROPIC_API_KEY is not set');
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { examType, findings } = await req.json();
    if (!examType || !findings) {
      return NextResponse.json({ error: 'Missing examType or findings' }, { status: 400 });
    }

    const systemPrompt = `Você é um radiologista sênior experiente, especializado em gerar laudos radiológicos detalhados e precisos. Seu objetivo é criar um laudo radiológico completo baseado nos achados do exame fornecido. Siga cuidadosamente as instruções abaixo para produzir um laudo profissional e preciso.
    // ... (rest of the system prompt remains the same)
    `;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `<exame>\n${examType}\n</exame>\n\n<achados>\n${findings}\n</achados>\n\nComece seu laudo agora, incorporando todas as instruções fornecidas:` }
        ]
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error from Anthropic API:', data);
      return NextResponse.json({ error: data.error?.message || 'Failed to generate report' }, { status: response.status });
    }

    return NextResponse.json({ report: data.content[0].text }, { status: 200 });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
