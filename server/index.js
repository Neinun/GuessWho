const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

// Serve the assets directory statically
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Serve the built React frontend for production / Render
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// State management
// rooms = { [roomId]: { players: { [socketId]: { name, selectedCharacter: null, ready: false } }, turn: socketId, state: 'waiting|playing|gameover' } }
const rooms = {};

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('createRoom', ({ playerName }) => {
    const cleanName = (typeof playerName === 'string' ? playerName.trim().slice(0, 24) : '') || 'Player 1';
    const roomId = generateRoomCode();
    rooms[roomId] = {
      players: {
        [socket.id]: {
          name: cleanName,
          selectedCharacter: null,
          ready: false
        }
      },
      turn: null,
      state: 'waiting'
    };
    
    socket.join(roomId);
    socket.emit('roomCreated', { roomId });
    io.to(roomId).emit('roomUpdate', rooms[roomId]);
    console.log(`${cleanName} created room ${roomId}`);
  });

  socket.on('joinRoom', ({ roomId, playerName }) => {
    const cleanRoomId = typeof roomId === 'string' ? roomId.trim().toUpperCase() : '';
    const cleanName = (typeof playerName === 'string' ? playerName.trim().slice(0, 24) : '') || 'Player 2';
    const room = rooms[cleanRoomId];
    if (room && Object.keys(room.players).length < 2 && room.state === 'waiting') {
      room.players[socket.id] = {
        name: cleanName,
        selectedCharacter: null,
        ready: false
      };
      
      socket.join(cleanRoomId);
      socket.emit('roomJoined', { roomId: cleanRoomId });
      io.to(cleanRoomId).emit('roomUpdate', room);
      console.log(`${cleanName} joined room ${cleanRoomId}`);
    } else {
      socket.emit('error', 'Room not found or full');
    }
  });

  socket.on('selectCharacter', ({ roomId, characterId }) => {
    const cleanRoomId = typeof roomId === 'string' ? roomId.trim().toUpperCase() : '';
    const cleanCharId = Number(characterId);
    const room = rooms[cleanRoomId];
    if (room && room.state === 'waiting' && room.players[socket.id] && !room.players[socket.id].ready && cleanCharId) {
      room.players[socket.id].selectedCharacter = cleanCharId;
      room.players[socket.id].ready = true;
      console.log(`[selectCharacter] ${room.players[socket.id].name} selected character ${cleanCharId}`);
      
      const playerIds = Object.keys(room.players);
      const allReady = playerIds.length === 2 && playerIds.every(id => room.players[id].ready);
      
      if (allReady) {
        room.state = 'playing';
        // Randomly select who goes first only once at game start
        room.turn = playerIds[Math.floor(Math.random() * playerIds.length)];
        console.log(`[gameStarted] Room ${cleanRoomId} started! First turn: ${room.players[room.turn]?.name} (${room.turn})`);
        io.to(cleanRoomId).emit('gameStarted', { turn: room.turn });
      }
      io.to(cleanRoomId).emit('roomUpdate', room);
    }
  });

  socket.on('sendMessage', ({ roomId, message }) => {
    const cleanRoomId = typeof roomId === 'string' ? roomId.trim().toUpperCase() : '';
    const cleanMessage = typeof message === 'string' ? message.trim().slice(0, 300) : '';
    if (!cleanMessage) return;

    const room = rooms[cleanRoomId];
    if (room && room.players[socket.id]) {
      io.to(cleanRoomId).emit('receiveMessage', {
        senderId: socket.id,
        senderName: room.players[socket.id]?.name || 'Player',
        text: cleanMessage,
        timestamp: new Date()
      });
    }
  });
  
  socket.on('endTurn', ({ roomId }) => {
    const cleanRoomId = typeof roomId === 'string' ? roomId.trim().toUpperCase() : '';
    const room = rooms[cleanRoomId];
    if (room && room.state === 'playing' && room.turn === socket.id) {
      const playerIds = Object.keys(room.players);
      room.turn = playerIds.find(id => id !== socket.id);
      io.to(cleanRoomId).emit('turnChanged', { turn: room.turn });
      io.to(cleanRoomId).emit('roomUpdate', room);
    }
  });

  socket.on('makeGuess', ({ roomId, characterId }) => {
    const cleanRoomId = typeof roomId === 'string' ? roomId.trim().toUpperCase() : '';
    const cleanCharId = Number(characterId);
    const room = rooms[cleanRoomId];
    if (!room || room.state !== 'playing' || !cleanCharId) {
      console.log(`[makeGuess REJECTED] Room ${cleanRoomId} not playing or invalid character.`);
      return;
    }

    if (room.turn !== socket.id) {
      console.log(`[makeGuess REJECTED] Not ${socket.id}'s turn. Current turn: ${room.turn}`);
      socket.emit('error', "It's not your turn!");
      return;
    }

    const opponentId = Object.keys(room.players).find(id => id !== socket.id);
    const opponentCharacter = room.players[opponentId]?.selectedCharacter;
    const guesserName = room.players[socket.id]?.name || 'Player';
    const isCorrect = cleanCharId === Number(opponentCharacter);
    
    console.log(`[makeGuess] ${guesserName} guessed ${cleanCharId}. Correct: ${isCorrect}`);

    if (isCorrect) {
      room.state = 'gameover';
      io.to(cleanRoomId).emit('gameOver', {
        winnerId: socket.id,
        correctCharacter: opponentCharacter,
        guesserId: socket.id,
        guessedCharacter: cleanCharId
      });
    } else {
      // Incorrect guess: turn passes to opponent
      room.turn = opponentId;
      console.log(`[turnChanged] Turn passed to ${room.players[opponentId]?.name} (${opponentId})`);
      
      socket.emit('guessResult', { correct: false, characterId: cleanCharId });
      io.to(cleanRoomId).emit('turnChanged', { turn: room.turn });
      io.to(cleanRoomId).emit('roomUpdate', room);
      
      // System message
      io.to(cleanRoomId).emit('receiveMessage', {
        senderId: 'system',
        senderName: 'System',
        text: `${guesserName} guessed incorrectly. Turn passed to ${room.players[opponentId]?.name}!`,
        timestamp: new Date()
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Clean up rooms
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (room.players[socket.id]) {
        delete room.players[socket.id];
        if (Object.keys(room.players).length === 0) {
          delete rooms[roomId];
        } else {
          room.state = 'waiting';
          io.to(roomId).emit('playerLeft');
          io.to(roomId).emit('roomUpdate', room);
        }
      }
    }
  });
});

// Fallback to index.html for single-page app routing (Express 5 compatible)
app.use((req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }
  if (req.path.startsWith('/assets')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('Guess Who Server is running. Frontend build not found.');
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
