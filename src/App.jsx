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
  const [syncStatus, setSyncStatus] = useState('syncing'); // 'synced' | 'saving' | 'local' | 'syncing'
  const [syncReason, setSyncReason] = useState('');

  // LOCAL STORAGE & CLOUD BLOB PERSISTENCE
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

  const isSavingRef = useRef(false);

  // Save to Vercel Cloud Blob and localStorage
  const saveDishesToCloudAndLocal = async (updatedDishes) => {
    isSavingRef.current = true;
    setDishes(updatedDishes);
    try {
      localStorage.setItem('staycation_dishes', JSON.stringify(updatedDishes));
    } catch (e) {
      console.error('Failed to persist dishes to localStorage:', e);
    }

    try {
      setSyncStatus('saving');
      const res = await fetch('/api/dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dishes: updatedDishes })
      });
      const data = await res.json();
      if (data.isBlobAvailable) {
        setSyncStatus('synced');
        setSyncReason('Synced with Vercel Cloud Blob');
      } else {
        setSyncStatus('local');
        setSyncReason(data.message || 'BLOB_READ_WRITE_TOKEN is not set in Vercel Environment Variables.');
      }
    } catch (err) {
      console.warn('Vercel Blob sync fallback to local storage:', err);
      setSyncStatus('local');
      setSyncReason('Running on local environment without Vercel API backend.');
    } finally {
      isSavingRef.current = false;
    }
  };

  // Fetch from Vercel Cloud Blob on load & auto-poll every 8 seconds for cross-device sync
  useEffect(() => {
    let isMounted = true;

    const fetchCloudDishes = async () => {
      if (isSavingRef.current) return; // Skip polling while saving a dish

      try {
        const res = await fetch('/api/dishes');
        if (!res.ok) {
          throw new Error(`API returned HTTP ${res.status}`);
        }
        const data = await res.json();

        if (isMounted) {
          if (data.isBlobAvailable) {
            if (Array.isArray(data.dishes)) {
              if (data.dishes.length > 0) {
                setDishes(data.dishes);
                localStorage.setItem('staycation_dishes', JSON.stringify(data.dishes));
              } else {
                // If cloud returned empty list but local has dishes, seed the cloud!
                const saved = localStorage.getItem('staycation_dishes');
                const localToPush = saved ? JSON.parse(saved) : INITIAL_NYNIKA_DISHES;
                if (localToPush && localToPush.length > 0) {
                  saveDishesToCloudAndLocal(localToPush);
                }
              }
              setSyncStatus('synced');
              setSyncReason('Synced with Vercel Cloud Blob Store');
            } else if (data.dishes === null) {
              setSyncStatus('synced');
              setSyncReason('Initializing new Vercel Blob Store...');
              const saved = localStorage.getItem('staycation_dishes');
              const initialToSync = saved ? JSON.parse(saved) : INITIAL_NYNIKA_DISHES;
              saveDishesToCloudAndLocal(initialToSync);
            }
          } else {
            setSyncStatus('local');
            setSyncReason(data.message || 'BLOB_READ_WRITE_TOKEN missing in Vercel project settings.');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Cloud Blob fetch fallback to local storage:', err.message);
          setSyncStatus('local');
          setSyncReason(`Local Mode: ${err.message}. (Backend /api/dishes unreachable or on local server without Vercel token)`);
        }
      }
    };

    fetchCloudDishes();
    const interval = setInterval(fetchCloudDishes, 8000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleAddDish = (newDish) => {
    const updated = [newDish, ...dishes];
    saveDishesToCloudAndLocal(updated);
    if (window.innerWidth <= 768) {
      setTimeout(() => setActiveMobileTab('dishes'), 1200);
    }
  };

  const handleDeleteDish = (id) => {
    const updated = dishes.filter((d) => d.id !== id);
    saveDishesToCloudAndLocal(updated);
  };

  return (
    <div className="app-container">
      {/* Header with User Selector & Cloud Sync Badge */}
      <Header
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
        syncStatus={syncStatus}
        syncReason={syncReason}
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
