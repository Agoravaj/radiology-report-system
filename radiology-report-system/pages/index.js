import React, { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [examType, setExamType] = useState('');
  const [findings, setFindings] = useState('');
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generateReport = async (examType, findings) => {
    const API_URL = 'https://api.anthropic.com/v1/messages';
    const API_KEY = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY; // Make sure to set this in your .env.local file

    if (!API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
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

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate report');
    }

    const data = await response.json();
    return data.content[0].text;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const generatedReport = await generateReport(examType, findings);
      setReport(generatedReport);
    } catch (error) {
      setError(error.message);
    }
    setIsLoading(false);
  };

  return (
    <>
      <Head>
        <title>AI Quick Rad - Advanced Radiology Reporting</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" rel="stylesheet" />
      </Head>
      <div className="main-container">
        <header>
          <h1>AI Quick Rad</h1>
          <p>Advanced Radiology Reporting System</p>
        </header>
        <main>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                id="examType"
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                required
                placeholder=" "
              />
              <label htmlFor="examType">Exam Type</label>
            </div>
            <div className="input-group">
              <textarea
                id="findings"
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                required
                placeholder=" "
              ></textarea>
              <label htmlFor="findings">Findings</label>
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate Report'}
            </button>
          </form>
          {error && <div className="error">{error}</div>}
          {report && (
            <div className="report">
              <h2>Generated Report</h2>
              <pre>{report}</pre>
            </div>
          )}
        </main>
      </div>
      <style jsx global>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #333;
          line-height: 1.6;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem;
        }
        .main-container {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          padding: 2rem;
          width: 100%;
          max-width: 800px;
        }
        header {
          text-align: center;
          margin-bottom: 2rem;
        }
        h1 {
          font-size: 2.5rem;
          color: #4a5568;
          margin-bottom: 0.5rem;
        }
        header p {
          color: #718096;
        }
        form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .input-group {
          position: relative;
        }
        input, textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #cbd5e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }
        textarea {
          min-height: 150px;
          resize: vertical;
        }
        input:focus, textarea:focus {
          outline: none;
          border-color: #4299e1;
        }
        label {
          position: absolute;
          left: 0.75rem;
          top: 0.75rem;
          color: #718096;
          transition: all 0.3s ease;
          pointer-events: none;
        }
        input:focus ~ label, input:not(:placeholder-shown) ~ label,
        textarea:focus ~ label, textarea:not(:placeholder-shown) ~ label {
          top: -0.5rem;
          left: 0.5rem;
          font-size: 0.75rem;
          background-color: white;
          padding: 0 0.25rem;
          color: #4299e1;
        }
        button {
          background-color: #4299e1;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        button:hover {
          background-color: #3182ce;
        }
        button:disabled {
          background-color: #a0aec0;
          cursor: not-allowed;
        }
        .error {
          background-color: #fed7d7;
          border: 1px solid #f56565;
          color: #c53030;
          padding: 0.75rem;
          border-radius: 8px;
          margin-top: 1rem;
        }
        .report {
          margin-top: 2rem;
          background-color: #ebf8ff;
          border: 1px solid #4299e1;
          border-radius: 8px;
          padding: 1rem;
        }
        .report h2 {
          color: #2b6cb0;
          margin-bottom: 0.5rem;
        }
        .report pre {
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        @media (max-width: 600px) {
          body {
            padding: 1rem;
          }
          .main-container {
            padding: 1.5rem;
          }
          h1 {
            font-size: 2rem;
          }
        }
      `}</style>
    </>
  );
}
