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

// Array of witty doubting questions for Sushmitha
export const SUSHMITHA_ROAST_QUESTIONS = [
  "Wait, Sushmitha... 🛑 before we add anything to the staycation menu, are you *sure* you've cooked this before without setting off smoke alarms? 🍕🔥",
  "Hold up, Sushmitha! 🚨 On a scale of 1 to 'Emergency Pizza Order', how confident are you in this dish?",
  "Sushmitha! 🕵️‍♀️ Quick security check: does this recipe involve actual cooking, or are you just boiling water and hoping for the best?",
  "Are we taking a staycation health risk with your cooking, Sushmitha? 😜 Tell me what dish you're attempting to add!",
  "Wait, Sushmitha... did you find this recipe on TikTok 5 minutes ago, or have you actually tested it on live humans before? 🧪"
];

// Quick reply responses for Sushmitha
export const SUSHMITHA_QUICK_REPLIES = [
  "I swear I can cook this! 😇",
  "Only burnt it once, trust me! 😜",
  "It's a secret family recipe! 🤫",
  "Google will guide me! 📱",
  "If it fails, we order pizza! 🍕"
];

export const getRandomSushmithaRoast = () => {
  const index = Math.floor(Math.random() * SUSHMITHA_ROAST_QUESTIONS.length);
  return SUSHMITHA_ROAST_QUESTIONS[index];
};

/**
 * Main Gemini AI Parsing logic
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
You are Chef Staycation AI, managing a staycation feast for 6 people.
Selected Chef: ${chefName}.

${
  isSushmitha
    ? `SPECIAL PERSONA: ${chefName} is Sushmitha! You must playfully and wittily tease/doubt her cooking skills in your response text while extracting her dish accurately. Keep it light, funny, and friendly.`
    : `Keep your tone friendly, enthusiastic, and staycation-themed.`
}

The user will describe a dish they want to make along with its ingredients in natural language.
Extract the details into a valid JSON object strictly matching this schema:

{
  "dishName": "Name of Dish",
  "mealType": "Breakfast | Lunch | Dinner | Snack | Dessert",
  "servingsBase": 6,
  "ingredients": [
    {
      "name": "Ingredient name (clean, e.g. Tomato)",
      "quantity": 500,
      "unit": "g | kg | ml | L | pcs | tbsp | tsp | cup | pinch",
      "category": "Produce | Dairy | Meat & Protein | Bakery | Pantry & Spices | Beverages"
    }
  ],
  "aiReplyMessage": "Your reply message here"
}

IMPORTANT REQUIREMENTS:
1. Normalize ingredient quantities for a total of 6 staycationers.
2. Output ONLY the JSON block. Do not wrap in extra markdown or commentary outside JSON.
`;

    const result = await model.generateContent([systemPrompt, userText]);
    const responseText = result.response.text();
    
    // Clean JSON markdown formatting if present
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
 * Smart Fallback Parser when API Key is not set or API call fails
 */
