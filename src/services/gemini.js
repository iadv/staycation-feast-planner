import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper to get active API key from Vercel env or localStorage
export const getStoredApiKey = () => {
  return (
    import.meta.env.STAYCATION_AI_KEY ||
    import.meta.env.PLANNER_GEMINI_KEY ||
    import.meta.env.VITE_STAYCATION_AI_KEY ||
    import.meta.env.GEMINI_API_KEY ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    localStorage.getItem('staycation_ai_key') ||
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

// Quick reply responses for Sushmitha after roast question
export const SUSHMITHA_QUICK_REPLIES = [
  "I swear I can cook this! 😇",
  "Only burnt it once, trust me! 😜",
  "It's 100% safe, no alarms! 🤫",
  "Google guided me! 📱",
  "If it fails, we order pizza! 🍕"
];

const MODEL_CANDIDATES = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];

/**
 * Main Gemini AI Parsing logic
 */
export async function parseDishWithGemini(userText, chefName, sushmithaStage = null, pendingDishName = null) {
  // 1. Try Vercel serverless function /api/chat
  try {
    const apiRes = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userText, chefName, sushmithaStage, pendingDishName })
    });

    if (apiRes.ok) {
      const json = await apiRes.json();
      if (json.success && json.data) {
        return json;
      }
    }
  } catch (err) {
    console.log('/api/chat endpoint unreachable, using client SDK fallback...');
  }

  // 2. Client SDK Fallback
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    return fallbackParseDish(userText, chefName, sushmithaStage, pendingDishName);
  }

  const isSushmitha = chefName === 'Sushmitha';
  const genAI = new GoogleGenerativeAI(apiKey);

  let sushmithaInstruction = '';
  if (isSushmitha) {
    if (sushmithaStage === 'awaiting_confirmation') {
      sushmithaInstruction = `SUSHMITHA CONFIRMATION TURN (Turn 2):
Sushmitha just answered your question about cooking ${pendingDishName || 'her dish'}.
Acknowledge her answer wittily (e.g. "Haha alright Sushmitha, I'll trust your word! Adding it to our staycation menu (keeping emergency pizza ready! 😜)"), and confirm that her dish is now added!`;
    } else {
      sushmithaInstruction = `SUSHMITHA DISH INTAKE TURN (Turn 1):
Sushmitha just named a dish (${userText}). DO NOT confirm adding it yet!
Ask her a funny, witty doubting question specifically about this dish: "Wait, Sushmitha... have you actually tried cooking ${userText} before, or are you experimenting on us for this staycation? 🍕🔥 Are you sure the smoke alarms are safe?"`;
    }
  }

  const systemPrompt = `
You are Chef Staycation AI — a warm, casual staycation buddy planning a 6-person feast with your friends.
Active Chef chatting with you: ${chefName} (${CHEF_TITLES[chefName] || 'Chef'}).

${sushmithaInstruction}

COMPREHENSIVE CULINARY INGREDIENT GENERATION INSTRUCTION:
1. Determine if the user is introducing/naming a dish or recipe to add to the menu (e.g. "Chicken Biryani", "Baked Salmon", "Pancakes", "Pasta", "Uggu").
   - If YES: Set "isDishEntry": true.
   - If NO (e.g. user says "Hello", "Hi", "How are you?", "What's up?"): Set "isDishEntry": false, set "dishName": null, and set "ingredients": [].

2. WHEN "isDishEntry" IS TRUE:
   - Generate a COMPREHENSIVE, REALISTIC culinary grocery list of ALL raw ingredients needed to cook that authentic dish for 6 people!

3. CHAT STYLE:
   - Chat naturally like a real human friend chatting in WhatsApp or Slack! Do NOT sound like a bot or assistant.

Return ONLY a raw JSON object matching this schema:
{
  "isDishEntry": true | false,
  "dishName": "Name of Dish or null",
  "mealType": "Breakfast | Lunch | Dinner | Snack | Dessert",
  "ingredients": [
    {
      "name": "Clean Raw Ingredient Name",
      "category": "Produce | Dairy | Meat & Protein | Bakery | Pantry & Spices | Beverages"
    }
  ],
  "aiReplyMessage": "Your natural human chat reply message"
}
`;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([systemPrompt, userText]);
      const responseText = result.response.text();
      
      const cleanedText = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const parsedData = JSON.parse(cleanedText);
      return {
        success: true,
        data: parsedData,
        modelUsed: modelName
      };
    } catch (err) {
      console.error(`Gemini model ${modelName} failed:`, err.message);
    }
  }

  return fallbackParseDish(userText, chefName, sushmithaStage, pendingDishName);
}

// Culinary dictionary for expanding dishes into real ingredients
function expandDishToIngredients(dishName) {
  const lower = (dishName || '').toLowerCase();
  
  if (lower.includes('salmon')) {
    return [
      { name: 'Salmon Fillets', category: 'Meat & Protein' },
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
      { name: 'Onions', category: 'Produce' },
      { name: 'Ginger & Garlic', category: 'Produce' },
      { name: 'Green Chillies', category: 'Produce' },
      { name: 'Mint & Coriander', category: 'Produce' },
      { name: 'Ghee / Cooking Oil', category: 'Pantry & Spices' },
      { name: 'Biryani Spices', category: 'Pantry & Spices' }
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

function fallbackParseDish(userText, chefName, sushmithaStage = null, pendingDishName = null) {
  const isSushmitha = chefName === 'Sushmitha';
  const lower = userText.trim().toLowerCase();

  const isGreeting = ['hello', 'hi', 'hey', 'hello!', 'hi!', 'hey!', 'how are you', 'what up', 'yo'].includes(lower);

  if (isGreeting) {
    return {
      success: true,
      data: {
        isDishEntry: false,
        dishName: null,
        mealType: null,
        ingredients: [],
        aiReplyMessage: `Hey ${chefName}! 👋 Great to see you! What delicious dish are you planning to make for our staycation?`
      }
    };
  }

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

  let aiReplyMessage = '';
  if (isSushmitha) {
    if (sushmithaStage === 'awaiting_confirmation') {
      aiReplyMessage = `Haha alright Sushmitha, I'll trust your word! 😜 Adding "${pendingDishName || dishName}" to the staycation feast menu! (Keeping emergency pizza ready just in case! 🍕)`;
    } else {
      aiReplyMessage = `Wait, Sushmitha... have you actually tried cooking "${dishName}" before, or are you experimenting on us for this staycation? 🍕🔥 On a scale from boiled water to emergency pizza, how safe are we? 😜`;
    }
  } else {
    aiReplyMessage = `Awesome choice, ${chefName}! "${dishName}" has been added to our staycation feast menu!`;
  }

  return {
    success: true,
    data: {
      isDishEntry: true,
      dishName,
      mealType,
      ingredients,
      aiReplyMessage
    }
  };
}
