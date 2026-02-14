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

    // Helper: upload binary to transfer.sh (anonymous) via PUT; if fails, fallback to 0x0.st via multipart POST
    async function uploadToTransferOr0x0(filename: string, buffer: Buffer, mime: string) {
      const errors: string[] = [];

      // Attempt transfer.sh first
      try {
        const uploadUrl = `https://transfer.sh/${filename}`;
        const r = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': mime }, body: buffer });
        if (r.ok) return (await r.text()).trim();
        const txt = await r.text();
        errors.push(`transfer.sh: ${r.status} ${txt}`);
      } catch (e: any) {
        errors.push(`transfer.sh: ${e?.message || String(e)}`);
      }

      // Fallback: 0x0.st (multipart form)
      try {
        // Build FormData using Web API (Node 18+ supports Blob/FormData)
        const form = new FormData();
        // create Blob from buffer
        const blob = new Blob([buffer], { type: mime });
        // @ts-ignore append supports (name, blob, filename)
        form.append('file', blob, filename);

        const r2 = await fetch('https://0x0.st', { method: 'POST', body: form });
        if (r2.ok) return (await r2.text()).trim();
        const txt2 = await r2.text();
        errors.push(`0x0.st: ${r2.status} ${txt2}`);
      } catch (e: any) {
        errors.push(`0x0.st: ${e?.message || String(e)}`);
      }

      throw new Error(errors.join(' | '));
    }

    // convert base64 to buffer
    const imgBuffer = Buffer.from(base64Data, 'base64');
    const ext = mimeType && mimeType.split('/')[1] ? mimeType.split('/')[1].split('+')[0] : 'png';
    const filename = `upload-${Date.now()}.${ext}`;

    let imageUrl: string;
    try {
      imageUrl = await uploadToTransferOr0x0(filename, imgBuffer, mimeType || 'application/octet-stream');
    } catch (e: any) {
      console.error('image upload errors:', e);
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