function fallbackParseDish(userText, chefName) {
  const isSushmitha = chefName === 'Sushmitha';

  // Basic regex extraction
  const lower = userText.toLowerCase();
  
  // Guess meal type
  let mealType = 'Lunch';
  if (lower.includes('breakfast') || lower.includes('pancake') || lower.includes('egg') || lower.includes('dosa') || lower.includes('idli')) {
    mealType = 'Breakfast';
  } else if (lower.includes('dinner') || lower.includes('biryani') || lower.includes('curry') || lower.includes('pulao')) {
    mealType = 'Dinner';
  } else if (lower.includes('snack') || lower.includes('fries') || lower.includes('samosa') || lower.includes('chips')) {
    mealType = 'Snack';
  } else if (lower.includes('dessert') || lower.includes('cake') || lower.includes('ice cream') || lower.includes('sweet') || lower.includes('halwa')) {
    mealType = 'Dessert';
  }

  // Extract dish name
  let dishName = userText.split(',')[0].replace(/(making|cooking|add|want to make|dish|for dinner|for lunch)/gi, '').trim();
  if (!dishName || dishName.length < 2) {
    dishName = `${chefName}'s Special Recipe`;
  }
  // Capitalize dish name
  dishName = dishName.charAt(0).toUpperCase() + dishName.slice(1);

  // Extract potential ingredients
  const ingredients = [];
  const parts = userText.split(/,|\n|and/);

  parts.forEach(part => {
    const trimmed = part.trim();
    if (trimmed && !trimmed.toLowerCase().includes('making') && !trimmed.toLowerCase().includes('cooking')) {
      // Check for quantity
      const match = trimmed.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]*)\s+(.+)/);
      if (match) {
        const qty = parseFloat(match[1]) || 1;
        const rawUnit = match[2].toLowerCase();
        const name = match[3].replace(/(scaled|for 6|people)/gi, '').trim();

        let unit = 'pcs';
        if (['g', 'gram', 'grams'].includes(rawUnit)) unit = 'g';
        else if (['kg', 'kilo', 'kilograms'].includes(rawUnit)) unit = 'kg';
        else if (['ml'].includes(rawUnit)) unit = 'ml';
        else if (['l', 'liter', 'liters'].includes(rawUnit)) unit = 'L';
        else if (['tbsp', 'tablespoon'].includes(rawUnit)) unit = 'tbsp';
        else if (['tsp', 'teaspoon'].includes(rawUnit)) unit = 'tsp';

        // Assign category
        let category = 'Pantry & Spices';
        const nLower = name.toLowerCase();
        if (nLower.includes('chicken') || nLower.includes('mutton') || nLower.includes('fish') || nLower.includes('egg') || nLower.includes('paneer') || nLower.includes('tofu')) {
          category = nLower.includes('paneer') ? 'Dairy' : 'Meat & Protein';
        } else if (nLower.includes('milk') || nLower.includes('curd') || nLower.includes('butter') || nLower.includes('cheese') || nLower.includes('cream')) {
          category = 'Dairy';
        } else if (nLower.includes('tomato') || nLower.includes('onion') || nLower.includes('garlic') || nLower.includes('ginger') || nLower.includes('chilli') || nLower.includes('coriander') || nLower.includes('potato') || nLower.includes('lemon')) {
          category = 'Produce';
        } else if (nLower.includes('bread') || nLower.includes('naan') || nLower.includes('bun') || nLower.includes('roti') || nLower.includes('pav')) {
          category = 'Bakery';
        } else if (nLower.includes('coke') || nLower.includes('soda') || nLower.includes('juice') || nLower.includes('water') || nLower.includes('beer')) {
          category = 'Beverages';
        }

        ingredients.push({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          quantity: qty * 6, // scale default for 6 people
          unit,
          category
        });
      } else if (trimmed.length > 2 && !trimmed.toLowerCase().includes(dishName.toLowerCase())) {
        ingredients.push({
          name: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
          quantity: 6, // default 6 portion items
          unit: 'pcs',
          category: 'Pantry & Spices'
        });
      }
    }
  });

  // If no specific ingredients found, add baseline
  if (ingredients.length === 0) {
    ingredients.push(
      { name: 'Main Spice Mix & Seasoning', quantity: 1, unit: 'pack', category: 'Pantry & Spices' },
      { name: 'Cooking Oil / Ghee', quantity: 200, unit: 'ml', category: 'Pantry & Spices' }
    );
  }

  const aiReplyMessage = isSushmitha
    ? `Haha! Alright Sushmitha, I've added "${dishName}" to the staycation menu for 6 people! (We'll keep the fire extinguisher handy just in case! 🔥😜)`
    : `Awesome! "${dishName}" has been added to the staycation feast for 6 people!`;

  return {
    success: true,
    data: {
      dishName,
      mealType,
      servingsBase: 6,
      ingredients,
      aiReplyMessage
    }
  };
}
