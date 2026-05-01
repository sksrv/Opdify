import jwt from 'jsonwebtoken';

export const initSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
      } catch { /* unauthenticated ok for public queue views */ }
    }
    next();
  });

  io.on('connection', (socket) => {
    socket.on('join_doctor', (doctorId) => socket.join(`doctor_${doctorId}`));
    socket.on('join_queue', (doctorId) => socket.join(`queue_${doctorId}`));
    socket.on('join_patient', (userId) => socket.join(`patient_${userId}`));
    socket.on('leave_queue', (doctorId) => socket.leave(`queue_${doctorId}`));
    socket.on('ping', () => socket.emit('pong', { ts: Date.now() }));
    socket.on('disconnect', () => {});
  });

  console.log('✅ Socket.IO initialized');
};
