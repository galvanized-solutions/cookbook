Use the @/tmp/jsonld.json if available to create the new page. Otherwise, use the @/tmp/html.json to find the recipe from to convert it to a standardized JSON-LD format as closely as possible.

# Inputs:

category: string - Recipe category

# Validation
<!-- - Evaluate permissions needed for instruction before processing -->
<!-- - EXIT 1 if the @settings.json exists and does not have sufficient permissions and log why and an example file with the permissions that are REQUIRED -->
- EXIT 1 with log message IF url input not HTTPS
- EXIT 1 with a detailed message if you cannot access the recipe webpage due to connectivity
- EXIT 1 with log message IF webpage does not contain recipe, you should evaluate this as efficiently as possible

# Core Rules
- If there is a @/tmp/jsonld.json use the JSON-LD schema this otherwise attempt to gather the information using the schema and the @/tmp/html.json
- Parse ingredients with both metric/imperial measurements
- Weight preferred over volume (grams > cups, oz > cups)
- Convert spoons to ml/grams, keep original in parenthesis
- Domain-based cup conversions: .com = US cup, .co.uk = UK cup
- Temperature conversions: F→C for metric, C→F for imperial
- Extract timing information when available (prep, cook, total times)
- The downloaded image file will be located in @/tmp/, we will not know the format though it will always be called @/tmp/image.{format}:
  - Where {format} is the format as located in the JSON-LD @/tmp/jsonld.json on the image.url path when the @/tmp/jsonld.json is created.
- This file must be copied to the @/packages/app/static/img/{filename}.{format}

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
    "metricIngredients": ["240ml ingredient name", "30ml ingredient name"],
    "imperialIngredients": ["1 cup ingredient name", "2 tbsp ingredient name"],
    "metricInstructions": [{"step": 1, "text": "Metric instruction"}],
    "imperialInstructions": [{"step": 1, "text": "Imperial instruction"}],
    "sourceUrl": "https://original-recipe-url.com",
    "internalCategory": "category-name"
  }
}

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
- **image**: Relative path `/img/{slug}.{format}` matching copied image file

## Content Structure
- **Import statement**: Always include `import RecipeToggle from '@site/src/components/RecipeToggle';`
- **H1 title**: Must match frontmatter title exactly
- **Description**: 1-2 sentence summary with origin/characteristics
- **Image**: `![Title](/img/{slug}.{format})` using relative path matching copied image file
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
1. **Generate a FILE_NAME** → store `YYYY-MM-DD-title` to use below
2. **Copy image file** → copy `/tmp/image.{format}` to `/packages/app/static/img/{slug}.{format}` (format extracted from jsonld.json image.url)
3. **Save JSON-LD output** → save `./packages/app/output/${FILE_NAME}.json` using Recipe JSON-LD schema
4. **Generate MDX** → save `./packages/app/suggestions/${FILE_NAME}.mdx` using template above with JSON-LD format
5. **Add tags** to `tags.yml` if missing (shared between blogs)

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