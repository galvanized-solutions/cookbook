Use the @/tmp/jsonld.json if available to create the new page. Otherwise, use the @/tmp/html.json to find the recipe from to convert it to a standardized JSON-LD format as closely as possible.

# Inputs:

category: string - Recipe category

# Validation
- EXIT 1 with log message IF url input not HTTPS
- EXIT 1 with a detailed message if you cannot access the recipe webpage due to connectivity
- EXIT 1 with log message IF webpage does not contain recipe, you should evaluate this as efficiently as possible
- WARN and continue IF neither @/tmp/jsonld.json nor @/tmp/html.json exist
- WARN and continue IF image files are missing from /tmp/ (use remote image URLs instead)

# Core Rules
- **File Processing Priority**: 
  1. If @/tmp/jsonld.json exists, use it directly
  2. If @/tmp/html.json exists, extract JSON-LD from HTML content using grep/search
  3. If neither exists, log error and exit

- **HTML Processing**: When using @/tmp/html.json:
  - File may be very large (>250KB), use grep/search tools instead of reading entire file
  - Look for `<script type="application/ld+json">` containing Recipe schema
  - Extract JSON-LD structured data from HTML
  - Parse the extracted JSON-LD as if it were from /tmp/jsonld.json

- **Image Handling**: 
  - Check for local image files: `/tmp/image.*`, `/tmp/recipe.*`, etc.
  - If local image found: copy to `/packages/app/static/img/{slug}.{format}` and use relative path
  - If no local image: use remote image URL from recipe data (more common)
  - Image path in MDX: use `/img/{slug}.{format}` for local, full URL for remote

- **Ingredient Processing**: Create TWO separate arrays - one metric, one imperial
  - `recipeIngredient`: Combined format for JSON-LD compliance (e.g., "1 cup (240ml) water")
  - `metricIngredients`: Clean metric-only strings (e.g., "240ml water")
  - `imperialIngredients`: Clean imperial-only strings (e.g., "1 cup water")
- **Measurement Conversion Rules**:
  - Weight preferred over volume (grams > cups, oz > cups)
  - Convert spoons: 1 tbsp = 15ml, 1 tsp = 5ml
  - Domain-based cup conversions: .com = US cup (237ml), .co.uk = UK cup (284ml)
  - Temperature conversions: F→C for metric, C→F for imperial
- Extract timing information when available (prep, cook, total times)

# Measurement Priority
1. **Weight over volume** (454g not 2 cups)
2. **Spoons→ml conversion** (15ml not 1 tbsp)
3. **Regional cups**: .com=US (237ml), .co.uk=UK (284ml)

# Timing Format - ISO 8601 Duration
- Extract prepTime, cookTime, totalTime when available
- Use ISO 8601 duration format: "PT15M" (15 minutes), "PT1H30M" (1 hour 30 minutes)
- PT = Period of Time, followed by H (hours), M (minutes)
- Use null if timing information not found
- Examples: "PT5M", "PT30M", "PT1H", "PT1H15M", "PT2H30M"

# Schema - Recipe JSON-LD Format
```json
{
  "@context": "https://schema.org/",
  "@type": "Recipe",
  "name": "Recipe Title",
  "author": {
    "@type": "Person",
    "name": "Claude"
  },
  "datePublished": "YYYY-MM-DD",
  "description": "Brief recipe description",
  "prepTime": "PT15M",
  "cookTime": "PT30M", 
  "totalTime": "PT45M",
  "recipeYield": "4 servings",
  "recipeCategory": "Main Course",
  "recipeCuisine": "International",
  "image": "https://example.com/recipe-image.jpg",
  "recipeIngredient": [
    "1 cup (240ml) ingredient name",
    "2 tbsp (30ml) ingredient name"
  ],
  "recipeInstructions": [
    {
      "@type": "HowToStep",
      "name": "Step 1",
      "text": "Instruction text here"
    }
  ],
  "nutrition": {
    "@type": "NutritionInformation",
    "calories": "200 calories",
    "fatContent": "10g",
    "proteinContent": "15g",
    "carbohydrateContent": "20g"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5",
    "ratingCount": "1"
  }
}
```

# Extended Schema with Metric/Imperial Support
For internal processing, extend JSON-LD with custom properties:
```json
{
  "customProperties": {
    "metricIngredients": [
      "240ml water", 
      "30ml olive oil",
      "500g flour"
    ],
    "imperialIngredients": [
      "1 cup water", 
      "2 tbsp olive oil",
      "4 cups flour"
    ],
    "metricInstructions": [{"step": 1, "text": "Metric instruction"}],
    "imperialInstructions": [{"step": 1, "text": "Imperial instruction"}],
    "sourceUrl": "https://original-recipe-url.com"
  }
}
```

