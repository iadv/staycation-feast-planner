import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper to get active API key from Vercel env or localStorage
export const getStoredApiKey = () => {
  return (
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.GEMINI_API_KEY ||
    localStorage.getItem('gemini_api_key') ||
    ''
  );
};

// Fancy creative titles for chefs
export const CHEF_TITLES = {
  'Sushmitha': 'Master of Emergency Pizza 🍕🔥',
  'Nynika': 'Artisan Gourmet Specialist 👩‍🍳✨',
  'Pooja': 'Culinary Queen 👑🍳',
  'Pratyusha': 'Master Spice Crafter 🌶️✨',
  'Anvith': 'Grill & Roast Virtuoso 🍖🔥',
  'Hari Pavan': 'Feast Grandmaster 🏺📜',
  'Nithin': 'Street Food Connoisseur 🌮🍟'
};

// Quick reply responses for Sushmitha after roast
export const SUSHMITHA_QUICK_REPLIES = [
  "I swear I can cook this! 😇",
  "Only burnt it once, trust me! 😜",
  "It's 100% safe, no alarms! 🤫",
  "If it fails, we order pizza! 🍕"
];

/**
 * Main Gemini AI Parsing logic
 */
export async function parseDishWithGemini(userText, chefName) {
  const apiKey = getStoredApiKey();

  if (!apiKey) {
    console.log('No Gemini API key found in env. Using smart culinary parser.');
    return fallbackParseDish(userText, chefName);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const isSushmitha = chefName === 'Sushmitha';

    const systemPrompt = `
You are Chef Staycation AI managing a staycation menu for 6 people.
Selected Chef: ${chefName} (${CHEF_TITLES[chefName] || 'Chef'}).

${
  isSushmitha
    ? `SPECIAL PERSONA FOR SUSHMITHA: Wittily tease and doubt her cooking skills for the dish she just mentioned, asking if she's cooked it before or if smoke alarms will go off!`
    : `Keep your tone friendly, enthusiastic, and staycation-themed.`
}

The user will input a dish name (e.g. "Baked Salmon", "Butter Chicken", "Pancakes", "Pasta").
Your job is to extract the dish name AND break it down into its core raw culinary ingredients!

CRITICAL INGREDIENT RULES:
1. DO NOT use the dish name itself as an ingredient if it includes cooking methods! (e.g. For "Baked Salmon", ingredients MUST be "Salmon", "Lemon", "Garlic", "Olive Oil", "Herbs & Spices").
2. Remove cooking adjectives ("Baked", "Fried", "Roasted", "Grilled", "Steamed", "Crispy") from ingredient names!
3. Output ONLY a valid JSON object matching this schema:

{
  "dishName": "Name of Dish (e.g. Baked Salmon)",
  "mealType": "Breakfast | Lunch | Dinner | Snack | Dessert",
  "ingredients": [
    {
      "name": "Clean Raw Ingredient Name (e.g. Salmon)",
      "category": "Produce | Dairy | Meat & Protein | Bakery | Pantry & Spices | Beverages"
    }
  ],
  "aiReplyMessage": "Your AI reply message here"
}
`;

    const result = await model.generateContent([systemPrompt, userText]);
    const responseText = result.response.text();
    
    const cleanedText = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsedData = JSON.parse(cleanedText);

    // Fallback safeguard if AI returned 0 ingredients
    if (!parsedData.ingredients || parsedData.ingredients.length === 0) {
      parsedData.ingredients = expandDishToIngredients(parsedData.dishName);
    }

    return {
      success: true,
      data: parsedData
    };
  } catch (err) {
    console.error('Gemini API parse error, using culinary fallback:', err);
    return fallbackParseDish(userText, chefName);
  }
}

// Culinary dictionary for expanding dishes into real ingredients
function expandDishToIngredients(dishName) {
  const lower = (dishName || '').toLowerCase();
  
  if (lower.includes('salmon')) {
    return [
      { name: 'Salmon', category: 'Meat & Protein' },
      { name: 'Lemon', category: 'Produce' },
      { name: 'Garlic', category: 'Produce' },
      { name: 'Olive Oil', category: 'Pantry & Spices' },
      { name: 'Black Pepper & Herbs', category: 'Pantry & Spices' }
    ];
  } else if (lower.includes('chicken') || lower.includes('biryani')) {
    return [
      { name: 'Chicken', category: 'Meat & Protein' },
      { name: 'Basmati Rice', category: 'Produce' },
      { name: 'Curd / Yogurt', category: 'Dairy' },
      { name: 'Onions & Garlic', category: 'Produce' },
      { name: 'Indian Spices', category: 'Pantry & Spices' }
    ];
  } else if (lower.includes('pasta') || lower.includes('spaghetti')) {
    return [
      { name: 'Pasta', category: 'Bakery' },
      { name: 'Tomatoes', category: 'Produce' },
      { name: 'Garlic', category: 'Produce' },
      { name: 'Cheese', category: 'Dairy' },
      { name: 'Olive Oil & Oregano', category: 'Pantry & Spices' }
    ];
  } else if (lower.includes('pancake')) {
    return [
      { name: 'Pancake Mix / Flour', category: 'Bakery' },
      { name: 'Milk', category: 'Dairy' },
      { name: 'Eggs', category: 'Meat & Protein' },
      { name: 'Maple Syrup', category: 'Pantry & Spices' },
      { name: 'Butter', category: 'Dairy' }
    ];
  } else if (lower.includes('pizza')) {
    return [
      { name: 'Pizza Dough / Base', category: 'Bakery' },
      { name: 'Mozzarella Cheese', category: 'Dairy' },
      { name: 'Tomato Sauce', category: 'Pantry & Spices' },
      { name: 'Bell Peppers & Mushrooms', category: 'Produce' }
    ];
  } else if (lower.includes('burger')) {
    return [
      { name: 'Burger Buns', category: 'Bakery' },
      { name: 'Patties', category: 'Meat & Protein' },
      { name: 'Cheese Slices', category: 'Dairy' },
      { name: 'Lettuce & Tomatoes', category: 'Produce' }
    ];
  } else if (lower.includes('salad')) {
    return [
      { name: 'Mixed Salad Greens', category: 'Produce' },
      { name: 'Cucumbers & Tomatoes', category: 'Produce' },
      { name: 'Olive Oil & Dressing', category: 'Pantry & Spices' }
    ];
  } else if (lower.includes('uggu')) {
    return [
      { name: 'Rice', category: 'Produce' },
      { name: 'Lentils', category: 'Produce' }
    ];
  } else if (lower.includes('orange')) {
    return [
      { name: 'Fresh Oranges', category: 'Produce' }
    ];
  }

  // General clean item fallback
  const cleanName = dishName
    .replace(/(baked|fried|roasted|grilled|steamed|crispy|special|homemade|curry|masala)/gi, '')
    .trim();

  return [
    { name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1), category: detectCategory(cleanName) },
    { name: 'Olive Oil / Butter', category: 'Dairy' },
    { name: 'Seasoning & Spices', category: 'Pantry & Spices' }
  ];
}

function detectCategory(name) {
  const nLower = (name || '').toLowerCase();
  if (nLower.includes('salmon') || nLower.includes('chicken') || nLower.includes('mutton') || nLower.includes('fish') || nLower.includes('egg') || nLower.includes('steak') || nLower.includes('prawn')) {
    return 'Meat & Protein';
  } else if (nLower.includes('milk') || nLower.includes('curd') || nLower.includes('butter') || nLower.includes('cheese') || nLower.includes('cream') || nLower.includes('paneer')) {
    return 'Dairy';
  } else if (nLower.includes('tomato') || nLower.includes('onion') || nLower.includes('garlic') || nLower.includes('orange') || nLower.includes('lemon') || nLower.includes('lentil') || nLower.includes('rice') || nLower.includes('salad')) {
    return 'Produce';
  } else if (nLower.includes('bread') || nLower.includes('naan') || nLower.includes('bun') || nLower.includes('roti') || nLower.includes('pasta')) {
    return 'Bakery';
  } else if (nLower.includes('coke') || nLower.includes('soda') || nLower.includes('juice') || nLower.includes('water')) {
    return 'Beverages';
  }
  return 'Pantry & Spices';
}

/**
 * Smart Fallback Parser when API Key is missing or call fails
 */
function fallbackParseDish(userText, chefName) {
  const isSushmitha = chefName === 'Sushmitha';
  const lower = userText.toLowerCase();

  let mealType = 'Lunch';
  if (lower.includes('breakfast') || lower.includes('pancake') || lower.includes('egg') || lower.includes('uggu') || lower.includes('dosa')) {
    mealType = 'Breakfast';
  } else if (lower.includes('dinner') || lower.includes('biryani') || lower.includes('curry') || lower.includes('pasta') || lower.includes('salmon')) {
    mealType = 'Dinner';
  } else if (lower.includes('snack') || lower.includes('fries') || lower.includes('orange')) {
    mealType = 'Snack';
  } else if (lower.includes('dessert') || lower.includes('cake') || lower.includes('ice cream')) {
    mealType = 'Dessert';
  }

  // Extract dish name
  let dishName = userText
    .split(/,|\n|with|and/)[0]
    .replace(/(making|cooking|add|want to make|dish|for dinner|for lunch)/gi, '')
    .trim();

  if (!dishName || dishName.length < 2) {
    dishName = `${chefName}'s Special Dish`;
  }
  dishName = dishName.charAt(0).toUpperCase() + dishName.slice(1);

  // Expand dish into real underlying ingredients
  const ingredients = expandDishToIngredients(dishName);

  const aiReplyMessage = isSushmitha
    ? `Wait, Sushmitha... are you SURE you've cooked "${dishName}" before without setting off smoke alarms? 🍕🔥 On a scale from boiled water to emergency pizza, how safe are we? 😜 (Added to menu!)`
    : `Awesome! "${dishName}" added to the staycation menu by Chef ${chefName}!`;

  return {
    success: true,
    data: {
      dishName,
      mealType,
      ingredients,
      aiReplyMessage
    }
  };
}
