import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { base64Data, mimeType, prompt, model } = req.body || {};
  const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY;

  if (!DOUBAO_API_KEY) {
    return res.status(500).json({ error: 'Server missing DOUBAO_API_KEY environment variable' });
  }

  if (!base64Data || !prompt) {
    return res.status(400).json({ error: 'Missing base64Data or prompt' });
  }

  try {
    // Ark/Volces style endpoint (example from provider docs)
    const payload = {
      model: model || 'doubao-seed-1-8-251228',
      input: [
        {
          role: 'user',
          content: [
            // Try sending base64 inline; provider examples often show image_url but some endpoints accept base64 fields.
            { type: 'input_image', image_base64: base64Data, mime: mimeType },
            { type: 'input_text', text: prompt }
          ]
        }
      ]
    };

    const endpoint = process.env.DOUBAO_API_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/responses';

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DOUBAO_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const text = await resp.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch (e) { data = text; }

    if (!resp.ok) return res.status(resp.status).json({ error: data });

    // Return provider response unmodified so frontend can inspect shape
    return res.status(200).json({ result: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
