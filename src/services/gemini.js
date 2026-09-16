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

// Models to attempt in order of preference
const MODEL_CANDIDATES = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];

/**
 * Main Gemini AI Parsing logic
 */
export async function parseDishWithGemini(userText, chefName) {
  const apiKey = getStoredApiKey();

  if (!apiKey) {
    console.warn('No Gemini API Key found in environment variables. Using smart culinary parser.');
    return fallbackParseDish(userText, chefName, 'No Gemini API key found in env file or Vercel settings.');
  }

  const isSushmitha = chefName === 'Sushmitha';
  const genAI = new GoogleGenerativeAI(apiKey);

  const systemPrompt = `
You are Chef Staycation AI, managing a staycation feast for 6 people.
Active Chef: ${chefName} (${CHEF_TITLES[chefName] || 'Chef'}).

${
  isSushmitha
    ? `SPECIAL PERSONA FOR SUSHMITHA: Wittily tease and doubt her cooking skills for the dish she just mentioned! Ask if she's cooked it before or if smoke alarms will go off!`
    : `Keep your tone friendly, warm, conversational, and staycation-themed.`
}

The user will describe a dish (e.g. "Baked Salmon", "Butter Chicken", "Pancakes", "Pasta").
Your task:
1. Identify the exact dish name.
2. Break it down into its core underlying ingredients for a 6-person shopping list (e.g. For "Baked Salmon", ingredients MUST be "Salmon", "Lemon", "Garlic", "Olive Oil", "Black Pepper"). DO NOT put the dish name itself as an ingredient if it has cooking adjectives ("Baked", "Fried", "Grilled")!
3. Generate a friendly, conversational chat response.

OUTPUT FORMAT: Return ONLY a raw JSON object strictly matching this schema:
{
  "dishName": "Name of Dish",
  "mealType": "Breakfast | Lunch | Dinner | Snack | Dessert",
  "ingredients": [
    {
      "name": "Clean Ingredient Name",
      "category": "Produce | Dairy | Meat & Protein | Bakery | Pantry & Spices | Beverages"
    }
  ],
  "aiReplyMessage": "Conversational AI chat reply"
}
`;

  let lastErrorMsg = '';

  for (const modelName of MODEL_CANDIDATES) {
    try {
      console.log(`Sending prompt to Gemini model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([systemPrompt, userText]);
      const responseText = result.response.text();
      
      const cleanedText = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const parsedData = JSON.parse(cleanedText);

      // Safeguard: Ensure at least 1 ingredient exists
      if (!parsedData.ingredients || parsedData.ingredients.length === 0) {
        parsedData.ingredients = expandDishToIngredients(parsedData.dishName);
      }

      console.log('Gemini API Response Success:', parsedData);
      return {
        success: true,
        data: parsedData,
        modelUsed: modelName
      };
    } catch (err) {
      console.error(`Gemini model ${modelName} failed:`, err.message);
      lastErrorMsg = err.message || String(err);
    }
  }

  // If all Gemini model attempts failed (e.g. invalid/revoked API key)
  console.warn('Gemini API call failed across models. Using fallback parser.', lastErrorMsg);
  return fallbackParseDish(userText, chefName, lastErrorMsg);
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

  const cleanName = dishName
    .replace(/(baked|fried|roasted|grilled|steamed|crispy|special|homemade|curry|masala)/gi, '')
    .trim();

  return [
    { name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1), category: detectCategory(cleanName) },
    { name: 'Olive Oil / Cooking Oil', category: 'Pantry & Spices' },
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

function fallbackParseDish(userText, chefName, apiErrorNotice) {
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

  let dishName = userText
    .split(/,|\n|with|and/)[0]
    .replace(/(making|cooking|add|want to make|dish|for dinner|for lunch)/gi, '')
    .trim();

  if (!dishName || dishName.length < 2) {
    dishName = `${chefName}'s Special Dish`;
  }
  dishName = dishName.charAt(0).toUpperCase() + dishName.slice(1);

  const ingredients = expandDishToIngredients(dishName);

  let aiReplyMessage = isSushmitha
    ? `Wait, Sushmitha... are you SURE you've cooked "${dishName}" before without setting off smoke alarms? 🍕🔥 On a scale from boiled water to emergency pizza, how safe are we? 😜 (Added to menu!)`
    : `Awesome! "${dishName}" added to the staycation menu by Chef ${chefName}!`;

  if (apiErrorNotice && apiErrorNotice.includes('403 Forbidden')) {
    aiReplyMessage += ` [Note: Gemini API key error: 403 Forbidden - your API key in env was reported as revoked/invalid on Google Cloud]`;
  }

  return {
    success: true,
    data: {
      dishName,
      mealType,
      ingredients,
      aiReplyMessage
    },
    apiNotice: apiErrorNotice
  };
}
