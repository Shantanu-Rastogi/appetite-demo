const LUMINA_MENU = [
  // --- STARTERS ---
  { id: 1, category: 'Starters', name: 'Dynamite Prawns', desc: 'Crispy fried prawns tossed in spicy dynamite sauce.', price: 575, costPrice: 172, image: '🍤', tags: ['Must Try'], dietary: 'non-veg' },
  { id: 2, category: 'Starters', name: 'Mutton Seekh', desc: 'Minced mutton with spices, skewered and char-grilled.', price: 575, costPrice: 172, image: '🍢', dietary: 'non-veg' },
  { id: 3, category: 'Starters', name: 'Cheesling Bhel', desc: 'A nostalgic bar snack tossed with onions, tomatoes, and tangy chutney.', price: 300, costPrice: 90, image: '🥣', dietary: 'veg' },
  { id: 4, category: 'Starters', name: 'Truffle Fries', desc: 'Crispy fries tossed in truffle oil and parmesan.', price: 350, costPrice: 105, image: '🍟', dietary: 'veg' },
  { id: 5, category: 'Starters', name: 'Chicken Wings', desc: 'Hot & spicy buffalo wings with blue cheese dip.', price: 420, costPrice: 126, image: '🍗', dietary: 'non-veg' },
  { id: 6, category: 'Starters', name: 'Crispy Calamari', desc: 'Golden fried calamari rings with tartare dip.', price: 490, costPrice: 147, image: '🦑', dietary: 'non-veg' },
  { id: 7, category: 'Starters', name: 'Edamame', desc: 'Steamed edamame sprinkled with sea salt.', price: 250, costPrice: 75, image: '🫛', dietary: 'veg' },
  { id: 41, category: 'Starters', name: 'Hara Bhara Kabab', desc: 'Spiced spinach and green pea patties, pan-fried.', price: 320, costPrice: 96, image: '🧆', dietary: 'veg' },
  { id: 42, category: 'Starters', name: 'Chicken Satay', desc: 'Grilled chicken skewers with peanut sauce.', price: 450, costPrice: 135, image: '🍢', dietary: 'non-veg' },
  
  // --- SOUPS & SALADS ---
  { id: 8, category: 'Soups & Salads', name: 'Wild Shroom Soup', desc: 'Creamy mushroom blend with earthy truffle notes.', price: 355, costPrice: 106, image: '🥣', dietary: 'veg' },
  { id: 9, category: 'Soups & Salads', name: 'Caesar Salad', desc: 'Classic romaine salad with croutons and parmesan.', price: 290, costPrice: 87, image: '🥗', dietary: 'veg' },
  { id: 10, category: 'Soups & Salads', name: 'Greek Salad', desc: 'Fresh cucumber, tomato, olives, and feta cheese.', price: 320, costPrice: 96, image: '🥗', dietary: 'veg' },
  { id: 11, category: 'Soups & Salads', name: 'Tom Yum Soup', desc: 'Spicy Thai soup with lemongrass and shrimp.', price: 390, costPrice: 117, image: '🦐', dietary: 'non-veg' },
  { id: 43, category: 'Soups & Salads', name: 'Minestrone Soup', desc: 'Hearty Italian vegetable soup with pasta.', price: 280, costPrice: 84, image: '🥣', dietary: 'veg' },
  { id: 44, category: 'Soups & Salads', name: 'Quinoa Avocado Salad', desc: 'Healthy quinoa with avocado, cherry tomatoes, and lime dressing.', price: 380, costPrice: 114, image: '🥗', dietary: 'veg' },

  // --- ASIAN MAINS ---
  { id: 12, category: 'Asian Mains', name: 'Red Thai Chicken Curry', desc: 'Classic thai curry with coconut milk, served with steamed rice.', price: 520, costPrice: 156, image: '🍛', dietary: 'non-veg' },
  { id: 13, category: 'Asian Mains', name: 'Green Thai Veg Curry', desc: 'Spicy green curry with exotic vegetables.', price: 480, costPrice: 144, image: '🍛', dietary: 'veg' },
  { id: 14, category: 'Asian Mains', name: 'Chilli Basil Noodles', desc: 'Stir fried noodles with fresh basil and chilli.', price: 350, costPrice: 105, image: '🍜', dietary: 'veg' },
  { id: 15, category: 'Asian Mains', name: 'Nasi Goreng', desc: 'Indonesian fried rice topped with a fried egg.', price: 450, costPrice: 135, image: '🥘', dietary: 'egg' },
  { id: 45, category: 'Asian Mains', name: 'Pad Thai', desc: 'Stir-fried rice noodles with tofu, peanuts, and bean sprouts.', price: 420, costPrice: 126, image: '🍜', dietary: 'veg' },
  { id: 46, category: 'Asian Mains', name: 'Kung Pao Chicken', desc: 'Spicy stir-fried chicken with peanuts and vegetables.', price: 490, costPrice: 147, image: '🍛', dietary: 'non-veg' },

  // --- CONTINENTAL MAINS ---
  { id: 16, category: 'Continental Mains', name: 'Herb Grilled Chicken', desc: 'Served with mashed potatoes and seasonal roasted vegetables.', price: 550, costPrice: 165, image: '🍗', tags: ['Recommended'], dietary: 'non-veg' },
  { id: 17, category: 'Continental Mains', name: 'Mushroom Risotto', desc: 'Creamy Arborio rice with wild mushrooms and parmesan.', price: 490, costPrice: 147, image: '🥘', dietary: 'veg' },
  { id: 18, category: 'Continental Mains', name: 'Pan Seared Salmon', desc: 'Norwegian salmon with lemon butter sauce.', price: 850, costPrice: 255, image: '🐟', dietary: 'non-veg' },
  { id: 19, category: 'Continental Mains', name: 'Grilled Tenderloin', desc: 'Steak requested medium-rare with pepper sauce.', price: 790, costPrice: 237, image: '🥩', dietary: 'non-veg' },
  { id: 47, category: 'Continental Mains', name: 'Fish and Chips', desc: 'Classic battered fish with fries and tartar sauce.', price: 580, costPrice: 174, image: '🐟', dietary: 'non-veg' },
  { id: 48, category: 'Continental Mains', name: 'Lamb Chops', desc: 'Grilled lamb chops with rosemary sauce and mash.', price: 890, costPrice: 267, image: '🥩', dietary: 'non-veg' },

  // --- PIZZAS ---
  { id: 20, category: 'Pizzas', name: 'Margherita Pizza', desc: 'Classic tomato, mozzarella, and fresh basil.', price: 450, costPrice: 135, image: '🍕', tags: ['Must Try'], dietary: 'veg' },
  { id: 21, category: 'Pizzas', name: 'Pepperoni Pizza', desc: 'Loaded with spicy pork pepperoni and cheese.', price: 550, costPrice: 165, image: '🍕', dietary: 'non-veg' },
  { id: 22, category: 'Pizzas', name: 'Truffle Mushroom Pizza', desc: 'White pizza with mushrooms and truffle oil.', price: 520, costPrice: 156, image: '🍕', dietary: 'veg' },
  { id: 23, category: 'Pizzas', name: 'Chicken Tikka Pizza', desc: 'Desi fusion with spicy chicken chunks.', price: 490, costPrice: 147, image: '🍕', dietary: 'non-veg' },
  { id: 49, category: 'Pizzas', name: 'BBQ Chicken Pizza', desc: 'Smoky BBQ sauce, chicken chunks, and red onions.', price: 520, costPrice: 156, image: '🍕', dietary: 'non-veg' },
  { id: 50, category: 'Pizzas', name: 'Four Cheese Pizza', desc: 'Mozzarella, gorgonzola, parmesan, and cheddar.', price: 580, costPrice: 174, image: '🍕', dietary: 'veg' },

  // --- BURGERS ---
  { id: 24, category: 'Burgers', name: 'Classic Cheeseburger', desc: 'Smashed beef patty with American cheese.', price: 420, costPrice: 126, image: '🍔', dietary: 'non-veg' },
  { id: 25, category: 'Burgers', name: 'Spicy Fried Chicken Burger', desc: 'Crispy chicken, jalapeños, and spicy mayo.', price: 450, costPrice: 135, image: '🍔', dietary: 'non-veg' },
  { id: 26, category: 'Burgers', name: 'Portobello Veg Burger', desc: 'Grilled mushroom patty with Swiss cheese.', price: 390, costPrice: 117, image: '🍔', dietary: 'veg' },
  { id: 51, category: 'Burgers', name: 'Lamb Burger', desc: 'Juicy lamb patty with mint mayo and feta.', price: 490, costPrice: 147, image: '🍔', dietary: 'non-veg' },
  { id: 52, category: 'Burgers', name: 'Veggie Supreme Burger', desc: 'Mixed veg patty with crispy lettuce and burger sauce.', price: 350, costPrice: 105, image: '🍔', dietary: 'veg' },

  // --- INDIAN ---
  { id: 27, category: 'Indian', name: 'Butter Chicken', desc: 'Rich and creamy tomato/butter gravy.', price: 490, costPrice: 147, image: '🍛', tags: ['Chef Special'], dietary: 'non-veg' },
  { id: 28, category: 'Indian', name: 'Dal Makhani', desc: 'Slow cooked black lentils with cream.', price: 350, costPrice: 105, image: '🥣', tags: ['Must Try'], dietary: 'veg' },
  { id: 29, category: 'Indian', name: 'Garlic Naan', desc: 'Freshly baked flatbread with garlic & butter.', price: 90, costPrice: 27, image: '🫓', dietary: 'veg' },
  { id: 30, category: 'Indian', name: 'Paneer Tikka Masala', desc: 'Cottage cheese in spicy tikka gravy.', price: 450, costPrice: 135, image: '🍛', dietary: 'veg' },
  { id: 53, category: 'Indian', name: 'Rogan Josh', desc: 'Kashmiri style mutton curry in rich onion gravy.', price: 550, costPrice: 165, image: '🍛', dietary: 'non-veg' },
  { id: 54, category: 'Indian', name: 'Chicken Biryani', desc: 'Fragrant basmati rice cooked with spiced chicken.', price: 480, costPrice: 144, image: '🥘', dietary: 'non-veg' },

  // --- DESSERTS ---
  { id: 31, category: 'Desserts', name: 'Tiramisu', desc: 'Coffee flavored Italian classic.', price: 350, costPrice: 105, image: '🍰', dietary: 'egg' },
  { id: 32, category: 'Desserts', name: 'Molten Choco Lava', desc: 'Warm cake with a gooey chocolate center.', price: 320, costPrice: 96, image: '🎂', dietary: 'egg' },
  { id: 33, category: 'Desserts', name: 'New York Cheesecake', desc: 'Rich baked cheesecake with berry compote.', price: 390, costPrice: 117, image: '🍰', dietary: 'egg' },
  { id: 34, category: 'Desserts', name: 'Vanilla Ice Cream', desc: 'Two scoops of classic Madagascar vanilla.', price: 150, costPrice: 45, image: '🍨', dietary: 'veg' },
  { id: 55, category: 'Desserts', name: 'Gulab Jamun', desc: 'Warm milk dumplings in sugar syrup.', price: 180, costPrice: 54, image: '🧆', dietary: 'veg' },
  { id: 56, category: 'Desserts', name: 'Brownie with Ice Cream', desc: 'Warm chocolate brownie with vanilla scoop.', price: 280, costPrice: 84, image: '🍦', dietary: 'egg' },

  // --- DRINKS & COCKTAILS ---
  { id: 35, category: 'Drinks & Cocktails', name: 'The Kalyani Sour', desc: 'Whiskey, fresh lime, egg white, and a dash of local bitters.', price: 650, costPrice: 195, image: '🥃', tags: ['Chef Special'], dietary: 'egg' },
  { id: 36, category: 'Drinks & Cocktails', name: 'Classic Mojito', desc: 'White rum, fresh mint, lime, and soda water.', price: 500, costPrice: 150, image: '🍹', dietary: 'veg' },
  { id: 37, category: 'Drinks & Cocktails', name: 'Old Fashioned', desc: 'Bourbon, bitters, and orange peel.', price: 650, costPrice: 195, image: '🥃', dietary: 'veg' },
  { id: 38, category: 'Drinks & Cocktails', name: 'Espresso Martini', desc: 'Vodka, espresso, and coffee liqueur.', price: 600, costPrice: 180, image: '🍸', dietary: 'veg' },
  { id: 39, category: 'Drinks & Cocktails', name: 'Fresh Lime Soda', desc: 'Sweet or Salted, refreshing cooler.', price: 150, costPrice: 45, image: '🥤', dietary: 'veg' },
  { id: 40, category: 'Drinks & Cocktails', name: 'Mango Lassi', desc: 'Sweet yogurt drink with Alphonso mangoes.', price: 200, costPrice: 60, image: '🧋', dietary: 'veg' },
  { id: 57, category: 'Drinks & Cocktails', name: 'Cosmopolitan', desc: 'Vodka, cranberry juice, triple sec, and lime.', price: 550, costPrice: 165, image: '🍸', dietary: 'veg' },
  { id: 58, category: 'Drinks & Cocktails', name: 'Long Island Iced Tea', desc: 'Blend of five spirits with cola and lime.', price: 700, costPrice: 210, image: '🍹', dietary: 'veg' }
];

