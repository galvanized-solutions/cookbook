const ingredientsShape = {
  name: 'string',
  quantity: 'number',
  unit: 'string',
  original: 'string'
};

const recipeShape = {
  title: 'string',
  ingredients: {
    metric: [ingredientsShape],
    imperial: [ingredientsShape],
  },
  directions: {
    metric: ['string'],
    imperial: ['string'],
  },
  category: 'string',
  source: 'string',
  notes: 'string'
};

export {
  ingredientsShape,
  recipeShape
};