import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper to get active API key from env or localStorage
export const getStoredApiKey = () => {
  return (
    import.meta.env.VITE_GEMINI_API_KEY ||
    localStorage.getItem('gemini_api_key') ||
    ''
  );
};

export const setStoredApiKey = (key) => {
  if (key) {
    localStorage.setItem('gemini_api_key', key.trim());
  } else {
    localStorage.removeItem('gemini_api_key');
  }
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
 * Main Gemini AI Parsing logic (Ingredients without quantities)
 */
export async function parseDishWithGemini(userText, chefName) {
  const apiKey = getStoredApiKey();

  if (!apiKey) {
    console.warn('Gemini API key missing. Using smart fallback parser.');
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

Extract the dish details from user natural language into a JSON object matching this schema:

{
  "dishName": "Name of Dish",
  "mealType": "Breakfast | Lunch | Dinner | Snack | Dessert",
  "ingredients": [
    {
      "name": "Ingredient Name (e.g. Rice, Lentils, Butter, Cheese)",
      "category": "Produce | Dairy | Meat & Protein | Bakery | Pantry & Spices | Beverages"
    }
  ],
  "aiReplyMessage": "Your AI reply message here"
}

IMPORTANT REQUIREMENTS:
1. Do NOT include quantities or units in ingredients. Just clean ingredient names!
2. Output ONLY valid JSON matching the schema. Do not output extra text outside JSON.
`;

    const result = await model.generateContent([systemPrompt, userText]);
    const responseText = result.response.text();
    
    const cleanedText = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsedData = JSON.parse(cleanedText);
    return {
      success: true,
      data: parsedData
    };
  } catch (err) {
    console.error('Gemini API parse error:', err);
    return fallbackParseDish(userText, chefName);
  }
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
  } else if (lower.includes('dinner') || lower.includes('biryani') || lower.includes('curry') || lower.includes('pasta')) {
    mealType = 'Dinner';
  } else if (lower.includes('snack') || lower.includes('fries') || lower.includes('orange')) {
    mealType = 'Snack';
  } else if (lower.includes('dessert') || lower.includes('cake') || lower.includes('ice cream') || lower.includes('sweet')) {
    mealType = 'Dessert';
  }

  // Extract dish name
  let dishName = userText.split(',')[0].replace(/(making|cooking|add|want to make|dish|for dinner|for lunch)/gi, '').trim();
  if (!dishName || dishName.length < 2) {
    dishName = `${chefName}'s Special Dish`;
  }
  dishName = dishName.charAt(0).toUpperCase() + dishName.slice(1);

  // Extract ingredient names without quantities
  const ingredients = [];
  const parts = userText.split(/,|\n|and/);

  parts.forEach(part => {
    let name = part.replace(/\d+\s*(g|kg|ml|l|pcs|tbsp|tsp|cup|cups|grams|kilos)?/gi, '').replace(/(making|cooking|with|need|needs|requires|for 6|people)/gi, '').trim();
    
    if (name && name.length > 1 && !name.toLowerCase().includes(dishName.toLowerCase())) {
      let category = 'Pantry & Spices';
      const nLower = name.toLowerCase();
      if (nLower.includes('chicken') || nLower.includes('mutton') || nLower.includes('fish') || nLower.includes('egg') || nLower.includes('paneer')) {
        category = nLower.includes('paneer') ? 'Dairy' : 'Meat & Protein';
      } else if (nLower.includes('milk') || nLower.includes('curd') || nLower.includes('butter') || nLower.includes('cheese') || nLower.includes('cream')) {
        category = 'Dairy';
      } else if (nLower.includes('tomato') || nLower.includes('onion') || nLower.includes('garlic') || nLower.includes('orange') || nLower.includes('lemon') || nLower.includes('lentil') || nLower.includes('rice')) {
        category = 'Produce';
      } else if (nLower.includes('bread') || nLower.includes('naan') || nLower.includes('bun') || nLower.includes('roti')) {
        category = 'Bakery';
      } else if (nLower.includes('coke') || nLower.includes('soda') || nLower.includes('juice') || nLower.includes('water')) {
        category = 'Beverages';
      }

      ingredients.push({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        category
      });
    }
  });

  if (ingredients.length === 0) {
    ingredients.push(
      { name: 'Fresh Ingredients & Spices', category: 'Pantry & Spices' }
    );
  }

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
