import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

router.post('/scan-audition-poster', async (req: AuthRequest, res: Response) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'Image required' });
    if (!GEMINI_API_KEY) return res.status(503).json({ error: 'AI not configured' });
    
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: 'Extract audition details as JSON: title, role, location, lastDate, description, requirements, contactInfo, gender, ageRange, language' },
            { inline_data: { mime_type: mimeType || 'image/jpeg', data: imageBase64 } },
          ],
        }],
      }),
    });
    const data: any = await response.json();
    res.json({ data: data?.candidates?.[0]?.content?.parts?.[0]?.text || '' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/chat', async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    if (!GEMINI_API_KEY) return res.status(503).json({ error: 'AI not configured' });
    
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `You are a CineLink AI assistant for Indian cinema.\n\nUser: ${message}` }],
        }],
      }),
    });
    const data: any = await response.json();
    res.json({ reply: data?.candidates?.[0]?.content?.parts?.[0]?.text || '' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/verify-content', async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });
    const blockedWords = ['scam', 'fraud', 'fake casting', 'send money', 'pay first', 'casting couch'];
    const blocked = blockedWords.some(w => text.toLowerCase().includes(w));
    res.json({ blocked, reason: blocked ? 'Blocked by filter' : 'Content approved' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
