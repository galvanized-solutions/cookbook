import React, { useState, useEffect } from 'react';
import ServingsSlider from '../ServingsSlider';
import styles from './styles.module.css';

// Legacy types for backward compatibility
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

type Timing = {
  prep_time?: string | null;
  cook_time?: string | null;
  total_time?: string | null;
};

// JSON-LD Recipe format
type JSONLDRecipe = {
  "@context": string;
  "@type": string;
  name: string;
  author?: {
    "@type": string;
    name: string;
  };
  datePublished?: string;
  description?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  recipeYield?: string;
  recipeCategory?: string;
  recipeCuisine?: string;
  image?: string;
  recipeIngredient: string[];
  recipeInstructions: Array<{
    "@type": string;
    name?: string;
    text: string;
  }>;
  nutrition?: {
    "@type": string;
    calories?: string;
    fatContent?: string;
    [key: string]: any;
  };
  customProperties?: {
    metricIngredients?: string[];
    imperialIngredients?: string[];
    metricInstructions?: DirectionOverride[];
    imperialInstructions?: DirectionOverride[];
    sourceUrl?: string;
  };
};

// Legacy format for backward compatibility
type RecipeData = {
  ingredients: Ingredient[];
  directions: {
    base: string[];
    metric?: DirectionOverride[];
    imperial?: DirectionOverride[];
  };
  servings?: number;
  timing?: Timing | null;
};

interface RecipeToggleProps {
  recipe: JSONLDRecipe | RecipeData;
  recipeId?: string; // Optional unique identifier for the recipe
  sourceUrl?: string; // Optional source URL for "View Original" tab
}

// Helper function to check if recipe is JSON-LD format
const isJSONLDRecipe = (recipe: JSONLDRecipe | RecipeData): recipe is JSONLDRecipe => {
  return '@context' in recipe && '@type' in recipe;
};

// Helper function to parse ISO 8601 duration to readable format
const parseISO8601Duration = (duration: string): string => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return duration;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  
  if (hours > 0 && minutes > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
};

// Helper function to extract servings number from recipeYield
const parseServings = (recipeYield?: string): number => {
  if (!recipeYield) return 1;
  const match = recipeYield.match(/(\d+)/);
  return match ? parseInt(match[1]) : 1;
};

// Helper function to parse ingredient into structured format
const parseIngredient = (ingredient: string): Ingredient => {
  // Extract quantity and unit from ingredient string like "1 cup (240ml) ingredient name"
  const match = ingredient.match(/^([^(]+?)(?:\s*\(([^)]+)\))?\s+(.+)$/);
  
  if (match) {
    const [, originalPart, metricPart, name] = match;
    const originalTrimmed = originalPart.trim();
    
    // Parse imperial measurement (quantity + unit)
    const imperialMatch = originalTrimmed.match(/^(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)\s*(.*)$/);
    const imperial = imperialMatch ? {
      quantity: imperialMatch[1],
      unit: imperialMatch[2] || null
    } : { quantity: null, unit: null };
    
    // Parse metric measurement if available
    const metric = metricPart ? (() => {
      const metricMatch = metricPart.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
      return metricMatch ? {
        quantity: metricMatch[1],
        unit: metricMatch[2] || null
      } : { quantity: null, unit: null };
    })() : { quantity: null, unit: null };
    
    return {
      name: name.trim(),
      original: ingredient,
      metric,
      imperial
    };
  }
  
  // Fallback for ingredients without clear structure
  return {
    name: ingredient,
    original: ingredient,
    metric: { quantity: null, unit: null },
    imperial: { quantity: null, unit: null }
  };
};

// Simplified conversion for JSON-LD recipes - just store the ingredient arrays
const convertJSONLDToRecipeData = (jsonldRecipe: JSONLDRecipe): RecipeData => {
  // For new JSON-LD format, we'll bypass the old ingredient parsing completely
  // Just create a simplified structure that holds the raw ingredient strings
  const ingredients = jsonldRecipe.recipeIngredient.map((ingredient, index) => ({
    name: ingredient,
    original: ingredient,
    metric: { quantity: null, unit: null },
    imperial: { quantity: null, unit: null }
  }));
  
  // Parse directions from recipeInstructions
  const baseDirections = jsonldRecipe.recipeInstructions.map(instruction => instruction.text);
  
  // Use custom properties for metric/imperial overrides if available
  const directions = {
    base: baseDirections,
    metric: jsonldRecipe.customProperties?.metricInstructions || [],
    imperial: jsonldRecipe.customProperties?.imperialInstructions || []
  };
  
  // Parse timing from ISO 8601 format
  const timing: Timing = {
    prep_time: jsonldRecipe.prepTime ? parseISO8601Duration(jsonldRecipe.prepTime) : null,
    cook_time: jsonldRecipe.cookTime ? parseISO8601Duration(jsonldRecipe.cookTime) : null,
    total_time: jsonldRecipe.totalTime ? parseISO8601Duration(jsonldRecipe.totalTime) : null
  };
  
  return {
    ingredients,
    directions,
    servings: parseServings(jsonldRecipe.recipeYield),
    timing: timing.prep_time || timing.cook_time || timing.total_time ? timing : null
  };
};

