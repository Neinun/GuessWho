import React, { useState } from 'react';

const Lobby = ({ onCreateRoom, onJoinRoom }) => {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');

  const handleCreate = () => {
    if (name.trim()) onCreateRoom(name);
  };

  const handleJoin = () => {
    if (name.trim() && roomId.trim()) onJoinRoom(name, roomId);
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-center text-indigo-700">Welcome to Guess Who</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
          <input 
            type="text" 
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button 
            onClick={handleCreate}
            disabled={!name.trim()}
            className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
          >
            Create New Room
          </button>
        </div>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Room Code</label>
          <input 
            type="text" 
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 uppercase"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            placeholder="Enter 6-character code"
            maxLength={6}
          />
          <button 
            onClick={handleJoin}
            disabled={!name.trim() || !roomId.trim()}
            className="w-full mt-3 bg-white text-indigo-600 border border-indigo-600 font-semibold py-2 px-4 rounded-md hover:bg-indigo-50 disabled:border-gray-300 disabled:text-gray-400 transition-colors"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
