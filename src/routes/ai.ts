import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { env } from '../config/env';

const router = Router();
router.use(authMiddleware);

router.post('/scan-audition-poster', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'Image data required' });
    if (!env.gemini.apiKey) return res.status(503).json({ error: 'Gemini key not configured' });

    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=' + env.gemini.apiKey, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
          { text: 'You are analyzing an Indian cinema audition poster. Extract ALL visible info and return ONLY a valid JSON with these keys: {"title":"","role":"","location":"","lastDate":"","description":"","requirements":"","contactInfo":"","gender":"","ageRange":"","language":""} No markdown, no code blocks. Only JSON.' },
        ]}],
        generationConfig: { temperature: 0.1, maxOutputTokens: 500 },
      }),
    });
    const data: any = await r.json();
    if (!r.ok) return res.status(502).json({ error: data?.error?.message || 'API Error' });
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) return res.status(502).json({ error: 'Empty response' });
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    let parsed: any;
    try { parsed = JSON.parse(cleaned); } catch { return res.status(502).json({ error: 'Parse failed' }); }
    res.json({ success: true, form: {
      title: String(parsed.title||''), role: String(parsed.role||''), location: String(parsed.location||''),
      lastDate: String(parsed.lastDate||''), description: String(parsed.description||''),
      requirements: String(parsed.requirements||''), contactInfo: String(parsed.contactInfo||''),
      gender: String(parsed.gender||''), ageRange: String(parsed.ageRange||''), language: String(parsed.language||''),
    }});
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    if (!env.gemini.apiKey) return res.status(503).json({ error: 'Gemini key not configured' });

    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=' + env.gemini.apiKey, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: 'You are CineLink AI assistant for Indian cinema professionals.' }] },
          ...history.map((h: any) => ({ role: h.role, parts: [{ text: h.text }] })),
          { role: 'user', parts: [{ text: message }] },
        ],
      }),
    });
    const data: any = await r.json();
    if (!r.ok) return res.status(502).json({ error: data?.error?.message || 'API Error' });
    res.json({ success: true, reply: data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Could not process.' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/verify-content', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });
    if (!env.gemini.apiKey) {
      const blocked = ['scam','fraud','fake casting','send money','pay first','casting couch'];
      const found = blocked.find(w => text.toLowerCase().includes(w));
      return res.json({ blocked: !!found, reason: found ? 'Contains: '+found : '' });
    }
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=' + env.gemini.apiKey, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Analyze for policy violations. Return JSON: {"blocked":boolean,"reason":"","categories":[]} Violations: scam, fraud, fake casting, explicit, hate. Text: "'+text+'"' }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 200 } }),
    });
    const data: any = await r.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleaned = reply.replace(/```json/g,'').replace(/```/g,'').trim();
    let result = { blocked: false, reason: '' };
    try { result = JSON.parse(cleaned); } catch { const blocked = ['scam','fraud','fake casting','send money']; const found = blocked.find(w=>text.toLowerCase().includes(w)); result = { blocked: !!found, reason: found ? 'Contains: '+found : '' }; }
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
