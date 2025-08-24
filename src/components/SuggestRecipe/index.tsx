import type {ReactNode} from 'react';
import React, {useState} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

interface SuggestRecipeProps {
  className?: string;
}

export default function SuggestRecipe({className}: SuggestRecipeProps): ReactNode {
  const [category, setCategory] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [urlError, setUrlError] = useState<string>('');

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setUrl(value);

    if (value && !isValidHttpsUrl(value)) {
      setUrlError('Please enter a valid HTTPS URL');
    } else {
      setUrlError('');
    }
  };

  const isValidHttpsUrl = (urlString: string): boolean => {
    try {
      const url = new URL(urlString);
      return url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!category) {
      alert('Please select a recipe category');
      return;
    }
    
    if (!url) {
      alert('Please enter a URL');
      return;
    }
    
    if (!isValidHttpsUrl(url)) {
      alert('Please enter a valid HTTPS URL');
      return;
    }

    console.log('Recipe suggestion:', { category, url });
  };

  return (
    <div className={clsx('card', styles.suggestCard, className)}>
      <div className="card__header">
        <Heading as="h3">Suggest a Recipe</Heading>
        <p>Share a recipe from the web to add to our cookbook</p>
      </div>
      <div className="card__body">
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label htmlFor="recipe-category" className={styles.label}>
              Recipe Category
            </label>
            <select
              id="recipe-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={styles.select}
              required
            >
              <option value="">Select a category...</option>
              <option value="appetizers">Appetizers/Starters</option>
              <option value="entrees">Entrees/Mains</option>
              <option value="desserts">Desserts</option>
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="recipe-url" className={styles.label}>
              Recipe URL
            </label>
            <input
              type="url"
              id="recipe-url"
              name="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="https://example.com/recipe"
              className={clsx(styles.input, urlError && styles.inputError)}
              required
            />
            {urlError && <div className={styles.errorMessage}>{urlError}</div>}
          </div>

          <button
            type="submit"
            className={clsx('button button--primary', styles.submitButton)}
            disabled={!category || !url || !!urlError}
          >
            Suggest Recipe
          </button>
        </form>
      </div>
    </div>
  );
}