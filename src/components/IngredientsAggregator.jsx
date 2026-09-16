import React, { useState, useMemo } from 'react';
import { ShoppingBag, Check, Copy, Download, Utensils } from 'lucide-react';

export default function IngredientsAggregator({ dishes }) {
  const [checkedItems, setCheckedItems] = useState({});

  // Consolidate ingredients across dishes and track which dishes require them
  const aggregatedCategories = useMemo(() => {
    const map = {};

    dishes.forEach((dish) => {
      dish.ingredients.forEach((ing) => {
        const key = ing.name.toLowerCase().trim();
        const cat = ing.category || 'Pantry & Spices';

        if (!map[key]) {
          map[key] = {
            name: ing.name,
            category: cat,
            dishes: new Set()
          };
        }

        map[key].dishes.add(dish.dishName);
      });
    });

    const categories = {
      'Produce': [],
      'Dairy': [],
      'Meat & Protein': [],
      'Bakery': [],
      'Pantry & Spices': [],
      'Beverages': []
    };

    Object.values(map).forEach((item) => {
      const categoryKey = categories[item.category] ? item.category : 'Pantry & Spices';
      categories[categoryKey].push({
        name: item.name,
        dishes: Array.from(item.dishes)
      });
    });

    return categories;
  }, [dishes]);

  const totalItemsCount = useMemo(() => {
    return Object.values(aggregatedCategories).reduce(
      (acc, items) => acc + items.length,
      0
    );
  }, [aggregatedCategories]);

  const checkedCount = useMemo(() => {
    return Object.keys(checkedItems).filter((key) => checkedItems[key]).length;
  }, [checkedItems]);

  const toggleCheck = (name) => {
    setCheckedItems((prev) => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const categoryIcons = {
    'Produce': '🥬',
    'Dairy': '🥛',
    'Meat & Protein': '🥩',
    'Bakery': '🍞',
    'Pantry & Spices': '🧂',
    'Beverages': '🥤'
  };

  const handleCopyList = () => {
    let text = `🛒 STAYCATION COLLECTIVE GROCERY LIST (FOR 6 PEOPLE)\n\n`;
    Object.entries(aggregatedCategories).forEach(([category, items]) => {
      if (items.length > 0) {
        text += `--- ${category.toUpperCase()} ---\n`;
        items.forEach((item) => {
          const isDone = checkedItems[item.name] ? '[x]' : '[ ]';
          text += `${isDone} ${item.name} (For: ${item.dishes.join(', ')})\n`;
        });
        text += `\n`;
      }
    });

    navigator.clipboard.writeText(text);
    alert('Copied staycation shopping list to clipboard!');
  };

  const handleDownloadList = () => {
    let text = `=======================================\n`;
    text += ` 🏖️ STAYCATION COLLECTIVE GROCERY LIST \n`;
    text += `=======================================\n\n`;

    Object.entries(aggregatedCategories).forEach(([category, items]) => {
      if (items.length > 0) {
        text += `[ ${category.toUpperCase()} ]\n`;
        items.forEach((item) => {
          text += `  • ${item.name} (Dish: ${item.dishes.join(', ')})\n`;
        });
        text += `\n`;
      }
    });

    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `staycation_collective_grocery_list.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="panel-card ingredients-section">
      <div className="panel-header">
        <div className="panel-title">
          <ShoppingBag size={18} style={{ color: 'var(--accent-emerald)' }} />
          <span>Collective Ingredients for 6 People</span>
        </div>
        <div className="ingredients-toolbar">
          <button className="action-icon-btn" onClick={handleCopyList} title="Copy list to clipboard">
            <Copy size={14} /> Copy
          </button>
          <button className="action-icon-btn" onClick={handleDownloadList} title="Download TXT">
            <Download size={14} /> Download
          </button>
        </div>
      </div>

      {totalItemsCount === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🛒</span>
          <p style={{ fontWeight: 600, color: 'white' }}>Shopping list is currently empty</p>
          <p style={{ fontSize: '0.82rem' }}>Select a chef on the left and enter dishes to generate ingredients!</p>
        </div>
      ) : (
        <div className="categories-container">
          {/* Progress bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>Grocery Progress</span>
              <span>{checkedCount} / {totalItemsCount} items gathered</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${totalItemsCount > 0 ? (checkedCount / totalItemsCount) * 100 : 0}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--accent-emerald), var(--primary))',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>

          {Object.entries(aggregatedCategories).map(([category, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={category} className="category-group">
                <h4 className="category-title">
                  <span>{categoryIcons[category] || '📦'}</span>
                  <span>{category}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>({items.length})</span>
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {items.map((item, index) => {
                    const isChecked = Boolean(checkedItems[item.name]);
                    return (
                      <div
                        key={index}
                        className={`ingredient-item ${isChecked ? 'checked' : ''}`}
                        onClick={() => toggleCheck(item.name)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0.85rem' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div className="checkbox-custom">
                            {isChecked && <Check size={12} />}
                          </div>
                          <span className="item-name" style={{ fontWeight: 600, color: 'white', fontSize: '0.9rem' }}>
                            {item.name}
                          </span>
                        </div>

                        {/* Dish source cards/tags */}
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {item.dishes.map((dishName, dIdx) => (
                            <span
                              key={dIdx}
                              style={{
                                background: 'rgba(99, 102, 241, 0.18)',
                                border: '1px solid rgba(99, 102, 241, 0.35)',
                                color: '#a5b4fc',
                                fontSize: '0.72rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '99px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <Utensils size={10} /> {dishName}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
