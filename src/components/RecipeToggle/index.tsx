import React, { useState } from 'react';
import styles from './styles.module.css';

type Ingredient = {
  original: string;
  name: string;
  quantity: string | null;
  unit: string | null;
};

type RecipeData = {
  ingredients: {
    metric: Ingredient[];
    imperial: Ingredient[];
  };
  directions: {
    metric: string[];
    imperial: string[];
  };
};

interface RecipeToggleProps {
  recipe: RecipeData;
}

export default function RecipeToggle({ recipe }: RecipeToggleProps): JSX.Element {
  const [isMetric, setIsMetric] = useState(true);

  const currentIngredients = isMetric ? recipe.ingredients.metric : recipe.ingredients.imperial;
  const currentDirections = isMetric ? recipe.directions.metric : recipe.directions.imperial;

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
                {ingredient.quantity && ingredient.unit 
                  ? `${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`
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