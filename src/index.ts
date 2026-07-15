import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { getFirebaseApp } from './config/firebase';

getFirebaseApp();
console.log('🔥 Firebase Admin initialized');

const app = express();
app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','PATCH'], allowedHeaders: ['Content-Type','Authorization'] }));

// Webhooks must use raw body BEFORE JSON parser
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
import paymentRoutes from './routes/payments';
import userRoutes from './routes/users';
import chatRoutes from './routes/chat';
import aiRoutes from './routes/ai';
import adminRoutes from './routes/admin';
import uploadRoutes from './routes/upload';
import cloudinaryRoutes from './routes/cloudinary';
import webhookRoutes from './routes/webhooks';
import otpRoutes from './routes/otp';
import notificationRoutes from './routes/notifications';
import tmdbRoutes from './routes/tmdb';
import crewRoutes from './routes/crew';
import premiumRoutes from './routes/premium';
import showreelRoutes from './routes/showreels';
import videocallRoutes from './routes/videocall';
import socialRoutes from './routes/social';

app.use('/api/tmdb', tmdbRoutes);
app.use('/api/crew', crewRoutes);
app.use('/api/premium', premiumRoutes);
app.use('/api/showreels', showreelRoutes);
app.use('/api/videocall', videocallRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/upload', cloudinaryRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString(), environment: env.nodeEnv }));
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => { console.error('Error:', err); res.status(500).json({ error: 'Internal error' }); });

app.listen(env.port, () => {
  console.log('🎬 CineLink API Server running on port', env.port);
  console.log('   Health: http://localhost:' + env.port + '/api/health');
});

export default app;
