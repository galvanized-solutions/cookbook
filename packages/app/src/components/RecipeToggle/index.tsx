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

  // Fraction utility functions using proper mathematical algorithms
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };

  // Convert decimal to fraction using continued fractions algorithm
  const decimalToFraction = (decimal: number, maxDenominator: number = 16): { whole: number; numerator: number; denominator: number } => {
    const whole = Math.floor(decimal);
    let remaining = decimal - whole;

    if (remaining < 0.001) {
      return { whole, numerator: 0, denominator: 1 };
    }

    // Use continued fractions to find best rational approximation
    let numerator = 1;
    let denominator = Math.round(1 / remaining);

    // Limit denominator to common cooking fractions
    if (denominator > maxDenominator) {
      // Find best approximation within maxDenominator
      let bestNum = 0;
      let bestDen = 1;
      let bestError = Math.abs(remaining);

      for (let den = 2; den <= maxDenominator; den++) {
        const num = Math.round(remaining * den);
        const error = Math.abs(remaining - num / den);
        if (error < bestError) {
          bestError = error;
          bestNum = num;
          bestDen = den;
        }
      }

      numerator = bestNum;
      denominator = bestDen;
    } else {
      numerator = Math.round(remaining * denominator);
    }

    // Reduce fraction to simplest form
    const divisor = gcd(numerator, denominator);
    numerator = numerator / divisor;
    denominator = denominator / divisor;

    return { whole, numerator, denominator };
  };

  // Parse fraction string to decimal (handles Unicode fractions too)
  const parseFractionToDecimal = (str: string): number => {
    // First convert Unicode fractions to numeric form
    const unicodeToDecimalMap: { [key: string]: number } = {
      '¼': 0.25, '½': 0.5, '¾': 0.75,
      '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
      '⅓': 1/3, '⅔': 2/3,
      '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
      '⅙': 1/6, '⅚': 5/6,
      '⅐': 1/7, '⅑': 1/9, '⅒': 0.1,
    };

    // Handle Unicode fractions like "1½" or just "½"
    for (const [unicode, decimal] of Object.entries(unicodeToDecimalMap)) {
      if (str.includes(unicode)) {
        // Extract whole number if present
        const wholeMatch = str.match(/^(\d+)/);
        const whole = wholeMatch ? parseFloat(wholeMatch[1]) : 0;
        return whole + decimal;
      }
    }

    // Handle mixed numbers like "1 1/2"
    if (str.includes(' ') && str.includes('/')) {
      const parts = str.trim().split(' ');
      const whole = parseFloat(parts[0]);
      const [num, den] = parts[1].split('/').map(n => parseFloat(n.trim()));
      return whole + (num / den);
    }

    // Handle simple fractions like "1/2"
    if (str.includes('/')) {
      const [num, den] = str.split('/').map(n => parseFloat(n.trim()));
      return num / den;
    }

    // Handle decimals and whole numbers
    return parseFloat(str);
  };

  // Format fraction for display
  const formatFraction = (value: number): string => {
    if (value < 0.001) return '0';

    const { whole, numerator, denominator } = decimalToFraction(value);

    if (numerator === 0) {
      return whole.toString();
    }

    // Format as mixed number if whole part exists
    const fractionPart = `${numerator}/${denominator}`;
    return whole > 0 ? `${whole} ${fractionPart}` : fractionPart;
  };

  // Helper function to scale ingredient quantities
  const scaleQuantity = (quantity: string | null, multiplier: number): string | null => {
    if (!quantity || quantity === null) return null;

    try {
      const decimal = parseFractionToDecimal(quantity);
      if (isNaN(decimal)) return quantity;

      const scaled = decimal * multiplier;
      return scaled < 1 ? '1' : formatFraction(scaled);
    } catch {
      return quantity;
    }
  };

  // Parse and scale JSON-LD ingredient strings
  const parseAndScaleJSONLDIngredient = (ingredient: string, multiplier: number): string => {
    // Improved regex patterns to handle various formats:
    // - "2 cups flour" | "2cups flour"
    // - "1.5 tbsp oil" | "1½ tbsp oil"
    // - "500g butter" | "500 g butter"
    // - "1 1/2 cups" | "1½ cups"
    // - "2-3 cloves garlic" (ranges)
    const patterns = [
      // Unicode fractions with optional whole number: "1½ cups", "½ tsp"
      /^(\d*[¼½¾⅛⅜⅝⅞⅓⅔⅕⅖⅗⅘⅙⅚])\s*(.+)$/,
      // Decimal or fraction with optional space: "1.5 cups", "1 1/2 cups", "1/2 cup"
      /^([\d.]+(?:\s+\d+\/\d+)?|\d+\/\d+)\s*(.+)$/,
      // Ranges (use first number): "2-3 cloves"
      /^([\d.]+)\s*-\s*[\d.]+\s+(.+)$/,
    ];

    for (const pattern of patterns) {
      const match = ingredient.match(pattern);

      if (match) {
        const [, quantityStr, rest] = match;
        const scaledQuantity = scaleQuantity(quantityStr.trim(), multiplier);

        if (!scaledQuantity) {
          return ingredient;
        }

        // Preserve original spacing format
        const originalHasSpace = ingredient.match(/^[^\s]+\s+/);
        const spacer = originalHasSpace ? ' ' : '';

        return `${scaledQuantity}${spacer}${rest.trim()}`;
      }
    }

    // No quantity found (e.g., "Salt to taste", "Pepper"), return as-is
    return ingredient;
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