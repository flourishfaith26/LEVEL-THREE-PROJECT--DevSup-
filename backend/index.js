import express from "express";
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { connectDB } from './src/config/db.js';
import authRoutes from './src/routers/authRoutes.js';
import userRoutes from './src/routers/userRoutes.js';
import conversationRoutes from './src/routers/conversationRoutes.js';
import messageRoutes from './src/routers/messageRoutes.js';
import { Server } from 'socket.io';
import { setupSocket } from './src/socket/socketHandler.js';
import uploadRoutes from './src/routers/uploadRoutes.js';
import statusRoutes from './src/routers/statusRoutes.js';
import callRoutes from './src/routers/callRoutes.js';
import callConfigRoutes from './src/routers/callConfigRoutes.js';

connectDB();

const app = express();

const allowedOrigins = [
  'https://devsupchat.com',
  'https://www.devsupchat.com',
  'https://frontend-tjte.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, health checks)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.devsupchat.com') ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/call-config', callConfigRoutes);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: corsOptions
});

app.set('io', io);

setupSocket(io);

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'DevSup backend is running' })
})

httpServer.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`)
})