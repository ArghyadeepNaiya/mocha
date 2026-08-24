from bs4 import BeautifulSoup

def get_nutrition_and_ingredients(name):
    name_lower = name.lower()
    
    if any(k in name_lower for k in ["dessert", "cake", "brownie", "sweet", "waffle", "pancake", "chocolate"]):
        return {"cal": "350kcal", "pro": "3gm", "carb": "45gm", "fat": "18gm", "ing": "Flour, Sugar, Butter, Cocoa, Eggs, Milk, Vanilla Extract"}
    elif any(k in name_lower for k in ["fries", "potato", "burger", "pizza", "fried"]):
        return {"cal": "300kcal", "pro": "6gm", "carb": "40gm", "fat": "15gm", "ing": "Potatoes, Refined Oil, Salt, Black Pepper, Spices, Flour, Cheese"}
    elif any(k in name_lower for k in ["paneer", "cheese", "butter", "cream"]):
        return {"cal": "280kcal", "pro": "14gm", "carb": "10gm", "fat": "22gm", "ing": "Cottage Cheese (Paneer), Tomato Gravy, Butter, Cream, Indian Spices, Onions"}
    elif any(k in name_lower for k in ["bread", "roti", "naan", "paratha", "bun"]):
        return {"cal": "260kcal", "pro": "8gm", "carb": "50gm", "fat": "4gm", "ing": "Wheat Flour, Water, Salt, Butter, Yeast"}
    elif any(k in name_lower for k in ["chicken", "mutton", "tikka", "kebab", "meat"]):
        return {"cal": "220kcal", "pro": "18gm", "carb": "5gm", "fat": "14gm", "ing": "Premium Chicken/Meat, Yogurt, Ginger Garlic Paste, Tikka Masala, Lemon, Oil"}
    elif any(k in name_lower for k in ["rice", "noodle", "pasta", "spaghetti", "macaroni"]):
        return {"cal": "200kcal", "pro": "6gm", "carb": "35gm", "fat": "5gm", "ing": "Basmati Rice/Durum Wheat Pasta, Garlic, Olive Oil, Mixed Veggies, Soy Sauce/Tomato Sauce"}
    elif any(k in name_lower for k in ["fish", "prawn", "shrimp"]):
        return {"cal": "180kcal", "pro": "16gm", "carb": "2gm", "fat": "12gm", "ing": "Fresh Seafood, Lemon, Garlic, Butter, Parsley, Black Pepper"}
    elif any(k in name_lower for k in ["egg", "omelette", "bhurji"]):
        return {"cal": "150kcal", "pro": "12gm", "carb": "2gm", "fat": "10gm", "ing": "Farm Fresh Eggs, Onions, Green Chilies, Coriander, Salt, Butter"}
    elif any(k in name_lower for k in ["salad", "soup", "veg", "greens", "broccoli", "mushroom"]):
        return {"cal": "80kcal", "pro": "2gm", "carb": "10gm", "fat": "3gm", "ing": "Lettuce, Cherry Tomatoes, Cucumber, Olives, Vinaigrette Dressing, Fresh Herbs"}
    else:
        # Default average meal
        return {"cal": "150kcal", "pro": "4gm", "carb": "20gm", "fat": "6gm", "ing": "Mixed Vegetables, Assorted Spices, Cooking Oil, Salt, Herbs"}

with open('/home/orstead/Documents/mocha/menu.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f, 'html.parser')

items = soup.find_all('div', class_='menu-item')

for item in items:
    name_el = item.find('h4', class_='item-name')
    if not name_el:
        continue
        
    name = name_el.text.strip()
    data = get_nutrition_and_ingredients(name)
    
    # Inject data-ingredients to the menu item container
    item['data-ingredients'] = data['ing']
    
    # Remove existing overlay if it exists to replace it
    existing_overlay = item.find('div', class_='nutritional-overlay')
    if existing_overlay:
        existing_overlay.decompose()
        
    overlay_html = f"""
    <div class="nutritional-overlay">
        <h5>Per 100gm</h5>
        <div class="nutrition-grid">
            <div class="nutrient"><span>Energy</span><span>{data['cal']}</span></div>
            <div class="nutrient"><span>Protein</span><span>{data['pro']}</span></div>
            <div class="nutrient"><span>Carbohydrates</span><span>{data['carb']}</span></div>
            <div class="nutrient"><span>Fats</span><span>{data['fat']}</span></div>
        </div>
    </div>
    """
    
    overlay_soup = BeautifulSoup(overlay_html, 'html.parser')
    
    # Inject into item-top
    item_top = item.find('div', class_='item-top')
    if item_top:
        item_top.append(overlay_soup)

with open('/home/orstead/Documents/mocha/menu.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))
    
print(f"Updated {len(items)} items with ingredients and nutrition.")
