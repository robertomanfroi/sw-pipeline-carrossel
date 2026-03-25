// Vercel Serverless Function: get-pending
// Lê e retorna pedidos pendentes da fila ntfy.sh

const NTFY_TOPIC = process.env.NTFY_TOPIC || 'sw-pipeline-suellen-303338245c4c23b0';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // lastId: ID da última mensagem já processada (deduplicação)
  const lastId = req.query.lastId || null;

  try {
    // Buscar mensagens dos últimos 30 minutos
    const since = Math.floor((Date.now() - 30 * 60 * 1000) / 1000);
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

    // Pegar a mensagem mais recente com payload JSON (inline ou anexo)
    // Iterar do mais recente para o mais antigo
    for (const msg of [...messages].reverse()) {
      // Pular mensagens já processadas (break no ID igual — ntfy retorna em ordem cronológica)
      if (lastId && msg.id === lastId) break;

      // Tentar payload inline no campo message
      if (msg.message) {
        try {
          const payload = JSON.parse(msg.message);
          if (payload.slides && payload.modeloDesignId) {
            return res.status(200).json({ pending: true, ntfyId: msg.id, ...payload });
          }
        } catch {}
      }
      // Tentar payload como anexo (attachment)
      if (msg.attachment && msg.attachment.url) {
        try {
          const attachRes = await fetch(msg.attachment.url);
          if (attachRes.ok) {
            const payload = await attachRes.json();
            if (payload.slides && payload.modeloDesignId) {
              return res.status(200).json({ pending: true, ntfyId: msg.id, ...payload });
            }
          }
        } catch {}
      }
    }

    return res.status(200).json({ pending: false });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno', detail: err.message });
  }
};
