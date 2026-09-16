import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Flame, RefreshCw, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  parseDishWithGemini, 
  getRandomSushmithaRoast, 
  SUSHMITHA_QUICK_REPLIES 
} from '../services/gemini';

export default function ChatIntake({ selectedUser, onAddDish }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const isSushmitha = selectedUser === 'Sushmitha';

  // Initialize or reset greeting message when selected user changes
  useEffect(() => {
    if (isSushmitha) {
      const roastQuestion = getRandomSushmithaRoast();
      setMessages([
        {
          id: Date.now(),
          sender: 'ai',
          text: roastQuestion,
          isRoast: true
        }
      ]);
    } else {
      setMessages([
        {
          id: Date.now(),
          sender: 'ai',
          text: `Hey ${selectedUser}! 👋 What delicious dish are you cooking for our 6-person staycation? Tell me what you're making and any ingredients!`,
          isRoast: false
        }
      ]);
    }
  }, [selectedUser]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMessageObj = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      user: selectedUser
    };

    setMessages((prev) => [...prev, userMessageObj]);
    if (!textToSend) setInputText('');
    setLoading(true);

    try {
      const result = await parseDishWithGemini(text, selectedUser);

      if (result.success && result.data) {
        const dishData = {
          ...result.data,
          id: 'dish_' + Date.now(),
          chef: selectedUser,
          addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // Add dish to parent global state
        onAddDish(dishData);
        triggerConfetti();

        const aiReplyObj = {
          id: Date.now() + 1,
          sender: 'ai',
          text: result.data.aiReplyMessage || `Added ${dishData.dishName} for 6 people!`,
          isRoast: isSushmitha,
          dishAdded: dishData.dishName
        };

        setMessages((prev) => [...prev, aiReplyObj]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: `Oops! I couldn't quite understand that recipe. Try giving me the dish name and ingredients!`,
            isRoast: false
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: `Something went wrong while parsing the recipe. Please try again!`,
          isRoast: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel-card chat-pane">
      <div className="panel-header">
        <div className="panel-title">
          <Sparkles className="text-indigo-400" size={20} />
          <span>Natural Language Intake</span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Active Chef: <strong style={{ color: isSushmitha ? 'var(--sushmitha-orange)' : 'white' }}>{selectedUser}</strong>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-bubble ${msg.sender} ${msg.isRoast ? 'sushmitha-roast' : ''}`}
          >
            <div
              className={`avatar ${
                msg.sender === 'ai'
                  ? 'ai-avatar'
                  : isSushmitha
                  ? 'sushmitha-avatar'
                  : 'user-avatar'
              }`}
            >
              {msg.sender === 'ai' ? (
                <Bot size={18} color="white" />
              ) : isSushmitha ? (
                <Flame size={18} color="white" />
              ) : (
                <User size={18} color="white" />
              )}
            </div>

            <div className="bubble-content">
              {msg.isRoast && (
                <div className="roast-header">
                  <Flame size={14} /> Sushmitha Roast Radar 🔥
                </div>
              )}
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-bubble ai">
            <div className="avatar ai-avatar">
              <Bot size={18} color="white" />
            </div>
            <div className="bubble-content" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw className="animate-spin" size={16} />
              <span>Analyzing recipe & scaling for 6 staycationers...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Witty Quick Replies for Sushmitha or sample prompt suggestions */}
      <div className="quick-replies">
        {isSushmitha ? (
          SUSHMITHA_QUICK_REPLIES.map((reply, idx) => (
            <button
              key={idx}
              className="chip-btn sushmitha-chip"
              onClick={() => handleSendMessage(reply)}
            >
              <Flame size={13} /> {reply}
            </button>
          ))
        ) : (
          <>
            <button
              className="chip-btn"
              onClick={() => handleSendMessage(`Making Butter Chicken for dinner with 600g chicken, 200g butter, garlic, cream, naan`)}
            >
              🍛 Butter Chicken & Naan
            </button>
            <button
              className="chip-btn"
              onClick={() => handleSendMessage(`Pancakes for breakfast with 300g flour, 4 eggs, maple syrup, blueberries, butter`)}
            >
              🥞 Morning Pancakes
            </button>
          </>
        )}
      </div>

      {/* Input Form */}
      <div className="chat-input-area">
        <form
          className="chat-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <input
            type="text"
            className="chat-input"
            placeholder={
              isSushmitha
                ? "Reply to AI or type your dish & ingredients..."
                : `Describe what ${selectedUser} is cooking (e.g. "Making Pasta with 500g pasta, tomatoes, cheese...")`
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="send-btn" disabled={loading || !inputText.trim()}>
            <Send size={16} />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
