import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN || '';
const TMDB_API_BASE = 'https://api.themoviedb.org/3';

async function tmdbFetch(endpoint: string): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (TMDB_ACCESS_TOKEN) headers['Authorization'] = `Bearer ${TMDB_ACCESS_TOKEN}`;
  const res = await fetch(`${TMDB_API_BASE}${endpoint}`, { headers });
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

router.get('/search/:query', async (req: AuthRequest, res: Response) => {
  try {
    const data = await tmdbFetch(`/search/movie?query=${encodeURIComponent(req.params.query)}&language=en-IN`);
    res.json({ results: data.results });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/trending', async (_req: AuthRequest, res: Response) => {
  try {
    const data = await tmdbFetch('/trending/movie/week?language=en-IN');
    res.json({ results: data.results });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/movie/:movieId', async (req: AuthRequest, res: Response) => {
  try {
    const data = await tmdbFetch(`/movie/${req.params.movieId}?language=en-IN&append_to_response=credits`);
    res.json({ movie: data });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