## Important: Simplified Ingredient Handling
- **No complex parsing required**: RecipeToggle component directly displays the appropriate ingredient array
- **metricIngredients**: Array of complete ingredient strings with metric measurements  
- **imperialIngredients**: Array of complete ingredient strings with imperial measurements
- **Direct display**: Toggle simply switches between showing `metricIngredients` vs `imperialIngredients`
- **No conversion logic needed**: Each array contains ready-to-display strings

# MDX Template Structure
```mdx
---
slug: recipe-kebab-case-slug
title: Recipe Title
date: YYYY-MM-DD
authors: [claude]
tags: [category, tag1, tag2, tag3, tag4, tag5]
image: /img/recipe-slug.jpg
---

import RecipeToggle from '@site/src/components/RecipeToggle';

# Recipe Title

Brief description of the recipe (1-2 sentences). Include key characteristics, origin, or what makes it special. End with flavor profile or serving context.

![Recipe Title](/img/recipe-slug.jpg)

**Servings:** NUMBER  
**Category:** Category Name  
**Source:** [Source Name](source-url)

<!--truncate-->

## Recipe

<RecipeToggle 
  recipeId="recipe-kebab-case-slug"
  sourceUrl="original-recipe-url"
  recipe={{
    "@context": "https://schema.org/",
    "@type": "Recipe",
    "name": "Recipe Title",
    "author": {
      "@type": "Person",
      "name": "Claude"
    },
    "datePublished": "YYYY-MM-DD",
    "description": "Brief recipe description",
    "prepTime": "PT15M",
    "cookTime": "PT30M",
    "totalTime": "PT45M", 
    "recipeYield": "4 servings",
    "recipeCategory": "Main Course",
    "recipeCuisine": "International",
    "image": "/img/recipe-slug.jpg",
    "recipeIngredient": [
      "1 cup (240ml) ingredient name",
      "2 tbsp (30ml) ingredient name"
    ],
    "recipeInstructions": [
      {
        "@type": "HowToStep",
        "name": "Step 1",
        "text": "Instruction text here"
      }
    ],
    "nutrition": {
      "@type": "NutritionInformation", 
      "calories": "200 calories",
      "fatContent": "10g",
      "proteinContent": "15g",
      "carbohydrateContent": "20g"
    },
    "customProperties": {
      "metricIngredients": ["240ml ingredient name", "30ml ingredient name"],
      "imperialIngredients": ["1 cup ingredient name", "2 tbsp ingredient name"],
      "metricInstructions": [{"step": 1, "text": "Metric instruction"}],
      "imperialInstructions": [{"step": 1, "text": "Imperial instruction"}],
      "sourceUrl": "https://original-recipe-url.com"
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
- **image**: 
  - If local image exists: `/img/{slug}.{format}` (relative path)
  - If remote image only: `https://...` (full URL)
  - Most common case: remote URLs from recipe websites

## Content Structure
- **Import statement**: Always include `import RecipeToggle from '@site/src/components/RecipeToggle';`
- **H1 title**: Must match frontmatter title exactly
- **Description**: 1-2 sentence summary with origin/characteristics
- **Image**: 
  - Local: `![Title](/img/{slug}.{format})` (relative path)
  - Remote: `![Title](https://full-url-to-image.jpg)` (full URL)
- **Meta info**: Servings, Category, Source with link
- **Truncate**: `<!--truncate-->` after meta info for blog list previews

## RecipeToggle Props
- **recipeId**: Same as slug, used for localStorage
- **sourceUrl**: Original recipe URL for "View Original" tab
- **recipe object**: Contains all structured recipe data

## Recipe Object Fields (JSON-LD Format)
- **@context**: Always "https://schema.org/" (required)
- **@type**: Always "Recipe" (required)  
- **name**: Recipe title (required)
- **author**: Person object with name "Claude" (required)
- **datePublished**: YYYY-MM-DD format (required)
- **description**: Brief recipe description (recommended)
- **prepTime**: ISO 8601 duration format, e.g. "PT15M" (recommended)
- **cookTime**: ISO 8601 duration format, e.g. "PT30M" (recommended)  
- **totalTime**: ISO 8601 duration format, e.g. "PT45M" (recommended)
- **recipeYield**: Number of servings (recommended)
- **recipeCategory**: Type of dish (optional)
- **recipeCuisine**: Cultural cuisine (optional)
- **image**: Recipe image URL (recommended)
- **recipeIngredient**: Array of ingredient strings with both metric/imperial (required)
- **recipeInstructions**: Array of HowToStep objects (required)
- **nutrition**: NutritionInformation object (optional)
- **customProperties**: Internal extension for metric/imperial separation (internal use)

