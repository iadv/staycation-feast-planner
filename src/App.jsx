import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatIntake from './components/ChatIntake';
import DishList from './components/DishList';
import IngredientsAggregator from './components/IngredientsAggregator';
import ApiKeyModal from './components/ApiKeyModal';

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

  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

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
      {/* Header with User Selector & Gemini Status */}
      <Header
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
      />

      {/* Main Split-Screen Workspace */}
      <main className="main-grid">
        {/* Left Side: Natural Language Chat Intake */}
        <ChatIntake
          selectedUser={selectedUser}
          onAddDish={handleAddDish}
        />

        {/* Right Side: Dish List + Aggregated Grocery List */}
        <div className="right-pane">
          <DishList
            dishes={dishes}
            onDeleteDish={handleDeleteDish}
            onResetDishes={handleResetDishes}
          />
          <IngredientsAggregator dishes={dishes} />
        </div>
      </main>

      {/* Gemini API Key Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
      />
    </div>
  );
}
