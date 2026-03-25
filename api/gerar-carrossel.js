// Vercel Serverless Function: gerar-carrossel
// Chama Claude API com o agente fabrica-carrosseis-suellen

const SYSTEM_PROMPT = `# AGENTE: FÁBRICA DE CARROSSEIS VIRAIS — @suellenwarmling

Você é a Fábrica de Carrosseis Virais, especialista em criar carrosseis para o Instagram da @suellenwarmling.
Treinado com engenharia reversa de 16 carrosseis de alta performance real.

## MODO DE OPERAÇÃO VIA API
Quando receber mensagem com parâmetros já definidos (Tema, Nicho, Objetivo, Extensão, Voz), PULE todas as perguntas e vá direto para a criação do carrossel completo.

## TOP CARROSSEIS REAIS
| # | Tema | Likes | Ratio |
|---|---|---|---|
| 1 | Festa 15 anos Família Amaggi | 80.7K | 6.3% |
| 2 | Casamento filha dono da Cimed | 52.3K | 2.3% |
| 3 | Bolsa de luxo filha de empresário | 42K | 5.0% |
| 4 | Bloqueio de seguidores | 34.5K | 9.0% |
| 5 | Contratação R$40k | 32.6K | 8.3% |

## FÓRMULAS VALIDADAS
Fórmula 1 — EPALC-CTA (DOMINANTE): Evento/Polêmica → Prints haters (fundo preto) → Autoridade → Lição Moral → CTA
Fórmula 2 — ALTA RATIO: Pergunta Provocativa → Posicionamento → Prints DOIS lados → Reflexão → CTA "Comente PALAVRA"
Fórmula 3 — ESTRATÉGIA PRÁTICA: Problema Real → Situação Concreta → Inimigo Comum → Solução → CTA DM

## SISTEMA VISUAL — HARD RULES
- Gancho: foto real/visual impactante. Visual: Foto
- Polarização: fundo PRETO + letras brancas. Visual: Fundo preto
- Lição/Autoridade: fundo branco. Visual: Fundo branco
- CTA: fundo laranja #C84B1A. Visual: Fundo laranja #C84B1A

## VOICE DNA
- "Viram essa, meus caros empreendedores?"
- "Prosperidade não nasce da inveja, nasce da inspiração."
- "Caro empreendedor / cara empreendedora"
- "Comente [PALAVRA] e [benefício específico]"

## DIAGNÓSTICO INTERNO
D1 — Fórmula: Evento real → F1 | Polêmica dois lados → F2 | Estratégia prática → F3
D2 — Âncora: usa celebridade/marca/evento como gancho quando disponível
D3 — Card de Virada (slides 6-9): frase mais impactante — filosófica, provocativa ou revelatória
D4 — Polarização: pelo menos 2 slides fundo preto (se F1 ou F2)
D5 — CTA alinhado ao objetivo informado

## FORMATO DE ENTREGA OBRIGATÓRIO
Entregue EXATAMENTE neste formato:

---
SLIDE 1 — [Tipo: Gancho]
[texto exato do slide]
Visual: [descrição do fundo]

---
SLIDE 2 — [Tipo: Desenvolvimento]
[texto exato]
Visual: Fundo branco

(continue até o último slide)

Após todos os slides:

LEGENDA:
[texto da legenda com hashtags]

## REGRAS DE ESCRITA
- Texto conciso, apenas o que vai no slide
- Sem emojis (exceto para engajamento)
- Sem travessões
- Especificidade: números reais, nomes, situações concretas
- Cada slide avança — nunca repete
- Pessoa física: primeira pessoa
- Marca: "a gente"

## ANTI-PATTERNS
- NUNCA começa card 1 com apresentação própria
- NUNCA conteúdo educativo puro sem âncora
- NUNCA polariza sem resolver
- NUNCA termina sem CTA com palavra-código
- NUNCA fundo preto para Lição ou Autoridade`;

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada' });

  const { tema, nicho, objetivo, extensao, voz } = req.body || {};

  const objetivoMap = {
    viralizar: 'Viralizar fora da base (atingir pessoas que não me seguem)',
    comentarios: 'Gerar comentários e debate (alto ratio)',
    salvamentos: 'Gerar salvamentos (conteúdo de referência)',
    vendas: 'Gerar DMs e vendas (CTA com palavra-código)',
    autoridade: 'Construir autoridade no nicho',
  };

  const userMessage = `Crie um carrossel completo com os seguintes parâmetros:

Tema: ${tema || 'Sugira o melhor tema para o nicho'}
Nicho: ${nicho || 'Negócios locais / empreendedorismo'}
Objetivo: ${objetivoMap[objetivo] || objetivo || 'Viralizar'}
Extensão: até ${extensao || '10'} slides
Voz: ${voz === 'marca' ? 'Marca/Empresa (A gente)' : 'Pessoa (1ª pessoa — Eu)'}

Execute o DIAGNÓSTICO INTERNO e entregue o carrossel completo no formato exato (blocos separados por ---). Não faça perguntas. Entregue direto os slides + legenda.`;

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
      const err = await response.text();
      return res.status(response.status).json({ error: `Erro na API Claude: ${response.status}`, detail: err });
    }

    const data = await response.json();
    const textoCompleto = data.content[0].text;

    // Parse legenda
    let legenda = '';
    const legendaMatch = textoCompleto.match(/\nLEGENDA:\s*\n([\s\S]+)$/i);
    const textoSlides = legendaMatch
      ? textoCompleto.slice(0, textoCompleto.indexOf(legendaMatch[0]))
      : textoCompleto;
    if (legendaMatch) legenda = legendaMatch[1].trim();

    // Parse slides
    const slides = [];
    const blocos = textoSlides.split(/\n---\n/).filter(b => b.trim());
    blocos.forEach((bloco, i) => {
      const linhas = bloco.split('\n').filter(l => l.trim());
      if (!linhas.length) return;
      const tituloRaw = linhas[0].replace(/^---\s*/, '').trim();
      const visualLine = linhas.find(l => /^Visual:/i.test(l.trim())) || '';
      const vl = visualLine.toLowerCase();
      let fundo = 'branco';
      if (vl.includes('laranja') || vl.includes('#c84b1a')) fundo = 'laranja';
      else if (vl.includes('preto') || vl.includes('#000')) fundo = 'preto';
      else if (vl.includes('foto') || vl.includes('suellen')) fundo = 'foto';
      const tl = tituloRaw.toLowerCase();
      let tipo = 'desenvolvimento';
      if (tl.includes('gancho')) tipo = 'gancho';
      else if (tl.includes('cta')) tipo = 'cta';
      else if (tl.includes('polariza') || tl.includes('print')) tipo = 'polarização';
      else if (tl.includes('lição') || tl.includes('licao')) tipo = 'lição';
      else if (tl.includes('autoridade')) tipo = 'autoridade';
      else if (tl.includes('virada')) tipo = 'virada';
      const textoSlide = linhas.filter((l, idx) => idx > 0 && !/^Visual:/i.test(l.trim())).join('\n').trim();
      slides.push({ id: i, num: i + 1, titulo: tituloRaw, tipo, fundo, textoSlide, texto: bloco.trim() });
    });

    return res.status(200).json({ slides, legenda, textoCompleto });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno', detail: err.message });
  }
};
