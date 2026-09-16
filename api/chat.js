import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userText, chefName, sushmithaStage, pendingDishName } = req.body || {};
  if (!userText) {
    return res.status(400).json({ error: 'userText is required' });
  }

  const apiKey =
    process.env.STAYCATION_AI_KEY ||
    process.env.PLANNER_GEMINI_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.VITE_STAYCATION_AI_KEY ||
    process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(400).json({
      error: 'No Gemini API key found in Vercel environment variables (STAYCATION_AI_KEY)'
    });
  }

  const CHEF_TITLES = {
    'Sushmitha': 'Master of Emergency Pizza 🍕🔥',
    'Nynika': 'Artisan Gourmet Specialist 👩‍🍳✨',
    'Pooja': 'Culinary Queen 👑🍳',
    'Pratyusha': 'Master Spice Crafter 🌶️✨',
    'Anvith': 'Grill & Roast Virtuoso 🍖🔥',
    'Hari Pavan': 'Feast Grandmaster 🏺📜',
    'Nithin': 'Street Food Connoisseur 🌮🍟'
  };

  const isSushmitha = chefName === 'Sushmitha';

  let sushmithaInstruction = '';
  if (isSushmitha) {
    if (sushmithaStage === 'awaiting_confirmation') {
      sushmithaInstruction = `SUSHMITHA CONFIRMATION TURN (Turn 2):
Sushmitha just replied to your question about cooking ${pendingDishName || 'her dish'}.
Acknowledge her answer wittily (e.g. "Haha alright Sushmitha, I'll trust your word! Adding it to the staycation menu (keeping the fire extinguisher handy just in case! 😜)"), and confirm that her dish is now added to the menu!`;
    } else {
      sushmithaInstruction = `SUSHMITHA DISH INTAKE TURN (Turn 1):
Sushmitha just named a dish (${userText}). DO NOT confirm adding it yet!
Ask her a funny, witty doubting question specifically about this dish, like: "Wait, Sushmitha... have you actually tried cooking ${userText} before, or are you experimenting on us for this staycation? 🍕🔥 Are you sure the smoke alarms are safe?"`;
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
   - Do NOT limit ingredients to only what the user explicitly typed! Expand the dish into its complete raw ingredient list!

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

  const MODEL_CANDIDATES = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
  const genAI = new GoogleGenerativeAI(apiKey);

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
      return res.status(200).json({
        success: true,
        data: parsedData,
        modelUsed: modelName
      });
    } catch (err) {
      console.error(`Vercel API route model ${modelName} failed:`, err.message);
    }
  }

  return res.status(500).json({ error: 'All Gemini API model calls failed' });
}
