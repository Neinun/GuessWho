import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Lobby from './components/Lobby';
import Game from './components/Game';

// In Vite development (port 5173), connect to localhost:3001. In production (Render), connect to same origin
const SOCKET_SERVER_URL = window.location.port === '5173' ? 'http://localhost:3001' : '';
const socket = io(SOCKET_SERVER_URL);

function App() {
  const [gameState, setGameState] = useState('lobby'); // 'lobby', 'room', 'playing', 'gameover'
  const [roomData, setRoomData] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [gameOverData, setGameOverData] = useState(null);

  useEffect(() => {
    socket.on('roomCreated', ({ roomId }) => {
      setRoomId(roomId);
      setGameState('room');
    });

    socket.on('roomJoined', ({ roomId }) => {
      setRoomId(roomId);
      setGameState('room');
    });

    socket.on('roomUpdate', (room) => {
      setRoomData(room);
      if (room.state === 'playing') {
        setGameState('playing');
      } else if (room.state === 'waiting') {
        setGameState('room');
      }
    });

    socket.on('gameStarted', ({ turn }) => {
      setGameState('playing');
      setRoomData(prev => prev ? { ...prev, turn, state: 'playing' } : prev);
    });

    socket.on('turnChanged', ({ turn }) => {
      setRoomData(prev => prev ? { ...prev, turn } : prev);
    });

    socket.on('gameOver', (data) => {
      setGameOverData(data);
      setGameState('gameover');
    });

    socket.on('error', (msg) => {
      alert(msg);
    });

    socket.on('playerLeft', () => {
      alert('Your opponent left the game.');
      setGameState('room');
    });

    return () => {
      socket.off('roomCreated');
      socket.off('roomJoined');
      socket.off('roomUpdate');
      socket.off('gameStarted');
      socket.off('turnChanged');
      socket.off('gameOver');
      socket.off('error');
      socket.off('playerLeft');
    };
  }, []);

  const handleCreateRoom = (name) => {
    setPlayerName(name);
    socket.emit('createRoom', { playerName: name });
  };

  const handleJoinRoom = (name, id) => {
    setPlayerName(name);
    socket.emit('joinRoom', { roomId: id, playerName: name });
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-wider">GUESS WHO</h1>
          {playerName && <span>Player: {playerName}</span>}
        </div>
      </header>

      <main className="p-4 max-w-6xl mx-auto">
        {gameState === 'lobby' && (
          <Lobby onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
        )}

        {(gameState === 'room' || gameState === 'playing' || gameState === 'gameover') && roomData && (
          <Game 
            socket={socket}
            roomId={roomId}
            roomData={roomData}
            playerName={playerName}
            gameState={gameState}
            gameOverData={gameOverData}
          />
        )}
      </main>
    </div>
  );
}

export default App;
