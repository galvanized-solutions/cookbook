export const measurement = {
  quantity: 'string', // nullable - The amount of the ingredient to be used, i.e. 2, or 3/4
  unit: 'string'      // nullable - The unit used to measure the quantity
};

export const ingredient = {
  name: 'string',     // The name of the ingredient that excludes the amount and unit
  original: 'string', // The original text that has not been parsed
  metric: measurement,    // Metric measurement for this ingredient
  imperial: measurement   // Imperial measurement for this ingredient
};

export const recipe = {
  title: 'string',        // The title of the recipe from the website
  category: 'string',     // The category provided in the prompt instructions
  created_at: 'string',   // Generated ISO 8601 timestamp of when the output file is created
  updated_at: 'string',   // Generated ISO 8601 timestamp of when the output file is created
  servings: 'number',     // nullable - The number of servings the recipe makes
  img: 'string',          // nullable - A url to the cover or title image of the recipe
  url: 'string',          // The url provided in the prompt
  nutrition: {
    base: 'string',       // nullable - Base nutritional information without units
    metric: 'string',     // nullable - Metric-specific nutrition info (kJ, etc.)
    imperial: 'string'    // nullable - Imperial-specific nutrition info (calories, etc.)
  },
  notes: 'string',        // nullable - Any Claude or context notes
  ingredients: [ingredient], // Array of ingredients with both metric and imperial measurements
  directions: {
    base: ['string'],     // Shared direction steps that are identical across measurement systems
    metric: [{            // Metric-specific overrides for steps that differ
      step: 'number',     // 0-indexed step number to override
      text: 'string'      // Metric-specific text for this step
    }],
    imperial: [{          // Imperial-specific overrides for steps that differ
      step: 'number',     // 0-indexed step number to override  
      text: 'string'      // Imperial-specific text for this step
    }]
  }
};

