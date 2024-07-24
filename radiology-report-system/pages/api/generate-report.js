import { NextResponse } from 'next/server';

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error('ANTHROPIC_API_KEY is not set');
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  try {
    const { examType, findings } = await req.json();

    if (!examType || !findings) {
      return NextResponse.json({ error: 'Missing examType or findings' }, { status: 400 });
    }

    if (!API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not set' }, { status: 500 });
    }

    const systemPrompt = `Você é um radiologista sênior experiente, especializado em gerar laudos radiológicos detalhados e precisos. Seu objetivo é criar um laudo radiológico completo baseado nos achados do exame fornecido. Siga cuidadosamente as instruções abaixo para produzir um laudo profissional e preciso.

    Diretrizes gerais para a elaboração do laudo:

    1. Use terminologia radiológica precisa e medidas quando apropriado.
    2. Seja objetivo e conciso, evitando informações desnecessárias.
    3. Organize as informações de forma lógica e estruturada.
    4. Seja claro e demonstre certeza nos achados relatados.
    5. Não pule linhas entre frases.
    6. Use português brasileiro com acentuação e gramática corretas.
    7. Utilize vocabulário radiológico preciso e especializado.

    Instruções específicas para as seções do laudo:

    a. Reafirmação do exame:
       - Reafirme o tipo de exame realizado.
       - Mencione que não foi utilizado contraste.

    b. Descrição da técnica:
       - Descreva brevemente a técnica utilizada.
       - Mencione as sequências de imagem realizadas.

    c. Achados relevantes nas imagens:
       - Liste os achados positivos, um por linha, por estrutura ou órgão.
       - Use terminologia radiológica apropriada e inclua medidas quando relevantes.
       - Refine as descrições para maior precisão.
       - Mencione achados negativos importantes, se houver.
       - Para lesões, descreva o conteúdo e o sinal em RM, se aplicável.
       - Avalie cada órgão ou estrutura relevante.
       - Integre os achados com seu conhecimento radiológico.
       - Não especule além dos dados fornecidos.

    d. Resumo dos achados positivos importantes:
       - Agrupe achados relacionados na mesma linha.
       - Comece cada linha com um traço seguido de espaço.
       - Não cite medidas nesta seção.

    Instruções especiais:
    - Inclua medidas apenas para estruturas anormais maiores que 10 cm.
    - Não inclua medidas de estruturas normais ou achados insignificantes.
    - Não adicione achados não relacionados ou especulações.

    Formato final:
    Escreva o laudo completo seguindo todas as instruções acima. Não use tags XML no laudo final. Detalhe os achados positivos, mas seja breve nos achados negativos. Produza um laudo completo, preciso e profissional, adequado para uso clínico.`;

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