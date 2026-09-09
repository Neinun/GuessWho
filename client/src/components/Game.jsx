import React, { useState, useEffect } from 'react';
import Chat from './Chat';
import Board from './Board';

// When running under Vite dev server (port 5173), load from backend on port 3001. In production, load from /assets
const ASSETS_URL = window.location.port === '5173' ? 'http://localhost:3001/assets' : '/assets';

const Game = ({ socket, roomId, roomData, playerName, gameState, gameOverData }) => {
  const [celebrities, setCelebrities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eliminated, setEliminated] = useState(new Set());
  const [isSubmittingGuess, setIsSubmittingGuess] = useState(false);
  const [guessFeedback, setGuessFeedback] = useState(null);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  useEffect(() => {
    fetch(`${ASSETS_URL}/celebrities.json`)
      .then(res => res.json())
      .then(data => {
        setCelebrities(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load celebrities', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const handleGuessResult = ({ correct, characterId }) => {
      setIsSubmittingGuess(false);
      if (!correct) {
        const charName = celebrities.find(c => c.id === characterId)?.name || 'That person';
        setGuessFeedback(`Incorrect guess for ${charName}! Turn passed to opponent.`);
        setTimeout(() => setGuessFeedback(null), 4000);
        
        setEliminated(prev => {
          const next = new Set(prev);
          next.add(characterId);
          return next;
        });
      }
    };

    socket.on('guessResult', handleGuessResult);
    
    return () => {
      socket.off('guessResult', handleGuessResult);
    };
  }, [socket, celebrities]);

  if (loading) {
    return <div className="text-center mt-20">Loading game data...</div>;
  }

  const players = Object.values(roomData.players);
  const me = roomData.players[socket.id];
  const opponentId = Object.keys(roomData.players).find(id => id !== socket.id);
  const opponent = opponentId ? roomData.players[opponentId] : null;

  if (!opponent) {
    return (
      <div className="text-center mt-20 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold mb-2">Room Code: <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded font-mono tracking-widest">{roomId}</span></h2>
        <p className="text-gray-600">Share this code with a friend. Waiting for them to join...</p>
      </div>
    );
  }

  if (gameState === 'gameover') {
    const iWon = gameOverData.winnerId === socket.id;
    const correctChar = celebrities.find(c => c.id === gameOverData.correctCharacter);
    
    return (
      <div className="text-center mt-20 bg-white p-8 rounded-xl shadow-lg border border-gray-200 max-w-lg mx-auto">
        <h2 className={`text-4xl font-extrabold mb-4 ${iWon ? 'text-green-600' : 'text-red-600'}`}>
          {iWon ? 'YOU WON!' : 'YOU LOST!'}
        </h2>
        <div className="mb-6">
          <p className="text-gray-700 text-lg mb-2">
            {gameOverData.guesserId === socket.id 
              ? `You guessed ${celebrities.find(c => c.id === gameOverData.guessedCharacter)?.name}.`
              : `${opponent.name} guessed ${celebrities.find(c => c.id === gameOverData.guessedCharacter)?.name}.`
            }
          </p>
          <p className="text-gray-900 font-bold">
            The correct character was {correctChar?.name}.
          </p>
          <img 
            src={`${ASSETS_URL}/${correctChar?.image}`} 
            alt={correctChar?.name} 
            className="w-48 h-48 object-cover rounded-full mx-auto mt-4 border-4 border-indigo-200"
          />
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700"
        >
          Play Again
        </button>
      </div>
    );
  }

  if (!me.ready) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-indigo-800">Select Your Character</h2>
          {opponent.ready && <span className="text-green-600 font-semibold">{opponent.name} is ready!</span>}
        </div>
        <p className="mb-4 text-gray-600">Choose the character your opponent will have to guess.</p>
        <div className="grid grid-cols-5 md:grid-cols-9 gap-4">
          {celebrities.map(c => (
            <div 
              key={c.id} 
              className="cursor-pointer transform hover:scale-105 transition-transform"
              onClick={() => {
                if (window.confirm(`Select ${c.name} as your character?`)) {
                  socket.emit('selectCharacter', { roomId, characterId: c.id });
                }
              }}
            >
              <img 
                src={`${ASSETS_URL}/${c.image}`} 
                alt={c.name} 
                className="w-full aspect-square object-cover rounded-lg shadow-sm border border-gray-300"
                title={c.name}
              />
              <p className="text-xs text-center mt-1 font-medium truncate">{c.name}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (me.ready && !opponent.ready) {
    return (
      <div className="text-center mt-20 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold mb-2">Waiting for {opponent.name}...</h2>
        <p className="text-gray-600">You selected your character. Waiting for your opponent to select theirs.</p>
      </div>
    );
  }

  // PLAYING STATE
  const isMyTurn = roomData.turn === socket.id;

  const toggleEliminate = (e, id) => {
    if (e.target.tagName !== 'BUTTON') {
      setEliminated(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-6.5rem)] min-h-0">
      {/* Board Area */}
      <div className="flex-1 min-h-0 min-w-0 bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-3 pb-2 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-full font-bold text-xs sm:text-sm flex items-center gap-2 ${isMyTurn ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-500'}`}>
              {isMyTurn && <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>}
              {isMyTurn ? "Your Turn to Guess" : `${opponent.name}'s Turn to Guess`}
            </div>
            {isSubmittingGuess && (
              <span className="text-xs text-indigo-600 font-semibold animate-pulse">Checking guess...</span>
            )}
          </div>
          <div className="text-right text-xs sm:text-sm">
            <span className="text-gray-500">Your Character:</span>
            <span className="ml-1.5 font-bold text-gray-900">{celebrities.find(c => c.id === me.selectedCharacter)?.name}</span>
          </div>
        </div>

        {/* Guess Feedback Banner */}
        {guessFeedback && (
          <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs animate-fade-in shrink-0">
            <span>{guessFeedback}</span>
            <button onClick={() => setGuessFeedback(null)} className="text-amber-600 hover:text-amber-800 font-bold ml-2 text-base leading-none">&times;</button>
          </div>
        )}
        
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
          <Board 
            celebrities={celebrities} 
            assetsUrl={ASSETS_URL}
            eliminated={eliminated}
            toggleEliminate={toggleEliminate}
            isMyTurn={isMyTurn}
            isSubmittingGuess={isSubmittingGuess}
            onGuess={(charId) => {
              if (isMyTurn && !isSubmittingGuess) {
                const char = celebrities.find(c => c.id === charId);
                if (window.confirm(`Are you sure you want to guess ${char.name}? If you are wrong, your turn will pass to the opponent.`)) {
                  setIsSubmittingGuess(true);
                  socket.emit('makeGuess', { roomId, characterId: charId });
                }
              } else if (!isMyTurn) {
                alert("It's not your turn!");
              }
            }}
          />
        </div>
      </div>

      {/* Chat Area */}
      <div className={`w-full md:w-72 lg:w-80 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 shrink-0 min-h-0 transition-all duration-200 ${
        isChatCollapsed ? 'h-11 md:h-full' : 'h-52 md:h-full max-h-[38vh] md:max-h-none'
      }`}>
        <Chat 
          socket={socket} 
          roomId={roomId} 
          me={me} 
          isCollapsed={isChatCollapsed}
          onToggleCollapse={() => setIsChatCollapsed(prev => !prev)}
        />
      </div>
    </div>
  );
};

export default Game;
