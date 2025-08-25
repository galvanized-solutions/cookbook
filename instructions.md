---
name: recipe-parser
description: Parse recipe from URL/text to standardized JSON format. Extract title, ingredients, directions, nutrition. Save as ./output/recipe.json and create ./recipes/YYYY-MM-DD-kebab-title.mdx
inputs: [category, url]
---

# Core Rules
- Parse ingredients with both metric/imperial measurements
- Use null for missing values  
- Weight preferred over volume (grams > cups, oz > cups)
- Convert spoons to ml/grams, keep original in parenthesis
- Domain-based cup conversions: .com = US cup, .co.uk = UK cup
- Temperature conversions: F→C for metric, C→F for imperial
- Extract timing information when available (prep, cook, total times)

# Measurement Priority
1. **Weight over volume** (454g not 2 cups)
2. **Spoons→ml conversion** (15ml not 1 tbsp)
3. **Regional cups**: .com=US (237ml), .co.uk=UK (284ml)

# Timing Format
- Extract prep_time, cook_time, total_time when available
- Use standard format: "15 minutes", "1 hour 30 minutes", "45 mins"
- Store as strings with units (not just numbers)
- Use null if timing information not found

# Schema
```yaml
measurement: {quantity: string?, unit: string?}
timing: {prep_time: string?, cook_time: string?, total_time: string?}
ingredient: {name: string, original: string, metric: measurement, imperial: measurement}
recipe: {
  title: string, category: string, url: string, 
  created_at: string, updated_at: string,
  servings: number?, img: string?, notes: string?,
  timing: timing?,
  nutrition: {base: string, metric: string, imperial: string}?,
  ingredients: [ingredient],
  directions: {
    base: [string],
    metric: [{step: number, text: string}],  
    imperial: [{step: number, text: string}]
  }
}
```

# Output Process
1. **Parse** → save `./output/recipe.json`
2. **Generate MDX** → save `./recipes/YYYY-MM-DD-title.mdx` using RecipeToggle component
3. **Rename** → rename `./output/recipe.json` → `./output/YYYY-MM-DD-title.json`
4. **Add tags** to `tags.yml` if missing