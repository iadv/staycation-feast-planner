# 🏖️ Staycation 6 Feast Planner & Collective Grocery Hub

A sleek, AI-powered web app designed for planning meals and generating a collective shopping list scaled for **6 people** on a staycation.

### 🌟 Key Features

1. **Mandatory User Selector Dropdown**:
   Choose from the 7 staycationers:
   - 🌶️ **Sushmitha** *(Features exclusive Witty AI Roast Mode doubting her cooking skills!)*
   - 🍲 **Pooja**
   - 🥗 **Pratyusha**
   - 🍳 **Anvith**
   - 🍛 **Hari Pavan**
   - 🍔 **Nithin**
   - 🍰 **Nynika**

2. **Natural Language AI Chat Intake (Left Pane)**:
   - Chat with **Chef Staycation AI** (powered by Gemini API).
   - Enter recipes naturally (e.g., *"Cooking Butter Chicken for dinner with 600g chicken, 200g butter, garlic, cream, naan"*).
   - **Sushmitha Easter Egg**: When Sushmitha selects her name, the AI immediately doubts her culinary skills with hilarious witty roasts and quick reply buttons!

3. **Entered Dish List (Right Top Pane)**:
   - Displays all added staycation dishes with chef badges, meal categories, and ingredients breakdown.

4. **Collective 6-Person Shopping List (Right Bottom Pane)**:
   - Aggregates and sums all ingredients across all entered dishes.
   - Categorized into supermarket aisles: 🥩 Meat & Protein, 🥛 Dairy, 🥬 Produce, 🍞 Bakery, 🧂 Pantry & Spices, 🥤 Beverages.
   - Interactive shopping progress checklist, copy-to-clipboard, and text file export.

---

## 🔑 Environment & Gemini API Setup

Create a `.env` file in the root folder with your Gemini API Key:

```env
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

*(You can also set or change the Gemini API Key inside the browser app by clicking the key icon button in the header!)*

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🌐 Hosting on GitHub Pages / GitHub

To host this repository on GitHub:

### Option A: Standard GitHub Pages Deployment
1. Create a new GitHub repository at `https://github.com/new`.
2. Initialize git and push your project:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Staycation Feast Planner"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/staycation-feast-planner.git
   git push -u origin main
   ```
3. Install `gh-pages`:
   ```bash
   npm install --save-dev gh-pages
   ```
4. Add deployment scripts to your `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
5. Run deployment:
   ```bash
   npm run deploy
   ```

### Option B: Deploying with Vercel / Netlify
Simply import your GitHub repository into Vercel or Netlify and set the environment variable `VITE_GEMINI_API_KEY` in the project settings dashboard!
