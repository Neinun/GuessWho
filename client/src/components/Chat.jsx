import React, { useState, useEffect, useRef } from 'react';

const Chat = ({ socket, roomId, me, isCollapsed, onToggleCollapse }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleReceiveMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
    };

    socket.on('receiveMessage', handleReceiveMessage);
    
    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [socket]);

  useEffect(() => {
    if (!isCollapsed) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isCollapsed]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim()) {
      socket.emit('sendMessage', { roomId, message: input.trim() });
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-t-xl shrink-0 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <span>Chat</span>
          {messages.length > 0 && (
            <span className="text-[10px] bg-indigo-500 px-2 py-0.5 rounded-full font-normal">
              {messages.length}
            </span>
          )}
        </div>
        {/* Toggle button on smaller screens */}
        <button 
          onClick={onToggleCollapse} 
          className="md:hidden text-xs bg-indigo-700 hover:bg-indigo-800 px-2 py-1 rounded transition-colors"
          title={isCollapsed ? "Expand Chat" : "Collapse Chat"}
        >
          {isCollapsed ? "▲ Expand" : "▼ Minimize"}
        </button>
      </div>
      
      {!isCollapsed && (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5 bg-gray-50 custom-scrollbar flex flex-col">
            {messages.length === 0 && (
              <p className="text-gray-400 text-xs text-center my-auto px-4">
                Ask Yes/No questions to deduce your opponent's celebrity!
              </p>
            )}
            
            {messages.map((msg, i) => {
              const isMe = msg.senderId === socket.id;
              const isSystem = msg.senderId === 'system';

              if (isSystem) {
                return (
                  <div key={i} className="flex justify-center my-1">
                    <span className="text-[11px] bg-amber-50 border border-amber-200 text-amber-800 rounded px-2.5 py-1 text-center max-w-[95%] shadow-xs">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              return (
                <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-gray-500 mb-0.5">{isMe ? 'You' : msg.senderName}</span>
                  <div className={`px-3 py-1.5 rounded-lg max-w-[85%] text-xs sm:text-sm break-words ${
                    isMe ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-xs'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-2.5 bg-white border-t border-gray-200 rounded-b-xl shrink-0 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-grow px-3 py-1.5 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm"
            />
            <button 
              type="submit"
              disabled={!input.trim()}
              className="bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 transition-colors shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default Chat;
