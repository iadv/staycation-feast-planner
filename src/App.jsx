import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatIntake from './components/ChatIntake';
import DishList from './components/DishList';
import IngredientsAggregator from './components/IngredientsAggregator';
import { MessageSquare, Utensils, ShoppingBag } from 'lucide-react';

// Initial default dishes requested by user
const INITIAL_NYNIKA_DISHES = [
  {
    id: 'nynika_1',
    dishName: 'Uggu',
    chef: 'Nynika',
    mealType: 'Breakfast',
    ingredients: [
      { name: 'Rice', category: 'Produce' },
      { name: 'Lentils', category: 'Produce' }
    ]
  },
  {
    id: 'nynika_2',
    dishName: 'Orange Slices',
    chef: 'Nynika',
    mealType: 'Snack',
    ingredients: [
      { name: 'Orange', category: 'Produce' }
    ]
  }
];

export default function App() {
  const [selectedUser, setSelectedUser] = useState('');
  const [activeMobileTab, setActiveMobileTab] = useState('chat'); // 'chat' | 'dishes' | 'ingredients'

  // LOCAL STORAGE PERSISTENCE
  const [dishes, setDishes] = useState(() => {
    try {
      const saved = localStorage.getItem('staycation_dishes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load saved dishes:', e);
    }
    return INITIAL_NYNIKA_DISHES;
  });

  // Save to localStorage whenever dishes state updates
  useEffect(() => {
    try {
      localStorage.setItem('staycation_dishes', JSON.stringify(dishes));
    } catch (e) {
      console.error('Failed to persist dishes:', e);
    }
  }, [dishes]);

  const handleAddDish = (newDish) => {
    setDishes((prev) => [newDish, ...prev]);
    // Automatically switch to dish list tab on mobile when a dish is added so user sees it instantly!
    if (window.innerWidth <= 768) {
      setTimeout(() => setActiveMobileTab('dishes'), 1200);
    }
  };

  const handleDeleteDish = (id) => {
    setDishes((prev) => prev.filter((d) => d.id !== id));
  };

  const handleResetDishes = () => {
    if (window.confirm('Reset menu back to initial Nynika dishes?')) {
      setDishes(INITIAL_NYNIKA_DISHES);
    }
  };

  return (
    <div className="app-container">
      {/* Header with User Selector */}
      <Header
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
      />

      {/* Mobile Top Segmented Tab Switcher (Visible on Mobile Screens <= 768px) */}
      <div className="mobile-tab-bar">
        <button
          className={`mobile-tab-btn ${activeMobileTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveMobileTab('chat')}
        >
          <MessageSquare size={16} />
          <span>AI Chat</span>
        </button>
        <button
          className={`mobile-tab-btn ${activeMobileTab === 'dishes' ? 'active' : ''}`}
          onClick={() => setActiveMobileTab('dishes')}
        >
          <Utensils size={16} />
          <span>Menu ({dishes.length})</span>
        </button>
        <button
          className={`mobile-tab-btn ${activeMobileTab === 'ingredients' ? 'active' : ''}`}
          onClick={() => setActiveMobileTab('ingredients')}
        >
          <ShoppingBag size={16} />
          <span>Shopping List</span>
        </button>
      </div>

      {/* Main Split-Screen Workspace / Mobile Tabbed View */}
      <main className={`main-grid mobile-view-${activeMobileTab}`}>
        {/* Left Side: Natural Language Chat Intake */}
        <div className="tab-pane-wrapper chat-wrapper">
          <ChatIntake
            selectedUser={selectedUser}
            onAddDish={handleAddDish}
          />
        </div>

        {/* Right Side: Dish List + Aggregated Grocery List */}
        <div className="right-pane">
          <div className="tab-pane-wrapper dishes-wrapper">
            <DishList
              dishes={dishes}
              onDeleteDish={handleDeleteDish}
              onResetDishes={handleResetDishes}
            />
          </div>
          <div className="tab-pane-wrapper ingredients-wrapper">
            <IngredientsAggregator dishes={dishes} />
          </div>
        </div>
      </main>
    </div>
  );
}
