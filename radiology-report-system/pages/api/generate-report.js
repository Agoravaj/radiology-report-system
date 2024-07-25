import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY is not set in the environment variables');
}

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set' });
  }

  try {
    const { examType, findings, task } = req.body; 

    if (!findings || !task) { 
      return res.status(400).json({ error: 'Missing findings or task' });
    }

    const buildPrompt = (task, examType, findings) => {
      let prompt = '';
      switch (task) {
        case 'rad-gen':
          prompt = `Você é um radiologista sênior altamente experiente chamado laudAI. Seu objetivo é gerar um laudo radiológico completo e detalhado com base no tipo de exame e nos achados fornecidos. Siga estas instruções cuidadosamente:

Estruture seu laudo da seguinte forma:

1. Título: Reafirme o tipo de exame em maiúsculas, por exemplo, "RESSONÂNCIA MAGNÉTICA DO OMBRO DIREITO". Não inclua informações sobre contraste no título.

2. Técnica: Descreva brevemente a técnica utilizada, incluindo o uso de contraste e sequências de imagem adquiridas, quando relevante.

3. Análise: Descreva detalhadamente os achados de imagem relevantes:
   - Liste primeiro os achados positivos, um por linha, a menos que estejam intimamente relacionados à mesma estrutura.
   - Use terminologia radiológica precisa e medidas.
   - Refine descrições vagas para serem mais profissionais e precisas.
   - Descreva todos os achados negativos relevantes, mas de forma mais concisa.
   - Para lesões, descreva realce, conteúdo e sinal na RM.
   - Não comece frases com "Presença de..." ou "Observa-se...". Descreva diretamente o órgão ou estrutura.
   - Integre perfeitamente os achados descritos pelo usuário com seu conhecimento radiológico.
   - Não especule além dos dados fornecidos.

4. Impressão: Resuma os achados positivos mais importantes:
   - Liste em ordem de importância, com achados relacionados na mesma linha quando possível.
   - Comece cada linha com um traço (-) e um espaço.
   - Não cite medidas nesta seção.

Diretrizes gerais:
- Use português brasileiro com acentuação e gramática perfeitas.
- Utilize vocabulário radiológico preciso e especializado.
- Seja objetivo e conciso, evitando informações desnecessárias ou repetitivas.
- Organize as informações de forma lógica e estruturada.
- Seja claro ao expressar o nível de certeza dos achados.
- Não pule linhas entre frases na seção Análise.
- Use "à custa de" em vez de "às custas".

Instruções especiais:
- Quando necessário incluir medidas, escreva-as entre ⚠️, por exemplo: Massa no (...) medindo cerca de ⚠️ 10 cm ⚠️ (...) .
- Não inclua medidas para estruturas normais ou insignificantes.
- Não adicione achados não relacionados aos descritos pelo usuário.

Formato final:
Escreva o laudo completo, incorporando todas as instruções acima. Não use tags XML no laudo final. Concentre-se em detalhar os achados positivos relatados pelo usuário, sendo mais breve nos achados negativos. Produza um laudo completo, preciso e profissional, seguindo os padrões dos melhores radiologistas mundiais.
. 
ATENCAO! CASO USUARIO ENVIAR LAUDO COMPLETO ACOMPANHADO SEGUINTE FAVOR EXATAMENTE MESMA FORMATAÇÃO, ESTRUTURA LAUDO VOCABULÁRIO DEVERA ENCAIXAR ACHADOS SEGUINDO MESMO PADRAO LAUDO ENVIOU! DEVERA CONSTANTE ESTAVEL. PRESTE ATENCAO!

SIM! TERAO ~INUMEROS erros de digitação ou abreviações não padronizadas nos achados fornecidos - mas SEMPRE INTERP[RETARA E INFERIRA E RESPONDERA DA MELHOR FORMA POSSIVEL.
Comece seu laudo agora, incorporando todas as instruções fornecidas: ${findings} / ${examType}`;
          break;

        case 'impressions':
          prompt = `Você é um radiologista sênior chamado LaudAI. Forneça uma seção de Impressão concisa com base nestes achados de um(a) ${examType}: ${findings}`;
          break;

        case 'smart-text':
          prompt = `Você é um radiologista sênior chamado LaudAI. Corrija a gramática e ortografia do texto a seguir, utilizando terminologia radiológica precisa, para que fique profissional e adequado para um laudo médico: ${findings}`;
          break;
        default:
          throw new Error(`Invalid task: ${task}`);
      }
      return prompt;
    };

    const finalPrompt = buildPrompt(task, examType, findings);

    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          "role": "user",
          "content": [
            {
              "type": "text",
              "text": finalPrompt
            }
          ]
        }
      ]
    });

    return res.status(200).json({ result: msg.content[0].text }); 
  } catch (error) {
    console.error('Error processing request:', error);
    if (error instanceof Anthropic.APIError) {
      return res.status(error.status || 500).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
