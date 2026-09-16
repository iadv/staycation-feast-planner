import React from 'react';
import { Utensils, Trash2, Flame, ChefHat, Sparkles } from 'lucide-react';
import { CHEF_TITLES } from '../services/gemini';

export default function DishList({ dishes, onDeleteDish, onLoadSampleMenu }) {
  return (
    <div className="panel-card dish-section">
      <div className="panel-header">
        <div className="panel-title">
          <Utensils size={18} style={{ color: 'var(--accent-amber)' }} />
          <span>Entered Dish List</span>
          <span className="badge-people" style={{ marginLeft: '0.4rem', fontSize: '0.72rem' }}>
            {dishes.length} {dishes.length === 1 ? 'Dish' : 'Dishes'}
          </span>
        </div>
      </div>

      {dishes.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🍳</span>
          <p style={{ fontWeight: 600, color: 'white' }}>No dishes added yet for the staycation!</p>
          <p style={{ fontSize: '0.82rem' }}>
            Select your name from the top dropdown and enter what you're cooking in the chat!
          </p>
        </div>
      ) : (
        <div className="dish-grid">
          {dishes.map((dish) => {
            const isSushmitha = dish.chef === 'Sushmitha';
            const creativeTitle = CHEF_TITLES[dish.chef] || 'Staycation Chef';

            return (
              <div
                key={dish.id}
                className={`dish-card ${isSushmitha ? 'by-sushmitha' : ''}`}
              >
                <div className="dish-header-row">
                  <div>
                    <h3 className="dish-name">{dish.dishName}</h3>
                    <div className="dish-meta" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.2rem', marginTop: '0.25rem' }}>
                      <span className={`chef-badge ${isSushmitha ? 'sushmitha' : ''}`}>
                        {isSushmitha ? <Flame size={12} /> : <ChefHat size={12} />}
                        Chef {dish.chef}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: isSushmitha ? '#ff9d76' : '#cbd5e1', fontWeight: 600 }}>
                        {creativeTitle}
                      </span>
                    </div>
                  </div>
                  <button
                    className="delete-dish-btn"
                    onClick={() => onDeleteDish(dish.id)}
                    title="Delete Dish"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="dish-ingredients-preview" style={{ marginTop: '0.4rem' }}>
                  <strong>Ingredients:</strong>{' '}
                  {dish.ingredients.map((ing) => ing.name).join(', ')}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
