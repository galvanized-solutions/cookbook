import React, { useState } from 'react';
import ServingsSlider from '../ServingsSlider';
import styles from './styles.module.css';

type Measurement = {
  quantity: string | null;
  unit: string | null;
};

type Ingredient = {
  name: string;
  original: string;
  metric: Measurement;
  imperial: Measurement;
};

type DirectionOverride = {
  step: number;
  text: string;
};

type RecipeData = {
  ingredients: Ingredient[];
  directions: {
    base: string[];
    metric?: DirectionOverride[];
    imperial?: DirectionOverride[];
  };
  servings?: number; // Add servings to recipe data
};

interface RecipeToggleProps {
  recipe: RecipeData;
}

export default function RecipeToggle({ recipe }: RecipeToggleProps): JSX.Element {
  const [isMetric, setIsMetric] = useState(true);
  const defaultServings = recipe.servings || 1;
  const [currentServings, setCurrentServings] = useState(defaultServings);

  // Helper function to scale ingredient quantities
  const scaleQuantity = (quantity: string | null, multiplier: number): string | null => {
    if (!quantity || quantity === null) return null;
    
    // Handle fractions like "1/2", "3/4", etc.
    if (quantity.includes('/')) {
      const [numerator, denominator] = quantity.split('/').map(num => parseFloat(num.trim()));
      if (!isNaN(numerator) && !isNaN(denominator)) {
        const decimal = numerator / denominator;
        const scaled = decimal * multiplier;
        
        // Convert back to fraction if it results in common fractions
        if (scaled === 0.25) return '1/4';
        if (scaled === 0.5) return '1/2';
        if (scaled === 0.75) return '3/4';
        if (scaled === 1.25) return '1 1/4';
        if (scaled === 1.5) return '1 1/2';
        if (scaled === 1.75) return '1 3/4';
        if (scaled === 2.25) return '2 1/4';
        if (scaled === 2.5) return '2 1/2';
        if (scaled === 2.75) return '2 3/4';
        
        // Otherwise return decimal
        return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(2);
      }
    }
    
    // Handle mixed numbers like "1 1/2"
    if (quantity.includes(' ') && quantity.includes('/')) {
      const parts = quantity.split(' ');
      if (parts.length === 2) {
        const whole = parseFloat(parts[0]);
        const [fracNum, fracDen] = parts[1].split('/').map(num => parseFloat(num.trim()));
        if (!isNaN(whole) && !isNaN(fracNum) && !isNaN(fracDen)) {
          const total = whole + (fracNum / fracDen);
          const scaled = total * multiplier;
          return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(2);
        }
      }
    }
    
    // Handle decimal numbers
    const numericValue = parseFloat(quantity);
    if (!isNaN(numericValue)) {
      const scaled = numericValue * multiplier;
      return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(2);
    }
    
    // If we can't parse it, return original
    return quantity;
  };

  // Process ingredients for current measurement system with scaling
  const multiplier = currentServings / defaultServings;
  const currentIngredients = recipe.ingredients.map(ingredient => {
    const measurement = isMetric ? ingredient.metric : ingredient.imperial;
    const scaledMeasurement = {
      quantity: scaleQuantity(measurement.quantity, multiplier),
      unit: measurement.unit
    };
    
    return {
      ...ingredient,
      currentMeasurement: scaledMeasurement
    };
  });

  // Process directions with base + overrides
  const processDirections = () => {
    const baseDirections = [...recipe.directions.base];
    const overrides = isMetric ? recipe.directions.metric : recipe.directions.imperial;
    
    if (overrides) {
      overrides.forEach(override => {
        if (override.step < baseDirections.length) {
          baseDirections[override.step] = override.text;
        }
      });
    }
    
    return baseDirections;
  };

  const currentDirections = processDirections();

  const handleServingsChange = (newServings: number) => {
    setCurrentServings(newServings);
  };

  return (
    <div className={styles.recipeContainer}>
      <div className={styles.toggleContainer}>
        <button
          className={`${styles.toggleButton} ${isMetric ? styles.active : ''}`}
          onClick={() => setIsMetric(true)}
        >
          Metric
        </button>
        <button
          className={`${styles.toggleButton} ${!isMetric ? styles.active : ''}`}
          onClick={() => setIsMetric(false)}
        >
          Imperial
        </button>
      </div>

      <ServingsSlider
        defaultServings={defaultServings}
        currentServings={currentServings}
        onServingsChange={handleServingsChange}
      />

      <div className={styles.recipeContent}>
        <div className={styles.section}>
          <h3>Ingredients</h3>
          <ul className={styles.ingredientsList}>
            {currentIngredients.map((ingredient, index) => (
              <li key={index} className={styles.ingredient}>
                {ingredient.currentMeasurement.quantity && ingredient.currentMeasurement.unit 
                  ? `${ingredient.currentMeasurement.quantity} ${ingredient.currentMeasurement.unit} ${ingredient.name}`
                  : ingredient.original
                }
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.section}>
          <h3>Directions</h3>
          <ol className={styles.directionsList}>
            {currentDirections.map((direction, index) => (
              <li key={index} className={styles.direction}>
                {direction}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}