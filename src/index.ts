import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env';
import { connectDB } from './config/db';

import authRoutes from './routes/auth';
import paymentRoutes from './routes/payments';
import userRoutes from './routes/users';
import chatRoutes from './routes/chat';
import aiRoutes from './routes/ai';
import adminRoutes from './routes/admin';
import uploadRoutes from './routes/upload';
import webhookRoutes from './routes/webhooks';
import otpRoutes from './routes/otp';
import notificationRoutes from './routes/notifications';
import tmdbRoutes from './routes/tmdb';
import crewRoutes from './routes/crew';
import premiumRoutes from './routes/premium';
import feedPostsRoutes from './routes/feedPosts';
import connectionsRoutes from './routes/connections';
import savedAuditionsRoutes from './routes/savedAuditions';
import feedbackRoutes from './routes/feedback';
import commentsRoutes from './routes/comments';
import applicationsRoutes from './routes/applications';
import verificationRoutes from './routes/verification';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// ── Socket.IO real-time ──
const onlineUsers = new Map<string, string>(); // userId -> socketId

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId as string;
  if (userId) {
    onlineUsers.set(userId, socket.id);
    io.emit('user:online', { userId, online: true });
  }

  socket.on('chat:join', (chatId: string) => {
    socket.join(`chat:${chatId}`);
  });

  socket.on('chat:leave', (chatId: string) => {
    socket.leave(`chat:${chatId}`);
  });

  socket.on('chat:message', (data: { chatId: string; message: any }) => {
    io.to(`chat:${data.chatId}`).emit('chat:message', data.message);
  });

  socket.on('chat:typing', (data: { chatId: string; userId: string }) => {
    socket.to(`chat:${data.chatId}`).emit('chat:typing', data);
  });

  socket.on('notification', (data: { userId: string; notification: any }) => {
    const targetSocket = onlineUsers.get(data.userId);
    if (targetSocket) {
      io.to(targetSocket).emit('notification', data.notification);
    }
  });

  socket.on('disconnect', () => {
    if (userId) {
      onlineUsers.delete(userId);
      io.emit('user:online', { userId, online: false });
    }
  });
});

app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], allowedHeaders: ['Content-Type', 'Authorization'] }));

// Webhooks must use raw body BEFORE JSON parser
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tmdb', tmdbRoutes);
app.use('/api/crew', crewRoutes);
app.use('/api/premium', premiumRoutes);

import auditionsRoutes from './routes/auditions';
import filmsRoutes from './routes/films';
import contestsRoutes from './routes/contests';
import reelsRoutes from './routes/reels';
import reportsRoutes from './routes/reports';
import projectsRoutes from './routes/projects';
import crewMarketplaceRoutes from './routes/crewMarketplace';
app.use('/api/auditions', auditionsRoutes);
app.use('/api/films', filmsRoutes);
app.use('/api/contests', contestsRoutes);
app.use('/api/reels', reelsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/crew-marketplace', crewMarketplaceRoutes);
app.use('/api/feed-posts', feedPostsRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/saved-auditions', savedAuditionsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/verification', verificationRoutes);
// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), environment: env.nodeEnv });
});

// Error handling
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal error' });
});

// Start
connectDB().then(() => {
  server.listen(env.port, () => {
    console.log('🎬 CineLink API Server running on port', env.port);
    console.log('   Health: http://localhost:' + env.port + '/api/health');
    console.log('   Socket.IO ready');
  });
}).catch(console.error);
