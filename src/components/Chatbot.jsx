import React, { useState, useEffect, useRef } from 'react';
import './Chatbot.css';

const BotMessage = ({ text }) => (
  <div className="chatbot-message bot">
    <div className="chatbot-avatar">📷</div>
    <div className="chatbot-bubble">{text}</div>
  </div>
);

const UserMessage = ({ text }) => (
  <div className="chatbot-message user">
    <div className="chatbot-bubble">{text}</div>
  </div>
);

export default function Chatbot({ translations }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [userName, setUserName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Genera un ID di sessione univoco al caricamento
    setSessionId(Date.now().toString() + Math.random().toString(36).substr(2, 5));
    // Messaggio iniziale
    setMessages([{ id: 1, sender: 'bot', text: 'Ciao! Benvenuto da Foto Extracolor. Come posso aiutarti oggi?' }]);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleOptionClick = (optionText, responseText) => {
    const userMsg = { id: Date.now(), sender: 'user', text: optionText };
    setMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      const botMsg = { id: Date.now() + 1, sender: 'bot', text: responseText };
      setMessages(prev => [...prev, botMsg]);
    }, 600);
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    const userMsg = { id: Date.now(), sender: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Formatta la history per Groq: mappa { sender, text } a { role, content }
      const history = messages.filter(m => m.id !== 1).map(m => ({
        role: m.sender === 'bot' ? 'assistant' : 'user',
        content: m.text
      }));

      const res = await fetch('/api.php?action=chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history, userName, sessionId })
      });

      const data = await res.json();
      
      const botMsg = { 
        id: Date.now() + 1, 
        sender: 'bot', 
        text: data.reply || 'Scusa, ho avuto un problema di connessione.' 
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const botMsg = { 
        id: Date.now() + 1, 
        sender: 'bot', 
        text: 'Errore di rete. Assicurati che il server backend (server.js) sia in esecuzione!' 
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`chatbot-wrapper ${isOpen ? 'open' : ''}`}>
      {!isOpen && (
        <button className="chatbot-toggle-btn" onClick={toggleChat} aria-label="Apri chat">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <span className="chatbot-header-title">Assistente Foto Extracolor</span>
              <span className="chatbot-header-status">Online</span>
            </div>
            <button className="chatbot-close-btn" onClick={toggleChat}>×</button>
          </div>

          {!userName ? (
            <div className="chatbot-name-form">
              <p>Benvenuto! Per iniziare a chattare, inserisci il tuo nome.</p>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (nameInput.trim()) setUserName(nameInput.trim());
              }}>
                <input 
                  type="text" 
                  placeholder="Il tuo nome..." 
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  autoFocus
                />
                <button type="submit" disabled={!nameInput.trim()}>
                  Inizia Chat
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="chatbot-messages">
                {messages.map(msg => (
                  msg.sender === 'bot' 
                    ? <BotMessage key={msg.id} text={msg.text} />
                    : <UserMessage key={msg.id} text={msg.text} />
                ))}
                
                {isLoading && (
                  <div className="chatbot-message bot">
                    <div className="chatbot-avatar">📷</div>
                    <div className="chatbot-bubble typing">Sta scrivendo...</div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              <div className="chatbot-options">
                <button onClick={() => handleOptionClick('Voglio stampare delle foto', 'Ottimo! Puoi inviarci le tue foto su WhatsApp oppure portarle direttamente in negozio su chiavetta/telefono.')}>
                  Stampa Foto
                </button>
                <button onClick={() => handleOptionClick('Orari e Indirizzo', 'Siamo in Via Raffaele Ricci 62 a Salerno. Ci trovi dal Lunedì al Sabato!')}>
                  Dove Siete?
                </button>
                <button onClick={() => handleOptionClick('Info sui Servizi', 'Offriamo stampe, gadget personalizzati, servizi matrimoniali e recupero vecchie pellicole o VHS.')}>
                  Servizi
                </button>
              </div>

              <form className="chatbot-input-area" onSubmit={handleSubmit}>
                <input 
                  type="text" 
                  placeholder="Scrivi un messaggio..." 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading}
                />
                <button type="submit" disabled={!inputValue.trim() || isLoading}>
                  {isLoading ? '...' : 'Invia'}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