const RECIPE_MAP = {
  'Dynamite Prawns': [{ key: 'prawns', qty: 1 }, { key: 'spices', qty: 0.5 }],
  'Mutton Seekh': [{ key: 'mutton', qty: 1 }, { key: 'spices', qty: 0.8 }],
  'Cheesling Bhel': [{ key: 'cheese', qty: 0.5 }, { key: 'spices', qty: 0.2 }],
  'Truffle Fries': [{ key: 'vegetables', qty: 200 }, { key: 'cheese', qty: 0.1 }],
  'Chicken Wings': [{ key: 'chicken', qty: 0.5 }, { key: 'spices', qty: 0.5 }, { key: 'cheese', qty: 0.1 }],
  'Crispy Calamari': [{ key: 'seafood', qty: 1 }, { key: 'flour', qty: 0.2 }],
  'Edamame': [{ key: 'vegetables', qty: 100 }],
  
  'Wild Shroom Soup': [{ key: 'mushrooms', qty: 1.5 }, { key: 'cream', qty: 1 }],
  'Caesar Salad': [{ key: 'vegetables', qty: 150 }, { key: 'cheese', qty: 0.1 }, { key: 'bread', qty: 0.2 }],
  'Greek Salad': [{ key: 'vegetables', qty: 150 }, { key: 'cheese', qty: 0.2 }],
  'Tom Yum Soup': [{ key: 'seafood', qty: 0.5 }, { key: 'spices', qty: 0.5 }],

  'Red Thai Chicken Curry': [{ key: 'chicken', qty: 1 }, { key: 'coconut_milk', qty: 1 }, { key: 'spices', qty: 0.5 }],
  'Green Thai Veg Curry': [{ key: 'vegetables', qty: 200 }, { key: 'coconut_milk', qty: 1 }, { key: 'spices', qty: 0.5 }],
  'Chilli Basil Noodles': [{ key: 'flour', qty: 0.5 }, { key: 'vegetables', qty: 100 }, { key: 'spices', qty: 0.5 }],
  'Nasi Goreng': [{ key: 'rice', qty: 1 }, { key: 'egg', qty: 1 }, { key: 'spices', qty: 0.5 }],

  'Herb Grilled Chicken': [{ key: 'chicken', qty: 1 }, { key: 'vegetables', qty: 50 }],
  'Mushroom Risotto': [{ key: 'rice', qty: 1 }, { key: 'mushrooms', qty: 1 }, { key: 'cheese', qty: 0.2 }],
  'Pan Seared Salmon': [{ key: 'seafood', qty: 1.5 }, { key: 'cream', qty: 0.2 }],
  'Grilled Tenderloin': [{ key: 'beef', qty: 1 }, { key: 'spices', qty: 0.2 }],

  'Margherita Pizza': [{ key: 'flour', qty: 0.5 }, { key: 'cheese', qty: 0.5 }, { key: 'vegetables', qty: 100 }],
  'Pepperoni Pizza': [{ key: 'flour', qty: 0.5 }, { key: 'cheese', qty: 0.5 }, { key: 'beef', qty: 0.5 }],
  'Truffle Mushroom Pizza': [{ key: 'flour', qty: 0.5 }, { key: 'cheese', qty: 0.5 }, { key: 'mushrooms', qty: 1 }],
  'Chicken Tikka Pizza': [{ key: 'flour', qty: 0.5 }, { key: 'cheese', qty: 0.5 }, { key: 'chicken', qty: 0.5 }],

  'Classic Cheeseburger': [{ key: 'beef', qty: 0.8 }, { key: 'bread', qty: 1 }, { key: 'cheese', qty: 0.2 }],
  'Spicy Fried Chicken Burger': [{ key: 'chicken', qty: 0.8 }, { key: 'bread', qty: 1 }, { key: 'flour', qty: 0.2 }],
  'Portobello Veg Burger': [{ key: 'mushrooms', qty: 1 }, { key: 'bread', qty: 1 }, { key: 'cheese', qty: 0.2 }],

  'Butter Chicken': [{ key: 'chicken', qty: 1 }, { key: 'cream', qty: 0.5 }, { key: 'spices', qty: 0.5 }],
  'Dal Makhani': [{ key: 'vegetables', qty: 100 }, { key: 'cream', qty: 0.5 }, { key: 'spices', qty: 0.5 }],
  'Garlic Naan': [{ key: 'flour', qty: 0.2 }],
  'Paneer Tikka Masala': [{ key: 'cheese', qty: 1 }, { key: 'cream', qty: 0.2 }, { key: 'spices', qty: 0.5 }],

  'Tiramisu': [{ key: 'cheese', qty: 0.2 }, { key: 'flour', qty: 0.2 }, { key: 'egg', qty: 0.5 }],
  'Molten Choco Lava': [{ key: 'flour', qty: 0.2 }, { key: 'egg', qty: 0.5 }],
  'New York Cheesecake': [{ key: 'cheese', qty: 0.5 }, { key: 'egg', qty: 0.5 }, { key: 'flour', qty: 0.2 }],
  'Vanilla Ice Cream': [{ key: 'cream', qty: 0.5 }],

  'The Kalyani Sour': [{ key: 'whiskey', qty: 60 }, { key: 'egg', qty: 0.5 }],
  'Classic Mojito': [{ key: 'liquor', qty: 60 }],
  'Old Fashioned': [{ key: 'whiskey', qty: 60 }],
  'Espresso Martini': [{ key: 'liquor', qty: 60 }],
  'Fresh Lime Soda': [{ key: 'vegetables', qty: 1 }],
  'Mango Lassi': [{ key: 'cream', qty: 0.5 }]
};

