import React, { useState } from 'react';

const Board = ({ celebrities, assetsUrl, onGuess, eliminated, toggleEliminate, isMyTurn, isSubmittingGuess }) => {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-3 pb-4">
      {celebrities.map(c => {
        const isEliminated = eliminated.has(c.id);
        const canGuess = isMyTurn && !isSubmittingGuess && !isEliminated;
        
        return (
          <div 
            key={c.id} 
            className="relative group cursor-pointer select-none"
            onClick={(e) => toggleEliminate(e, c.id)}
          >
            <div className={`transition-all duration-300 ${isEliminated ? 'opacity-30 grayscale' : 'hover:shadow-md'}`}>
              <img 
                src={`${assetsUrl}/${c.image}`} 
                alt={c.name} 
                className="w-full aspect-square object-cover rounded-md border border-gray-200"
              />
              <p className="text-[10px] sm:text-xs text-center mt-1 font-medium leading-tight h-8 overflow-hidden">{c.name}</p>
            </div>
            
            {/* Cross mark overlay for eliminated */}
            {isEliminated && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none mb-8">
                <div className="w-full h-1 bg-red-500 absolute rotate-45 opacity-70"></div>
                <div className="w-full h-1 bg-red-500 absolute -rotate-45 opacity-70"></div>
              </div>
            )}
            
            {/* Guess Button Overlay on Hover (only if it's your turn and not eliminated) */}
            {canGuess && (
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 mb-8 rounded-md">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onGuess(c.id);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-3 rounded shadow transform hover:scale-105 transition-transform"
                >
                  GUESS
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Board;
