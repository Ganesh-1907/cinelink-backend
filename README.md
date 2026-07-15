# CineLink API Server

Independent Node.js + Express backend for CineLink mobile app.
Replaces the client-side-only architecture with proper server-side logic.

## Setup

```bash
npm install
# Create service-account.json from Firebase Console → Service Accounts
cp .env.example .env  # Edit with your values
npm run dev           # Development (ts-node-dev)
npm run build && npm start  # Production
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| **Payments** | | |
| POST | /api/payments/create-order | Create Razorpay order |
| POST | /api/payments/create-subscription | Create subscription |
| POST | /api/payments/verify-payment | Verify signature |
| POST | /api/payments/save-payment | Save payment record |
| GET | /api/payments/check-duplicate | Check duplicate |
| GET | /api/payments/history | Payment history |
| **Webhooks** | | |
| POST | /api/webhooks/razorpay | Razorpay webhook handler |
| **Users** | | |
| GET | /api/users/profile | Own profile |
| PUT | /api/users/profile | Update profile |
| GET | /api/users/search/query | Search users |
| GET | /api/users/:userId | Public profile |
| POST | /api/users/follow | Follow/unfollow |
| GET | /api/users/:userId/followers | Followers/following |
| **Chat** | | |
| POST | /api/chat/start | Start chat |
| GET | /api/chat/list | Chat list |
| GET | /api/chat/:chatId/messages | Messages |
| POST | /api/chat/:chatId/messages | Send message |
| DELETE | /api/chat/:chatId/messages/:messageId | Unsend |
| **AI** | | |
| POST | /api/ai/scan-audition-poster | Scan poster |
| POST | /api/ai/chat | Chat with AI |
| POST | /api/ai/verify-content | Moderate content |
| **Admin** | | |
| GET | /api/admin/stats | Dashboard stats |
| GET | /api/admin/reports | Reports list |
| PUT | /api/admin/reports/:reportId | Update report |
| GET | /api/admin/users | All users |
| POST | /api/admin/users/:userId/ban | Ban/unban |
| PUT | /api/admin/users/:userId | Update user |
| GET | /api/admin/verification-requests | Verification list |

## Deploy

Deploy as a standalone service on Render, Railway, Fly.io, or any VPS.
Set all env vars in the deployment dashboard. Include service-account.json as a secret file.
# cinelink-backend
