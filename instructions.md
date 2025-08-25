---
name: website-recipe-parsing-instructions
description: Use this document to understand how recipes must be parsed from their html webpage source into a recipe artifact. Please use the url input below contained in the original prompt to fetch a recipe from the internet, make sure you cache the initial document to reference later. The website must be inspected for the  title, ingredients, instructions/directions and nutritional information (if available) must be identified and parsed into a standardized recipe format defined bellow. If a recipe cannot be parsed at all then a detailed explanation of what the reason should be provided as output.
inputs:
  - category
  - url
---

Recipe parsing instructions:
- A recipes ingredients could be in metric or imperial and we will need to parse both of these to separate entries so users can switch between the measurements systems easily
- For all keys that cannot be found or determined then then the value for the key should be null
- Title should be the direct name if it is accessible
- Add the result of this to context title to derive a blog post name the name should be the yyyy-mm-dd-<kebob-case-recipe-name> where you use the derived title name to replace yyyy-mm-dd-<kebob-case-recipe-name.
- The name above will be used to render the docusaurus post in ./recipes/<derived-name>.mdx and the ./output/<derived-name>.json
- Nutritional facts are preferred but not required and detailed breakdowns are preferred
- If servings represents the number of portions or how many it serves is not available then and can't be calculated from nutrition then use null
- We will parse both ingredients, instructions/directions and nutrition for units and quantities of these units using the chart conversions.yaml unless it is not contained in this file then it should be calculated using what information is accessible and added to the conversions.yaml
- Ingredients must be parsed first and it's conversions should be used to substitute and references to it in the directions when they are parsed 
- When parsing measurements weight should be preferred if for example if grams and cups are provided grams should be used, the same applies for oz and cups oz should be preferred
- If spoons are used to measure then please convert it to either ml or grams respectively and include the spoon measurement in parenthesis
- If imperial measurements are used and the site ends in .co.uk or it is apparent from the site context then the imperial cup should be used for weight and liquid conversions using the conversions.yaml
- If imperial measurements are used and the url contains in .com then the US cup should be used for weight and liquid conversions using the conversions.yaml
- If metric units are used then the metric cup should be used for weight and liquid conversions
- For directions , as an example, if a direction's original text states heat oven to 475f it should be added to the imperial direction list and a then converted to celsius and stored in the metric directions list as a string in it's entirety.
- 

## recipe schema definition
- Below is an open api component specification please use it to parse the data into the data structures required
- The following defines the type and a description that you can use to make a determination on how the information should be parsed.
- Please use it to output defined below the yaml code block and save the file to "./recipe.json"

```yaml
components:
  schemas:
    measurement:
      type: object
      properties:
        quantity:
          type: string
          nullable: true
          description: 'The amount of the ingredient to be used, i.e. 2, or 3/4'
        unit:
          type: string
          nullable: true
          description: 'The unit used to measure the quantity, if not a measurement system but a number of items like 2 white onions then it should be null'
      required:
        - quantity
        - unit
    
    ingredient:
      type: object
      properties:
        name:
          type: string
          description: 'The name of the ingredient that excludes the amount and unit, i.e. white onion or whole wheat flour'
        original:
          type: string
          description: 'The original text that has not been parsed, i.e. 2 white onions or 3/4 cup of whole wheat flour'
        metric:
          $ref: '#/components/schemas/measurement'
          description: 'Metric measurement for this ingredient'
        imperial:
          $ref: '#/components/schemas/measurement'
          description: 'Imperial measurement for this ingredient'
      required:
        - name
        - original
        - metric
        - imperial
    
    recipe:
      type: object
      properties:
        title:
          type: string
          description: 'The title of the recipe from the website'
        category:
          type: string
          description: 'The category provided in the prompt instructions'
        url:
          type: string
          format: uri
          description: 'The url provided in the prompt'
        created_at:
          type: string
          description: Generated ISO 8601 timestamp of when the output file is created
        updated_at:
          type: string
          description: Generated ISO 8601 timestamp of when the output file is created so it can be updated in the future
        servings:
          type: integer
          nullable: true
          description: 'The number of servings the recipe makes either taken from the site or calculated using the nutrition facts and serving size'
        img:
          type: string
          format: uri
          nullable: true
          description: 'A url to the cover or title image of the recipe if it can be identified'
        nutrition:
          type: object
          nullable: true
          properties:
            base:
              type: string
              description: 'Base nutritional information without units'
            metric:
              type: string
              description: 'Metric-specific nutrition info (kJ, etc.)'
            imperial:
              type: string
              description: 'Imperial-specific nutrition info (calories, etc.)'
          description: 'Nutritional information with shared and measurement-specific content'
        notes:
          type: string
          nullable: true
          description: 'Any Claude or context notes that should be made when parsing the recipe or decisions if one of the instructions cannot be followed'
        ingredients:
          type: array
          items:
            $ref: '#/components/schemas/ingredient'
          description: 'Array of ingredients with both metric and imperial measurements'
        directions:
          type: object
          properties:
            base:
              type: array
              items:
                type: string
              description: 'Shared direction steps that are identical across measurement systems'
            metric:
              type: array
              items:
                type: object
                properties:
                  step:
                    type: integer
                    description: 'Step number to override (0-indexed)'
                  text:
                    type: string
                    description: 'Metric-specific text for this step'
                required:
                  - step
                  - text
              description: 'Metric-specific overrides for steps that differ'
            imperial:
              type: array
              items:
                type: object
                properties:
                  step:
                    type: integer
                    description: 'Step number to override (0-indexed)'
                  text:
                    type: string
                    description: 'Imperial-specific text for this step'
                required:
                  - step
                  - text
              description: 'Imperial-specific overrides for steps that differ'
          required:
            - base
          description: 'Directions with shared base steps and measurement-specific overrides'
      required:
        - title
        - category
        - url
        - ingredients
        - directions
```


## output format
```javascript
const measurement = {
  quantity: 'string', // nullable
  unit: 'string'     // nullable
};

const ingredient = {
  name: 'string',
  original: 'string',
  metric: measurement,
  imperial: measurement
};

const recipe = {
  title: 'string',
  category: 'string',
  created_at: 'string',
  updated_at: 'string',
  servings: 'number', // nullable
  img: 'string',      // nullable
  url: 'string',
  nutrition: {
    base: 'string',     // shared nutrition info
    metric: 'string',   // metric-specific (kJ, etc.)
    imperial: 'string'  // imperial-specific (calories, etc.)
  },
  notes: 'string',    // nullable
  ingredients: [ingredient],
  directions: {
    base: ['string'],  // shared steps
    metric: [{
      step: 'number',  // 0-indexed step to override
      text: 'string'   // metric-specific text
    }],
    imperial: [{
      step: 'number',  // 0-indexed step to override
      text: 'string'   // imperial-specific text
    }]
  }
};
```

## Create a recipe post
- The following must generate a docusaurus post using the custom components RecipeToggle and ServingsSlider to dynamically adjust the recipe units and ingredient quantities when used
- After the recipe.json has been output use it to render the docusaurus post in the ./recipes/<derived-name>.mdx
- When that has been created move the recipe.json to ./recipes/<derived-name>.json to keep a history of the outputs