import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN || '';
const TMDB_API_KEY = process.env.TMDB_API_KEY || '';

async function tmdbFetch(endpoint: string): Promise<any> {
  const url = `${TMDB_API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (TMDB_ACCESS_TOKEN) {
    headers['Authorization'] = `Bearer ${TMDB_ACCESS_TOKEN}`;
  } else if (TMDB_API_KEY) {
    headers['Authorization'] = `Bearer ${TMDB_API_KEY}`;
  } else {
    throw new Error('TMDB not configured. Set TMDB_ACCESS_TOKEN or TMDB_API_KEY.');
  }
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status}`);
  }
  return res.json();
}

router.get('/search/:query', async (req: Request, res: Response) => {
  try {
    const data = await tmdbFetch(`/search/movie?query=${encodeURIComponent(req.params.query)}&language=en-IN&page=1`);
    res.json({ results: data.results });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/trending', async (_req: Request, res: Response) => {
  try {
    const data = await tmdbFetch('/trending/movie/week?language=en-IN');
    res.json({ results: data.results });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/movie/:movieId', async (req: Request, res: Response) => {
  try {
    const data = await tmdbFetch(`/movie/${req.params.movieId}?language=en-IN&append_to_response=credits`);
    res.json({ movie: data });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/popular', async (_req: Request, res: Response) => {
  try {
    const data = await tmdbFetch('/movie/popular?language=en-IN&page=1');
    res.json({ results: data.results });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