// V9 Added Allergens to inventory
const INITIAL_INVENTORY = {
  prawns: { stock: 45, unit: 'portions', expiry: '2 days', status: 'ok', allergens: ['seafood'] },
  seafood: { stock: 30, unit: 'portions', expiry: '3 days', status: 'ok', allergens: ['seafood'] },
  mutton: { stock: 2, unit: 'portions', expiry: 'Today', status: 'low', allergens: [] },
  beef: { stock: 20, unit: 'portions', expiry: '4 days', status: 'ok', allergens: [] },
  chicken: { stock: 80, unit: 'portions', expiry: '3 days', status: 'ok', allergens: [] },
  mushrooms: { stock: 15, unit: 'portions', expiry: '4 days', status: 'ok', allergens: [] },
  cheese: { stock: 12, unit: 'kg', expiry: '10 days', status: 'ok', allergens: ['dairy'] },
  cream: { stock: 8, unit: 'liters', expiry: '1 week', status: 'ok', allergens: ['dairy'] },
  coconut_milk: { stock: 24, unit: 'cans', expiry: '6 months', status: 'ok', allergens: ['nuts'] },
  egg: { stock: 120, unit: 'units', expiry: '2 weeks', status: 'ok', allergens: ['egg'] },
  vegetables: { stock: 1500, unit: 'grams', expiry: 'Tomorrow', status: 'ok', allergens: [] },
  flour: { stock: 25, unit: 'kg', expiry: '6 months', status: 'ok', allergens: ['gluten'] },
  bread: { stock: 40, unit: 'loaves', expiry: '2 days', status: 'ok', allergens: ['gluten'] },
  rice: { stock: 50, unit: 'kg', expiry: '1 year', status: 'ok', allergens: [] },
  spices: { stock: 500, unit: 'units', expiry: '1 year', status: 'ok', allergens: [] },
  whiskey: { stock: 4500, unit: 'ml', expiry: 'Never', status: 'ok', allergens: [] },
  liquor: { stock: 8000, unit: 'ml', expiry: 'Never', status: 'ok', allergens: [] }
};

window.LUMINA_MENU = LUMINA_MENU;
window.RECIPE_MAP = RECIPE_MAP;
window.STORAGE_INVENTORY = INITIAL_INVENTORY;

// Generate large sales history
const generateSalesHistory = () => {
  const data = [];
  const channels = ['Dine-In', 'Delivery', 'Takeaway'];
  const menuItems = LUMINA_MENU.map(item => item.name);
  const now = Date.now();
  
  // Generate data for the last 30 days
  for (let i = 0; i < 30 * 100; i++) { // 100 orders per day avg
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const timestamp = now - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000);
    
    const channel = channels[Math.floor(Math.random() * channels.length)];
    const outlet = 'Lumina'; 
    const itemName = menuItems[Math.floor(Math.random() * menuItems.length)];
    const product = LUMINA_MENU.find(p => p.name === itemName);
    const qty = Math.floor(Math.random() * 3) + 1;
    const amount = product.price * qty;
    
    data.push({ timestamp, channel, outlet, itemName, qty, amount });
  }
  return data;
};

window.MOCK_SALES_HISTORY = generateSalesHistory();
