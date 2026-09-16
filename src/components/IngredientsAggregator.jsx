import React, { useState, useMemo } from 'react';
import { ShoppingBag, Check, Copy, Download, Users, Layers } from 'lucide-react';

export default function IngredientsAggregator({ dishes }) {
  const [checkedItems, setCheckedItems] = useState({});

  // Consolidate & aggregate ingredients across all dishes
  const aggregatedCategories = useMemo(() => {
    const map = {};

    dishes.forEach((dish) => {
      dish.ingredients.forEach((ing) => {
        const key = ing.name.toLowerCase().trim();
        const cat = ing.category || 'Pantry & Spices';

        if (!map[key]) {
          map[key] = {
            name: ing.name,
            quantity: 0,
            unit: ing.unit || 'pcs',
            category: cat
          };
        }

        map[key].quantity += Number(ing.quantity) || 1;
      });
    });

    // Group by category
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
      categories[categoryKey].push(item);
    });

    return categories;
  }, [dishes]);

  // Total count of unique ingredients
  const totalItemsCount = useMemo(() => {
    return Object.values(aggregatedCategories).reduce(
      (acc, items) => acc + items.length,
      0
    );
  }, [aggregatedCategories]);

  // Count checked items
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

  // Copy list to clipboard
  const handleCopyList = () => {
    let text = `🛒 STAYCATION SHOPPING LIST FOR 6 PEOPLE\n\n`;
    Object.entries(aggregatedCategories).forEach(([category, items]) => {
      if (items.length > 0) {
        text += `--- ${category.toUpperCase()} ---\n`;
        items.forEach((item) => {
          const isDone = checkedItems[item.name] ? '[x]' : '[ ]';
          text += `${isDone} ${item.quantity} ${item.unit} - ${item.name}\n`;
        });
        text += `\n`;
      }
    });

    navigator.clipboard.writeText(text);
    alert('Copied 6-person staycation shopping list to clipboard!');
  };

  // Download list as text file
  const handleDownloadList = () => {
    let text = `=======================================\n`;
    text += ` 🏖️ STAYCATION SHOPPING LIST (6 PEOPLE) \n`;
    text += `=======================================\n\n`;

    Object.entries(aggregatedCategories).forEach(([category, items]) => {
      if (items.length > 0) {
        text += `[ ${category.toUpperCase()} ]\n`;
        items.forEach((item) => {
          text += `  • ${item.quantity} ${item.unit} - ${item.name}\n`;
        });
        text += `\n`;
      }
    });

    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `staycation_grocery_list_6people.txt`;
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
          <span className="badge-scale">
            <Users size={13} /> Scaled for 6
          </span>
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
          <p style={{ fontSize: '0.82rem' }}>Add dishes on the left to generate the aggregated grocery list!</p>
        </div>
      ) : (
        <div className="categories-container">
          {/* Progress bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>Shopping Progress</span>
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

                <ul className="ingredient-list">
                  {items.map((item, index) => {
                    const isChecked = Boolean(checkedItems[item.name]);
                    return (
                      <li
                        key={index}
                        className={`ingredient-item ${isChecked ? 'checked' : ''}`}
                        onClick={() => toggleCheck(item.name)}
                      >
                        <div className="checkbox-custom">
                          {isChecked && <Check size={12} />}
                        </div>
                        <span className="item-qty">
                          {item.quantity} {item.unit}
                        </span>
                        <span className="item-name">{item.name}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
