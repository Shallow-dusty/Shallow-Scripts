import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { MessageCircle, X, Send, Sparkles, Heart, Loader2 } from 'lucide-react';
import { chatWithAI } from '../services/api';
import useStore from '../store';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { records } = useStore();
  const scrollRef = useRef(null);
  
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'WoolMaster 首席精算师已就位。把你的方案发出来，让我看看是神价格还是智商税。' }
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const response = await chatWithAI(newMessages, records);
    
    setMessages([...newMessages, { role: 'assistant', content: response }]);
    setIsLoading(false);
  };

  return (
    <div className="ai-assistant-wrapper">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="ai-chat-panel glass-panel"
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
          >
            <div className="chat-header">
              <div className="bot-info">
                <div className="bot-avatar">
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="bot-name">GLM-4.7 智囊</div>
                  <div className="bot-status">在线 · 为你省钱中</div>
                </div>
              </div>
              <button onClick={toggleOpen} className="close-chat"><X size={18} /></button>
            </div>

            <div className="chat-content" ref={scrollRef}>
              {messages.map((msg, i) => (
                <div key={i} className={`message ${msg.role}`}>
                   <div className="message-bubble">{msg.content}</div>
                </div>
              ))}
              {isLoading && (
                <div className="message assistant">
                  <div className="message-bubble loading">
                    <Loader2 className="animate-spin" size={16} />
                    <span>正在思考最佳方案...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="chat-input-area">
              <input 
                type="text" 
                placeholder="问问我哪个最值..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <button className="send-btn" onClick={handleSend} disabled={isLoading}>
                <Send size={16} />
              </button>
            </div>
            
            <div className="ai-personality-badge">
              <Heart size={12} fill="currentColor" />
              <span>情绪价值模式已开启</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        className={`ai-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={toggleOpen}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
        {!isOpen && <div className="notification-dot"></div>}
      </motion.button>
    </div>
  );
};

export default AIAssistant;