export default function RecipeToggle({ recipe, recipeId, sourceUrl }: RecipeToggleProps): JSX.Element {
  // Convert JSON-LD to internal format if needed
  const recipeData: RecipeData = isJSONLDRecipe(recipe) ? convertJSONLDToRecipeData(recipe) : recipe;

  const defaultServings = recipeData.servings || 1;

  // Local storage keys
  const MEASUREMENT_KEY = 'cookbook-measurement-preference';
  const getServingsKey = (id: string) => `cookbook-servings-${id}`;

  // Helper: Read URL parameters
  const getURLParams = () => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return {
      servings: params.get('servings'),
      metric: params.get('metric'),
      steps: params.get('steps'),
    };
  };

  // Helper: Update URL parameters without page reload
  const updateURLParams = (servings: number, metric: boolean, steps: Set<number>) => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);

    // Update parameters
    if (servings !== defaultServings) {
      params.set('servings', servings.toString());
    } else {
      params.delete('servings');
    }

    params.set('metric', metric.toString());

    if (steps.size > 0) {
      params.set('steps', Array.from(steps).sort((a, b) => a - b).join(','));
    } else {
      params.delete('steps');
    }

    // Update URL without reload
    const newURL = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, '', newURL);
  };

  // Initialize state from URL params, then localStorage, then defaults
  const [isMetric, setIsMetric] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = getURLParams();
      if (urlParams?.metric !== null) {
        return urlParams.metric === 'true';
      }
      const saved = localStorage.getItem(MEASUREMENT_KEY);
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });

  const [currentServings, setCurrentServings] = useState(() => {
    if (typeof window !== 'undefined' && recipeId) {
      const urlParams = getURLParams();
      if (urlParams?.servings) {
        return parseInt(urlParams.servings);
      }
      const saved = localStorage.getItem(getServingsKey(recipeId));
      return saved ? parseInt(saved) : defaultServings;
    }
    return defaultServings;
  });

  // Save measurement preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(MEASUREMENT_KEY, JSON.stringify(isMetric));
    }
  }, [isMetric]);

  // Save servings preference to localStorage (per recipe)
  useEffect(() => {
    if (typeof window !== 'undefined' && recipeId) {
      localStorage.setItem(getServingsKey(recipeId), currentServings.toString());
    }
  }, [currentServings, recipeId]);

  // State for tracking completed steps
  const getStepsKey = (id: string) => `cookbook-steps-${id}`;
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() => {
    if (typeof window !== 'undefined' && recipeId) {
      const urlParams = getURLParams();
      if (urlParams?.steps) {
        return new Set(urlParams.steps.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)));
      }
      const saved = localStorage.getItem(getStepsKey(recipeId));
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });

  // Save completed steps to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && recipeId) {
      localStorage.setItem(getStepsKey(recipeId), JSON.stringify([...completedSteps]));
    }
  }, [completedSteps, recipeId]);

  // Update URL parameters when state changes
  useEffect(() => {
    updateURLParams(currentServings, isMetric, completedSteps);
  }, [currentServings, isMetric, completedSteps, defaultServings]);

  // State for celebration message
  const [showCelebration, setShowCelebration] = useState(false);

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

        // Round to nearest whole number for other values, minimum 1
        const rounded = Math.round(scaled);
        return (rounded < 1 ? 1 : rounded).toString();
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
          const rounded = Math.round(scaled);
          return (rounded < 1 ? 1 : rounded).toString();
        }
      }
    }

    // Handle decimal numbers
    const numericValue = parseFloat(quantity);
    if (!isNaN(numericValue)) {
      const scaled = numericValue * multiplier;
      const rounded = Math.round(scaled);
      return (rounded < 1 ? 1 : rounded).toString();
    }

    // If we can't parse it, return original
    return quantity;
  };

  // Helper: Convert Unicode fractions to decimal
  const unicodeFractionToDecimal = (str: string): string => {
    const fractionMap: { [key: string]: string } = {
      '¼': '0.25',
      '½': '0.5',
      '¾': '0.75',
      '⅐': '0.142857',
      '⅑': '0.111111',
      '⅒': '0.1',
      '⅓': '0.333333',
      '⅔': '0.666667',
      '⅕': '0.2',
      '⅖': '0.4',
      '⅗': '0.6',
      '⅘': '0.8',
      '⅙': '0.166667',
      '⅚': '0.833333',
      '⅛': '0.125',
      '⅜': '0.375',
      '⅝': '0.625',
      '⅞': '0.875',
    };

    return str.replace(/[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, match => fractionMap[match] || match);
  };

  // Helper: Convert decimal back to common fractions for display
  const decimalToFraction = (decimal: number): string => {
    if (decimal === 0.25) return '¼';
    if (decimal === 0.5) return '½';
    if (decimal === 0.75) return '¾';
    if (decimal === 0.125) return '⅛';
    if (decimal === 0.375) return '⅜';
    if (decimal === 0.625) return '⅝';
    if (decimal === 0.875) return '⅞';
    if (decimal === 0.333333 || Math.abs(decimal - 0.333333) < 0.001) return '⅓';
    if (decimal === 0.666667 || Math.abs(decimal - 0.666667) < 0.001) return '⅔';

    // Check for whole numbers
    if (Number.isInteger(decimal)) return decimal.toString();

    // Check for mixed numbers with common fractions
    const whole = Math.floor(decimal);
    const frac = decimal - whole;

    if (whole > 0 && frac > 0) {
      const fracStr = decimalToFraction(frac);
      if (fracStr.match(/[¼½¾⅛⅜⅝⅞⅓⅔]/)) {
        return `${whole} ${fracStr}`;
      }
    }

    // Return as decimal if no clean fraction found
    return decimal.toString();
  };

  // Parse and scale JSON-LD ingredient strings
  const parseAndScaleJSONLDIngredient = (ingredient: string, multiplier: number): string => {
    // First convert any Unicode fractions to decimals for processing
    const normalizedIngredient = unicodeFractionToDecimal(ingredient);

    // Match patterns like "57g unsalted butter", "4 tablespoons olive oil", "0.25 cup flour"
    // Handles decimals, fractions, and mixed numbers
    const pattern = /^(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)\s*(.+)$/;
    const match = normalizedIngredient.match(pattern);

    if (!match) {
      // No quantity found (e.g., "Salt to taste"), return as-is
      return ingredient;
    }

    const [, quantityStr, rest] = match;
    const scaledQuantity = scaleQuantity(quantityStr, multiplier);

    // Convert scaled quantity back to fraction if it's a clean fraction
    const scaledNum = parseFloat(scaledQuantity || '0');
    const displayQuantity = decimalToFraction(scaledNum);

    // Check if original had a space after the quantity
    const hasSpace = ingredient.match(/^[\d¼½¾⅛⅜⅝⅞⅓⅔]+\s+/);

    // Reconstruct with or without space to match original format
    if (hasSpace) {
      return `${displayQuantity} ${rest}`;
    } else {
      return `${displayQuantity}${rest}`;
    }
  };

  // Get current ingredients based on measurement preference
  const getCurrentIngredients = () => {
    // For JSON-LD recipes, use the separate metric/imperial arrays directly
    if (isJSONLDRecipe(recipe)) {
      const { customProperties } = recipe;
      const multiplier = currentServings / defaultServings;

      if (customProperties?.metricIngredients && customProperties?.imperialIngredients) {
        const ingredientArray = isMetric ? customProperties.metricIngredients : customProperties.imperialIngredients;
        // Scale each ingredient
        return ingredientArray.map(ingredient => parseAndScaleJSONLDIngredient(ingredient, multiplier));
      }
      // Fallback to combined format in recipeIngredient
      return recipe.recipeIngredient.map(ingredient => parseAndScaleJSONLDIngredient(ingredient, multiplier));
    }
    
    // For legacy recipes, use the old complex ingredient processing
    const multiplier = currentServings / defaultServings;
    return recipeData.ingredients.map(ingredient => {
      const measurement = isMetric ? ingredient.metric : ingredient.imperial;
      const scaledQuantity = scaleQuantity(measurement.quantity, multiplier);

      const displayText = measurement.quantity && measurement.unit
        ? `${scaledQuantity} ${measurement.unit} ${ingredient.name}`
        : measurement.quantity
        ? `${scaledQuantity} ${ingredient.name}`
        : ingredient.original;

      return displayText;
    });
  };

  const currentIngredients = getCurrentIngredients();

  // Process directions with base + overrides
  const processDirections = () => {
    const baseDirections = [...recipeData.directions.base];
    const overrides = isMetric ? recipeData.directions.metric : recipeData.directions.imperial;

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

  const handleServingsReset = () => {
    setCurrentServings(defaultServings);
    // Clear the localStorage for this recipe's servings
    if (typeof window !== 'undefined' && recipeId) {
      localStorage.removeItem(getServingsKey(recipeId));
    }
  };

  const handleStepToggle = (stepIndex: number) => {
    setCompletedSteps((prev: Set<number>) => {
      const newSet = new Set(prev);
      if (newSet.has(stepIndex)) {
        newSet.delete(stepIndex);
      } else {
        newSet.add(stepIndex);
        // Check if this completes all steps
        if (newSet.size === currentDirections.length) {
          // Trigger celebration animation
          triggerCelebration();
        }
      }
      return newSet;
    });
  };

  const triggerCelebration = () => {
    // Show celebration message
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);

    // Create celebration elements
    const container = document.querySelector(`.${styles.recipeContainer}`);
    if (!container) return;

    // Create multiple party poppers for extra celebration
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const celebration = document.createElement('div');
        celebration.className = styles.celebration;
        celebration.textContent = '🎉';
        celebration.style.left = Math.random() * 100 + '%';
        celebration.style.animationDelay = Math.random() * 0.5 + 's';
        container.appendChild(celebration);

        // Remove after animation
        setTimeout(() => {
          if (celebration.parentNode) {
            celebration.parentNode.removeChild(celebration);
          }
        }, 2000);
      }, i * 100);
    }
  };

  const handleResetSteps = () => {
    setCompletedSteps(new Set());
    if (typeof window !== 'undefined' && recipeId) {
      localStorage.removeItem(getStepsKey(recipeId));
    }
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
        onReset={handleServingsReset}
      />

      {recipeData.timing && (recipeData.timing.prep_time || recipeData.timing.cook_time || recipeData.timing.total_time) && (
        <div className={styles.timingContainer}>
          <div className={styles.timingInfo}>
            {recipeData.timing.prep_time && (
              <div className={styles.timingItem}>
                <span className={styles.timingLabel}>Prep:</span>
                <span className={styles.timingValue}>{recipeData.timing.prep_time}</span>
              </div>
            )}
            {recipeData.timing.cook_time && (
              <div className={styles.timingItem}>
                <span className={styles.timingLabel}>Cook:</span>
                <span className={styles.timingValue}>{recipeData.timing.cook_time}</span>
              </div>
            )}
            {recipeData.timing.total_time && (
              <div className={styles.timingItem}>
                <span className={styles.timingLabel}>Total:</span>
                <span className={styles.timingValue}>{recipeData.timing.total_time}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={styles.recipeContent}>
        <div className={styles.section}>
          <h3>Ingredients</h3>
          <ul className={styles.ingredientsList}>
            {currentIngredients.map((ingredient, index) => (
              <li key={index} className={styles.ingredient}>
                {ingredient}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.section}>
          <div className={styles.directionsHeader}>
            <h3>Directions</h3>
            {completedSteps.size > 0 && (
              <button
                className={styles.resetStepsButton}
                onClick={handleResetSteps}
                title="Reset all completed steps"
              >
                Reset Steps
              </button>
            )}
          </div>
          <ol className={styles.directionsList}>
            {currentDirections.map((direction, index) => (
              <li key={index} className={`${styles.direction} ${completedSteps.has(index) ? styles.completed : ''}`}>
                <div className={styles.stepContainer}>
                  <input
                    type="checkbox"
                    id={`step-${recipeId}-${index}`}
                    className={styles.stepCheckbox}
                    checked={completedSteps.has(index)}
                    onChange={() => handleStepToggle(index)}
                  />
                  <label
                    htmlFor={`step-${recipeId}-${index}`}
                    className={styles.stepText}
                  >
                    {direction}
                  </label>
                </div>
              </li>
            ))}
          </ol>
          {showCelebration && (
            <div className={styles.celebrationMessage}></div>
          )}
        </div>
      </div>
    </div>
  );
}