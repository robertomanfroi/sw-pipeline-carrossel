// Vercel Serverless Function: montar-canva
// Publica pedido de montagem no ntfy.sh (fila) + notifica usuário via Telegram

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const NTFY_TOPIC = process.env.NTFY_TOPIC || 'sw-pipeline-suellen-303338245c4c23b0';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { slides, legenda, modeloNum, modeloDesignId, nicho } = req.body || {};

  if (!slides || !slides.length) {
    return res.status(400).json({ error: 'Slides não fornecidos' });
  }
  if (!modeloDesignId) {
    return res.status(400).json({ error: 'Modelo Canva não selecionado' });
  }

  // Publicar pedido na fila ntfy.sh
  const payload = {
    slides,
    legenda: legenda || '',
    modeloNum,
    modeloDesignId,
    nicho: nicho || 'negócios locais',
    timestamp: Date.now(),
  };

  try {
    const ntfyRes = await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Title': 'PIPELINE CARROSSEL',
        'Tags': 'art',
      },
      body: JSON.stringify(payload),
    });

    if (!ntfyRes.ok) {
      return res.status(500).json({ error: 'Erro ao publicar na fila', detail: await ntfyRes.text() });
    }

    // Notificar usuário via Telegram que está processando
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: `🎨 Carrossel recebido! Montando no Canva (Modelo ${modeloNum}, ${slides.length} slides)...\n\nVocê receberá o link em instantes.`,
        }),
      }).catch(() => {});
    }

    return res.status(200).json({
      ok: true,
      message: 'Pedido enviado! Você receberá o link do Canva no Telegram em breve.',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno', detail: err.message });
  }
};
