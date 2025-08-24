const ingredient = {
  original: 'string',
  name: 'string',
  quantity: 'number',
  unit: 'string'
};

const recipe = {
  title: 'string',
  category: 'string',
  created_at: 'string',
  updated_at: 'string',
  servings: 'string',
  img: 'string',
  url: 'string',
  nutrition: { metric: 'string', imperial: 'string' },
  notes: 'string',
  ingredients: {
    metric: [ingredient],
    imperial: [ingredient],
  },
  directions: {
    metric: ['string'],
    imperial: ['string'],
  }
};

export {
  ingredient,
  recipe
};