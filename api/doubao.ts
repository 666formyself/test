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
    // Ark/Volces endpoint expects image_url; upload base64 to a temporary host first.
    const endpoint = process.env.DOUBAO_API_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/responses';

    // Helper: upload binary to transfer.sh (simple anonymous file host) via PUT
    async function uploadToTransfer(filename: string, buffer: Buffer, mime: string) {
      const uploadUrl = `https://transfer.sh/${filename}`;
      const r = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': mime }, body: buffer });
      if (!r.ok) throw new Error(`upload failed: ${r.status} ${await r.text()}`);
      return (await r.text()).trim();
    }

    // convert base64 to buffer
    const imgBuffer = Buffer.from(base64Data, 'base64');
    const ext = mimeType && mimeType.split('/')[1] ? mimeType.split('/')[1].split('+')[0] : 'png';
    const filename = `upload-${Date.now()}.${ext}`;

    let imageUrl: string;
    try {
      imageUrl = await uploadToTransfer(filename, imgBuffer, mimeType || 'application/octet-stream');
    } catch (e: any) {
      return res.status(502).json({ error: `Image upload failed: ${e?.message || String(e)}` });
    }

    const payload = {
      model: model || 'doubao-seed-1-8-251228',
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_image', image_url: imageUrl },
            { type: 'input_text', text: prompt }
          ]
        }
      ]
    };

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
