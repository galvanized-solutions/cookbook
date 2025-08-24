import React, { useState } from 'react';
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
};

interface RecipeToggleProps {
  recipe: RecipeData;
}

export default function RecipeToggle({ recipe }: RecipeToggleProps): JSX.Element {
  const [isMetric, setIsMetric] = useState(true);

  // Process ingredients for current measurement system
  const currentIngredients = recipe.ingredients.map(ingredient => {
    const measurement = isMetric ? ingredient.metric : ingredient.imperial;
    return {
      ...ingredient,
      currentMeasurement: measurement
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