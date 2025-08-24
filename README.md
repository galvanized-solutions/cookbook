# Cookbook
A document page to dynamically create cookbook recipes 




```javascript
const ingredient = {
  original: 'string',
  name: 'string',
  quantity: 'number',
  unit: 'string'
};

const recipe = {
  title: 'string',
  category: 'string',
  servings: 'string',
  img: 'string',
  url: 'string',
  nutrition: { metric: 'string', imperial: 'string' },
  notes: 'string'
  ingredients: {
    metric: [ingredient],
    imperial: [ingredient],
  },
  directions: {
    metric: ['string'],
    imperial: ['string'],
  }
};
```

A recipe ingredient should conform to the following shape, all parsed measurements are based on the 

```yaml
---
ingredient:
  original: 'The original text that has not been parsed, i.e. 2 white onions or 3/4 cup of whole wheat flour'
  name: 'The name of the ingredient that excludes the amount and unit, using the original i.e. white onion or whole wheat flour'
  quantity: 'The amount of the ingredient to be used, i.e. 2, or 3/4'
---
```