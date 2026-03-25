// Vercel Serverless Function: get-pending
// Lê e retorna pedidos pendentes da fila ntfy.sh

const NTFY_TOPIC = process.env.NTFY_TOPIC || 'sw-pipeline-suellen-303338245c4c23b0';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Buscar mensagens dos últimos 3 minutos
    const since = Math.floor((Date.now() - 3 * 60 * 1000) / 1000);
    const ntfyRes = await fetch(`https://ntfy.sh/${NTFY_TOPIC}/json?poll=1&since=${since}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!ntfyRes.ok) {
      return res.status(500).json({ error: 'Erro ao ler fila' });
    }

    const text = await ntfyRes.text();
    if (!text.trim()) {
      return res.status(200).json({ pending: false });
    }

    // ntfy retorna um JSON por linha (NDJSON)
    const lines = text.trim().split('\n').filter(Boolean);
    const messages = lines.map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);

    // Pegar a mensagem mais recente com payload JSON
    for (const msg of messages.reverse()) {
      if (msg.message) {
        try {
          const payload = JSON.parse(msg.message);
          if (payload.slides && payload.modeloDesignId) {
            return res.status(200).json({ pending: true, ...payload });
          }
        } catch {}
      }
    }

    return res.status(200).json({ pending: false });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno', detail: err.message });
  }
};
