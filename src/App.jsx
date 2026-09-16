import React, { useState } from 'react';
import Header from './components/Header';
import ChatIntake from './components/ChatIntake';
import DishList from './components/DishList';
import IngredientsAggregator from './components/IngredientsAggregator';
import ApiKeyModal from './components/ApiKeyModal';

// Initial dishes requested by user: ONLY Nynika's 2 items
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
  // Start with no user selected by default as requested
  const [selectedUser, setSelectedUser] = useState('');
  const [dishes, setDishes] = useState(INITIAL_NYNIKA_DISHES);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  const handleAddDish = (newDish) => {
    setDishes((prev) => [newDish, ...prev]);
  };

  const handleDeleteDish = (id) => {
    setDishes((prev) => prev.filter((d) => d.id !== id));
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
