import React, { useState } from 'react';
import Header from './components/Header';
import ChatIntake from './components/ChatIntake';
import DishList from './components/DishList';
import IngredientsAggregator from './components/IngredientsAggregator';
import ApiKeyModal from './components/ApiKeyModal';

// Sample staycation dishes scaled for 6 people
const INITIAL_SAMPLE_DISHES = [
  {
    id: 'sample_1',
    dishName: 'Hyderabadi Chicken Biryani',
    chef: 'Hari Pavan',
    mealType: 'Dinner',
    servingsBase: 6,
    ingredients: [
      { name: 'Basmati Rice', quantity: 1, unit: 'kg', category: 'Pantry & Spices' },
      { name: 'Chicken', quantity: 1.2, unit: 'kg', category: 'Meat & Protein' },
      { name: 'Curd / Yogurt', quantity: 300, unit: 'g', category: 'Dairy' },
      { name: 'Onions (Fried)', quantity: 4, unit: 'pcs', category: 'Produce' },
      { name: 'Biryani Spices Mix', quantity: 1, unit: 'pack', category: 'Pantry & Spices' },
      { name: 'Mint & Coriander', quantity: 1, unit: 'bunch', category: 'Produce' }
    ]
  },
  {
    id: 'sample_2',
    dishName: 'Paneer Butter Masala & Naan',
    chef: 'Pooja',
    mealType: 'Dinner',
    servingsBase: 6,
    ingredients: [
      { name: 'Paneer', quantity: 600, unit: 'g', category: 'Dairy' },
      { name: 'Butter', quantity: 150, unit: 'g', category: 'Dairy' },
      { name: 'Tomatoes', quantity: 6, unit: 'pcs', category: 'Produce' },
      { name: 'Heavy Cream', quantity: 200, unit: 'ml', category: 'Dairy' },
      { name: 'Garlic Naan', quantity: 12, unit: 'pcs', category: 'Bakery' },
      { name: 'Kasuri Methi', quantity: 2, unit: 'tbsp', category: 'Pantry & Spices' }
    ]
  },
  {
    id: 'sample_3',
    dishName: 'Sushmitha\'s "Burnt-Proof" Pancakes',
    chef: 'Sushmitha',
    mealType: 'Breakfast',
    servingsBase: 6,
    ingredients: [
      { name: 'Pancake Mix', quantity: 500, unit: 'g', category: 'Bakery' },
      { name: 'Milk', quantity: 600, unit: 'ml', category: 'Dairy' },
      { name: 'Eggs', quantity: 6, unit: 'pcs', category: 'Meat & Protein' },
      { name: 'Maple Syrup', quantity: 1, unit: 'bottle', category: 'Pantry & Spices' },
      { name: 'Fresh Strawberries', quantity: 250, unit: 'g', category: 'Produce' }
    ]
  }
];

export default function App() {
  const [selectedUser, setSelectedUser] = useState('Sushmitha');
  const [dishes, setDishes] = useState(INITIAL_SAMPLE_DISHES);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  const handleAddDish = (newDish) => {
    setDishes((prev) => [newDish, ...prev]);
  };

  const handleDeleteDish = (id) => {
    setDishes((prev) => prev.filter((d) => d.id !== id));
  };

  const handleLoadSampleMenu = () => {
    setDishes(INITIAL_SAMPLE_DISHES);
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

        {/* Right Side: Dish List + Aggregated 6-Person Shopping List */}
        <div className="right-pane">
          <DishList
            dishes={dishes}
            onDeleteDish={handleDeleteDish}
            onLoadSampleMenu={handleLoadSampleMenu}
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
