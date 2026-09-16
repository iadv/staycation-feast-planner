import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Flame, RefreshCw, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  parseDishWithGemini, 
  SUSHMITHA_QUICK_REPLIES,
  CHEF_TITLES
} from '../services/gemini';

export default function ChatIntake({ selectedUser, onAddDish }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sushmithaPendingDish, setSushmithaPendingDish] = useState(null);
  const chatEndRef = useRef(null);

  const isSushmitha = selectedUser === 'Sushmitha';

  // Initialize greeting message when active chef changes
  useEffect(() => {
    setErrorMsg('');
    setSushmithaPendingDish(null);

    if (!selectedUser) {
      setMessages([
        {
          id: Date.now(),
          sender: 'ai',
          text: `👋 Welcome to the Staycation Feast Planner! Please select your name from the top dropdown to start entering dishes.`,
          isRoast: false
        }
      ]);
    } else if (isSushmitha) {
      setMessages([
        {
          id: Date.now(),
          sender: 'ai',
          text: `Hey Sushmitha! 👋 Welcome to the staycation kitchen! What delicious dish are you planning to cook for us today?`,
          isRoast: false
        }
      ]);
    } else {
      setMessages([
        {
          id: Date.now(),
          sender: 'ai',
          text: `Hey ${selectedUser}! 👋 (${CHEF_TITLES[selectedUser] || 'Chef'}) What dish are you bringing to our staycation menu?`,
          isRoast: false
        }
      ]);
    }
  }, [selectedUser]);

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

    if (!selectedUser) {
      setErrorMsg('⚠️ Please select your name from the dropdown above before entering a dish!');
      return;
    }

    if (!text.trim() || loading) return;
    setErrorMsg('');

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
      // SUSHMITHA 2-TURN FLOW
      if (isSushmitha) {
        if (!sushmithaPendingDish) {
          // TURN 1 FOR SUSHMITHA: User inputs dish -> AI asks doubting question ("Have you tried it before or experimenting on us?")
          const result = await parseDishWithGemini(text, 'Sushmitha', 'intake', null);
          
          if (result.success && result.data && result.data.isDishEntry !== false) {
            const pendingData = {
              ...result.data,
              id: 'dish_' + Date.now(),
              chef: 'Sushmitha',
              addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            // Store pending dish without adding to main list yet
            setSushmithaPendingDish(pendingData);

            const aiRoastReply = result.data.aiReplyMessage || `Wait, Sushmitha... have you actually tried cooking ${result.data.dishName} before, or are you experimenting on us for this staycation? 🍕🔥 Are you sure the smoke alarms are safe? 😜`;

            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + 1,
                sender: 'ai',
                text: aiRoastReply,
                isRoast: true
              }
            ]);
          } else {
            // Conversational response if not a dish
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + 1,
                sender: 'ai',
                text: result.data?.aiReplyMessage || `Hey Sushmitha! What dish are you planning to bring?`,
                isRoast: false
              }
            ]);
          }
        } else {
          // TURN 2 FOR SUSHMITHA: Sushmitha answers/confirms -> AI acknowledges & officially adds dish to menu!
          const result = await parseDishWithGemini(text, 'Sushmitha', 'awaiting_confirmation', sushmithaPendingDish.dishName);

          // OFFICIALLY ADD DISH TO MENU NOW!
          onAddDish(sushmithaPendingDish);
          triggerConfetti();

          const aiConfirmReply = result.data?.aiReplyMessage || `Haha alright Sushmitha, I'll trust your word! 😜 Adding "${sushmithaPendingDish.dishName}" to our staycation feast menu!`;

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              sender: 'ai',
              text: aiConfirmReply,
              isRoast: true
            }
          ]);

          // Clear pending dish for next round
          setSushmithaPendingDish(null);
        }
      } else {
        // NORMAL 1-TURN FLOW FOR ALL OTHER CHEFS
        const result = await parseDishWithGemini(text, selectedUser);

        if (result.success && result.data) {
          const isDishEntry = result.data.isDishEntry !== false && Boolean(result.data.dishName);

          if (isDishEntry) {
            const dishData = {
              ...result.data,
              id: 'dish_' + Date.now(),
              chef: selectedUser,
              addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            onAddDish(dishData);
            triggerConfetti();
          }

          const aiReplyObj = {
            id: Date.now() + 1,
            sender: 'ai',
            text: result.data.aiReplyMessage || `Added ${result.data.dishName} to the menu!`,
            isRoast: false
          };

          setMessages((prev) => [...prev, aiReplyObj]);
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: `An error occurred while chatting. Please try again!`,
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
          Active Chef: {selectedUser ? <strong style={{ color: isSushmitha ? 'var(--sushmitha-orange)' : 'white' }}>{selectedUser}</strong> : <span style={{ color: 'var(--accent-rose)' }}>None Selected</span>}
        </div>
      </div>

      {/* Error Alert Box */}
      {errorMsg && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#fca5a5',
          padding: '0.65rem 1rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

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
              <span>Chef Staycation AI is typing...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Replies for Sushmitha or sample chips */}
      {selectedUser && (
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
                onClick={() => handleSendMessage(`Making Pasta with pasta, tomatoes, garlic, cheese`)}
              >
                🍝 Pasta & Cheese
              </button>
              <button
                className="chip-btn"
                onClick={() => handleSendMessage(`Chicken Biryani with rice, chicken, curd, spices`)}
              >
                🍛 Chicken Biryani
              </button>
            </>
          )}
        </div>
      )}

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
              !selectedUser
                ? "Select your name from the top dropdown first..."
                : isSushmitha
                ? sushmithaPendingDish
                  ? "Reply to AI (e.g., 'I swear I can cook it!')..."
                  : "Enter your dish name..."
                : `Describe what ${selectedUser} is cooking or say hi...`
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