# Output Process

## Step-by-Step Implementation
1. **Check input files availability**
   ```
   - Check if /tmp/jsonld.json exists
   - If not, check if /tmp/html.json exists  
   - If neither exists, EXIT 1 with error message
   ```

2. **Extract recipe data**
   ```
   - If jsonld.json: read and parse directly
   - If html.json: use grep to find JSON-LD script tags, extract and parse
   - Handle large files (>250KB) with streaming/grep rather than full file reads
   ```

3. **Process ingredients into three formats**
   ```
   For each ingredient, create:
   
   A. recipeIngredient (JSON-LD standard): "1 cup (240ml) water"
   B. metricIngredients: "240ml water"  
   C. imperialIngredients: "1 cup water"
   
   Example conversion:
   Original: "2 tablespoons olive oil"
   → recipeIngredient: ["2 tbsp (30ml) olive oil"]
   → metricIngredients: ["30ml olive oil"] 
   → imperialIngredients: ["2 tbsp olive oil"]
   ```

4. **Process images**
   ```bash
   # Check for local images
   find /tmp -name "image.*" -o -name "recipe.*" -o -name "*.jpg" -o -name "*.png" -o -name "*.jpeg"
   
   # If found: copy to static directory
   # If not found: use remote URL from recipe data
   ```

5. **Generate filename and slug**
   ```
   - Generate: YYYY-MM-DD-kebab-case-title
   - Use for: output JSON filename and MDX filename
   - Extract slug: kebab-case-title (without date prefix)
   ```

6. **Create output files**
   - Save `./packages/app/output/${FILE_NAME}.json` using Recipe JSON-LD schema
   - Save `./packages/app/suggestions/${FILE_NAME}.mdx` using template with JSON-LD format
   - Update `./packages/app/suggestions/tags.yml` if new tags needed

## Error Handling
- **Missing files**: Log warnings, continue with available data
- **Large files**: Use grep/search instead of full file reads  
- **Parse errors**: Log specific error, attempt to continue or exit gracefully
- **Image failures**: Default to remote URLs, don't fail entire process

## Common Scenarios and Solutions

### Scenario 1: Only /tmp/html.json available (large file)
```bash
# Use grep to find JSON-LD without reading entire file
grep -o '<script type="application/ld+json"[^>]*>.*</script>' /tmp/html.json
# Or use head to get first 50 lines containing structured data
head -50 /tmp/html.json | grep -A 100 '"@type".*"Recipe"'
```

### Scenario 2: No image files in /tmp/
```
- Extract image URL from recipe JSON-LD data
- Use remote URL directly in MDX (https://...)  
- Set image field in frontmatter to remote URL
- Do not attempt to copy non-existent local files
```

### Scenario 3: Recipe data embedded in HTML
```
- Search for JSON-LD script tags in HTML
- Extract structured data between script tags
- Parse as standard JSON-LD recipe format
- Common patterns: "@type": "Recipe", "recipeIngredient", "recipeInstructions"
```

### Scenario 4: Missing or incomplete recipe data
```
- Use available fields, set missing fields to null
- Provide reasonable defaults where possible
- Log warnings for missing critical fields (name, ingredients, instructions)  
- Continue processing rather than failing completely
```

### Scenario 5: Creating proper ingredient arrays
```
Input: "2 tablespoons olive oil"

Output in JSON-LD:
{
  "recipeIngredient": ["2 tbsp (30ml) olive oil"],
  "customProperties": {
    "metricIngredients": ["30ml olive oil"],
    "imperialIngredients": ["2 tbsp olive oil"]
  }
}

RecipeToggle behavior:
- Metric toggle: shows "30ml olive oil"
- Imperial toggle: shows "2 tbsp olive oil"  
- No parsing or conversion needed in component
```

# JSON-LD Migration Notes
- Output JSON files now use standard Schema.org Recipe format
- Maintains backward compatibility through `customProperties` extension
- ISO 8601 duration format for all timing fields
- Ingredients include both metric and imperial in single strings
- Instructions use HowToStep structured format
- Nutrition follows NutritionInformation schema

# Workflow Notes
- **New recipes** go to `./packages/app/suggestions/` directory first
- **After testing/approval** → use promote-recipe.yml workflow to move to `./packages/app/recipes/`
- **Suggestions blog** at `/suggestions` for review
- **Main recipes blog** at `/recipes` for approved content
- **Tags & Authors** are shared between both blogs via build-time sync script