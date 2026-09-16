import React from 'react';
import { Utensils, Trash2, Flame, Sparkles, ChefHat } from 'lucide-react';

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
        {dishes.length > 0 && (
          <button className="sample-menu-btn" onClick={onLoadSampleMenu} title="Reset to sample staycation dishes">
            + Reset Sample Menu
          </button>
        )}
      </div>

      {dishes.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🍳</span>
          <p style={{ fontWeight: 600, color: 'white' }}>No dishes added yet for the staycation!</p>
          <p style={{ fontSize: '0.82rem' }}>
            Select a staycationer on the left and describe what you're cooking in the chat!
          </p>
          <button className="sample-menu-btn" onClick={onLoadSampleMenu}>
            ✨ Load Sample Staycation Menu (6 People)
          </button>
        </div>
      ) : (
        <div className="dish-grid">
          {dishes.map((dish) => {
            const isSushmitha = dish.chef === 'Sushmitha';
            return (
              <div
                key={dish.id}
                className={`dish-card ${isSushmitha ? 'by-sushmitha' : ''}`}
              >
                <div className="dish-header-row">
                  <div>
                    <h3 className="dish-name">{dish.dishName}</h3>
                    <div className="dish-meta">
                      <span className={`chef-badge ${isSushmitha ? 'sushmitha' : ''}`}>
                        {isSushmitha ? <Flame size={12} /> : <ChefHat size={12} />}
                        Chef {dish.chef}
                      </span>
                      <span>• {dish.mealType || 'Meal'}</span>
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

                <div className="dish-ingredients-preview">
                  <strong>Ingredients (for 6):</strong>{' '}
                  {dish.ingredients.map((ing) => `${ing.quantity}${ing.unit} ${ing.name}`).join(', ')}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
