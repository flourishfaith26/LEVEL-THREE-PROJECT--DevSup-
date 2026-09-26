import express from "express";
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';
import userRoutes from './src/routers/userRoutes.js';
import conversationRoutes from './src/routers/conversationRoutes.js';
import messageRoutes from './src/routers/messageRoutes.js';
import { Server } from 'socket.io';
import { setupSocket } from './src/socket/socketHandler.js';
import uploadRoutes from './src/routers/uploadRoutes.js';
import statusRoutes from './src/routers/statusRoutes.js';
import callRoutes from './src/routers/callRoutes.js';

dotenv.config();

connectDB();

const app = express();

// middleware
app.use(cors({ 
    origin: "*" 
}));
app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/calls', callRoutes);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST']
  }
});

setupSocket(io);

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'DevSup backend is running' })
})

httpServer.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`)
})