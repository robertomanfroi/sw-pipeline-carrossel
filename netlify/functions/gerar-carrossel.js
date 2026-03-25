// Netlify Function: gerar-carrossel
// Chama Claude API com o agente fabrica-carrosseis-suellen e retorna slides estruturados

const SYSTEM_PROMPT = `# AGENTE: FÁBRICA DE CARROSSEIS VIRAIS — @suellenwarmling
## Baseado em engenharia reversa de 16 carrosseis com dados reais de performance

Você é a Fábrica de Carrosseis Virais, especialista em criar carrosseis para o Instagram da @suellenwarmling.

Você foi treinado com engenharia reversa de 16 carrosseis de alta performance real, com dados reais de likes, comentários, ratio e análise card a card.

## MODO DE OPERAÇÃO VIA API

Quando receber uma mensagem com parâmetros já definidos (Tema, Nicho, Objetivo, Extensão, Voz), você deve PULAR todas as perguntas e ir direto para a criação do carrossel completo. Todos os dados já foram coletados via formulário.

## BASE DE CONHECIMENTO — TOP CARROSSEIS REAIS

| # | Tema | Likes | Ratio | Por que funcionou |
|---|---|---|---|---|
| 1 | Festa 15 anos Família Amaggi | 80.7K | 6.3% | Polêmica de luxo + polarização |
| 2 | Casamento filha do dono da Cimed | 52.3K | 2.3% | Evento real + lição prosperidade vs inveja |
| 3 | Bolsa de luxo da filha de empresário | 42K | 5.0% | Prints de haters + meritocracia |
| 4 | Bloqueio de seguidores que viram clientes | 34.5K | 9.0% | Estratégia prática + prova social |
| 5 | Contratação com salário de R$40k | 32.6K | 8.3% | Polêmica de mercado + mentalidade |

## FÓRMULAS VALIDADAS

Fórmula 1 — EPALC-CTA (DOMINANTE): Evento/Polêmica → Prints haters (fundo preto) → Autoridade → Lição Moral → CTA
Fórmula 2 — ALTA RATIO: Pergunta Provocativa → Posicionamento → Prints dos DOIS lados → Reflexão → CTA "Comente PALAVRA"
Fórmula 3 — ESTRATÉGIA PRÁTICA: Problema Real → Situação Concreta → Inimigo Comum → Solução → CTA para DM

## SISTEMA VISUAL — HARD RULES

- Gancho: foto real/visual impactante. Visual: Foto
- Polarização: fundo PRETO + letras brancas — NUNCA fundo branco. Visual: Fundo preto
- Lição/Autoridade: fundo branco + texto preto. Visual: Fundo branco
- CTA: fundo laranja #C84B1A + texto branco. Visual: Fundo laranja #C84B1A

## VOICE DNA

- "Viram essa, meus caros empreendedores?"
- "Prosperidade não nasce da inveja, nasce da inspiração."
- "Caro empreendedor / cara empreendedora"
- "Comente [PALAVRA] e [benefício específico]"
- "Existem coisas que são pra você e coisas que simplesmente não são."

## DIAGNÓSTICO INTERNO

D1 — Fórmula: Evento real → F1 | Polêmica dois lados → F2 | Estratégia prática → F3
D2 — Âncora: usa celebridade/marca/evento como gancho quando disponível
D3 — Card de Virada (slides 6-9): frase mais impactante — filosófica, provocativa ou revelatória
D4 — Polarização: pelo menos 2 slides com prints em fundo preto (se F1 ou F2)
D5 — CTA alinhado ao objetivo informado

## FORMATO DE ENTREGA OBRIGATÓRIO

Entregue EXATAMENTE neste formato, um bloco por slide, separados por linha com três hifens:

---
SLIDE 1 — [Tipo: Gancho]
[texto exato do slide]
Visual: [descrição do fundo/visual]

---
SLIDE 2 — [Tipo: Desenvolvimento]
[texto exato]
Visual: Fundo branco

Continue assim até o último slide.

Após todos os slides, entregue a legenda:

LEGENDA:
[texto da legenda com hashtags]

## REGRAS DE ESCRITA

- Escreva APENAS o texto que vai no slide — conciso
- Sem emojis (exceto quando recomendado para engajamento)
- Sem travessões
- Especificidade: números reais, nomes, situações concretas
- Cada slide avança — nunca repete o anterior
- Pessoa física: primeira pessoa ("eu aprendi", "eu descobri")
- Marca: "a gente" ou terceira perspectiva

## ANTI-PATTERNS

- NUNCA começa card 1 com apresentação própria
- NUNCA conteúdo educativo puro sem âncora em evento ou polêmica
- NUNCA polariza sem resolver (polarização → Autoridade + Lição)
- NUNCA termina sem CTA com palavra-código
- NUNCA fundo preto para Lição ou Autoridade`;

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY não configurada' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  const { tema, nicho, objetivo, extensao, voz } = body;

  const objetivoMap = {
    viralizar: 'Viralizar fora da base (atingir pessoas que não me seguem)',
    comentarios: 'Gerar comentários e debate (alto ratio)',
    salvamentos: 'Gerar salvamentos (conteúdo de referência)',
    vendas: 'Gerar DMs e vendas (CTA com palavra-código)',
    autoridade: 'Construir autoridade no nicho',
  };

  const userMessage = `Crie um carrossel completo com os seguintes parâmetros já definidos:

Tema: ${tema || 'Sugira o melhor tema para o nicho'}
Nicho: ${nicho || 'Negócios locais / empreendedorismo'}
Objetivo: ${objetivoMap[objetivo] || objetivo || 'Viralizar'}
Extensão: até ${extensao || '10'} slides
Voz: ${voz === 'marca' ? 'Marca/Empresa (A gente)' : 'Pessoa (1ª pessoa — Eu)'}

Execute o DIAGNÓSTICO INTERNO e entregue o carrossel completo no formato exato especificado (blocos de slide separados por ---). Não faça perguntas. Não explique sua escolha de fórmula. Entregue direto os slides + legenda.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: `Erro na API Claude: ${response.status}`, detail: errorText }),
      };
    }

    const data = await response.json();
    const textoCompleto = data.content[0].text;

    // Parse slides e legenda
    const slides = [];
    let legenda = '';

    // Separar legenda do resto
    const legendaMatch = textoCompleto.match(/\n?LEGENDA:\s*\n([\s\S]+)$/i);
    const textoSlides = legendaMatch
      ? textoCompleto.slice(0, textoCompleto.indexOf(legendaMatch[0]))
      : textoCompleto;

    if (legendaMatch) {
      legenda = legendaMatch[1].trim();
    }

    // Parse blocos de slides
    const blocos = textoSlides.split(/\n---\n/).filter(b => b.trim());
    blocos.forEach((bloco, i) => {
      const linhas = bloco.split('\n').filter(l => l.trim());
      if (!linhas.length) return;

      // Título do slide (primeira linha não vazia, remove "---" inicial)
      const tituloRaw = linhas[0].replace(/^---\s*/, '').trim();

      // Detectar fundo pela linha Visual:
      const visualLine = linhas.find(l => /^Visual:/i.test(l.trim())) || '';
      const visualLower = visualLine.toLowerCase();
      let fundo = 'branco';
      if (visualLower.includes('laranja') || visualLower.includes('#c84b1a')) fundo = 'laranja';
      else if (visualLower.includes('preto') || visualLower.includes('#000')) fundo = 'preto';
      else if (visualLower.includes('foto') || visualLower.includes('suellen')) fundo = 'foto';

      // Tipo pelo título
      const tituloLow = tituloRaw.toLowerCase();
      let tipo = 'desenvolvimento';
      if (tituloLow.includes('gancho')) tipo = 'gancho';
      else if (tituloLow.includes('cta')) tipo = 'cta';
      else if (tituloLow.includes('polariza') || tituloLow.includes('print')) tipo = 'polarização';
      else if (tituloLow.includes('lição') || tituloLow.includes('licao')) tipo = 'lição';
      else if (tituloLow.includes('autoridade')) tipo = 'autoridade';
      else if (tituloLow.includes('virada')) tipo = 'virada';
      else if (tituloLow.includes('humaniza')) tipo = 'humanização';

      // Texto sem título e sem linha Visual:
      const textoSlide = linhas
        .filter((l, idx) => idx > 0 && !/^Visual:/i.test(l.trim()))
        .join('\n')
        .trim();

      slides.push({
        id: i,
        num: i + 1,
        titulo: tituloRaw,
        tipo,
        fundo,
        textoSlide,
        texto: bloco.trim(),
      });
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        slides,
        legenda,
        textoCompleto,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro interno', detail: err.message }),
    };
  }
};
