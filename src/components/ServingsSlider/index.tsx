import React from 'react';
import styles from './styles.module.css';

interface ServingsSliderProps {
  defaultServings: number;
  currentServings: number;
  onServingsChange: (servings: number) => void;
  onReset?: () => void;
  min?: number;
  max?: number;
}

export default function ServingsSlider({ 
  defaultServings, 
  currentServings, 
  onServingsChange,
  onReset,
  min = 1,
  max = Math.max(defaultServings * 3, 24) // Default max is 3x original or 24, whichever is larger
}: ServingsSliderProps): JSX.Element {
  
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newServings = parseInt(event.target.value);
    onServingsChange(newServings);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newServings = parseInt(event.target.value);
    if (!isNaN(newServings) && newServings >= min && newServings <= max) {
      onServingsChange(newServings);
    }
  };

  const resetToDefault = () => {
    if (onReset) {
      onReset(); // Use custom reset handler if provided
    } else {
      onServingsChange(defaultServings); // Fallback to default behavior
    }
  };

  const multiplier = currentServings / defaultServings;
  const isModified = currentServings !== defaultServings;

  return (
    <div className={styles.servingsContainer}>
      <div className={styles.servingsHeader}>
        <label htmlFor="servings-slider" className={styles.servingsLabel}>
          Servings
        </label>
        {isModified && (
          <button 
            onClick={resetToDefault}
            className={styles.resetButton}
            title="Reset to original servings"
          >
            Reset
          </button>
        )}
      </div>
      
      <div className={styles.servingsControls}>
        <input
          id="servings-slider"
          type="range"
          min={min}
          max={max}
          value={currentServings}
          onChange={handleSliderChange}
          className={styles.slider}
        />
        
        <div className={styles.servingsInput}>
          <input
            type="number"
            min={min}
            max={max}
            value={currentServings}
            onChange={handleInputChange}
            className={styles.numberInput}
          />
          <span className={styles.servingsText}>servings</span>
        </div>
      </div>

      {isModified && (
        <div className={styles.multiplierInfo}>
          <span className={styles.multiplierText}>
            Ingredients scaled by {multiplier.toFixed(multiplier % 1 === 0 ? 0 : 1)}x
          </span>
        </div>
      )}
    </div>
  );
}