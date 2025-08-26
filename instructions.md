Parse recipe from URL/text to standardized JSON format. Extract title, ingredients, directions, nutrition. Save as ./output/recipe.json and create ./suggestions/YYYY-MM-DD-kebab-title.mdx

# Inputs:
category: string
url: Https URL to a recipe

# Validation
- EXIT 1 if the @settings.json is not sufficient and log why
- EXIT 1 with log message IF url input not HTTPS
- FAIL EARLY and exit with a detailed message or error response if you cannot access the recipe webpage
- EXIT 1 with log message IF webpage does not contain recipe
- Evaluate permissions needed for instruction before processing
- IF missing permissions LOG what is REQUIRED and EXIT 1

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

# MDX Template Structure
```mdx
---
slug: recipe-kebab-case-slug
title: Recipe Title
date: YYYY-MM-DD
authors: [claude]
tags: [category, tag1, tag2, tag3, tag4, tag5]
image: /img/image-filename.jpg
---

import RecipeToggle from '@site/src/components/RecipeToggle';

# Recipe Title

Brief description of the recipe (1-2 sentences). Include key characteristics, origin, or what makes it special. End with flavor profile or serving context.

![Recipe Title](/img/image-filename.jpg)

**Servings:** NUMBER  
**Category:** Category Name  
**Source:** [Source Name](source-url)

<!--truncate-->

## Recipe

<RecipeToggle 
  recipeId="recipe-kebab-case-slug"
  sourceUrl="original-recipe-url"
  recipe={{
  servings: NUMBER,
  timing: {
    prep_time: "X minutes",
    cook_time: "X minutes", 
    total_time: "X minutes"
  },
  nutrition: {
    base: "Per serving",
    metric: "XXXX kJ, XXg carbs, XXg protein, XXg fat",
    imperial: "XXX kcal, XXg carbs, XXg protein, XXg fat"
  },
  ingredients: [
    {
      name: "ingredient description",
      original: "original measurement ingredient description",
      metric: { quantity: "NUMBER", unit: "UNIT" },
      imperial: { quantity: "NUMBER", unit: "UNIT" }
    }
  ],
  directions: {
    base: [
      "Step 1 instruction text",
      "Step 2 instruction text"
    ],
    metric: [],
    imperial: []
  }
}} />

## Notes

Additional notes, tips, substitutions, or storage information.

---

*Generated from recipe data on Month DD, YYYY*
```

# Field Requirements

## Frontmatter Fields
- **slug**: kebab-case version of recipe title (auto-generated from title)
- **title**: Exact recipe title as it appears on source site
- **date**: YYYY-MM-DD format, extracted from filename or current date
- **authors**: Always `[claude]` for parsed recipes
- **tags**: Array of 3-6 tags including category + descriptive tags
- **image**: Relative path `/img/filename.jpg` or external URL

## Content Structure
- **Import statement**: Always include `import RecipeToggle from '@site/src/components/RecipeToggle';`
- **H1 title**: Must match frontmatter title exactly
- **Description**: 1-2 sentence summary with origin/characteristics
- **Image**: `![Title](/img/filename.jpg)` using relative path
- **Meta info**: Servings, Category, Source with link
- **Truncate**: `<!--truncate-->` after meta info for blog list previews

## RecipeToggle Props
- **recipeId**: Same as slug, used for localStorage
- **sourceUrl**: Original recipe URL for "View Original" tab
- **recipe object**: Contains all structured recipe data

## Recipe Object Fields
- **servings**: Number (required)
- **timing**: Object with prep_time, cook_time, total_time (optional)
- **nutrition**: Object with base, metric, imperial (optional)
- **ingredients**: Array of ingredient objects (required)
- **directions**: Object with base array, metric/imperial overrides (required)

# Output Process
1. **Parse** → save `./output/recipe.json`
2. **Generate MDX** → save `./suggestions/YYYY-MM-DD-title.mdx` using template above
3. **Rename** → rename `./output/recipe.json` → `./output/YYYY-MM-DD-title.json`
4. **Add tags** to `tags.yml` if missing (shared between blogs)

# Workflow Notes
- **New recipes** go to `./suggestions/` directory first
- **After testing/approval** → use promote-recipe.yml workflow to move to `./recipes/`
- **Suggestions blog** at `/suggestions` for review
- **Main recipes blog** at `/recipes` for approved content
- **Tags & Authors** are shared between both blogs via build-time sync script