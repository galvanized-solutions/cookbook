import type {ReactNode} from 'react';
import React, {useState} from 'react';
import clsx from 'clsx';

import Heading from '@theme/Heading';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

interface SuggestRecipeProps {
  className?: string;
}

export default function SuggestRecipe({className}: SuggestRecipeProps): ReactNode {
  const [activeTab, setActiveTab] = useState<'website' | 'text'>('website');
  const [category, setCategory] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [ingredients, setIngredients] = useState<string>('');
  const [directions, setDirections] = useState<string>('');
  const [nutrition, setNutrition] = useState<string>('');
  const [urlError, setUrlError] = useState<string>('');
  const [textError, setTextError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');
  const { siteConfig } = useDocusaurusContext();
  const key = siteConfig.customFields?.GREAT_SUCCESS as string | undefined;

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Clear previous messages
    setSubmitMessage('');
    setSubmitError('');
    
    if (!category) {
      setSubmitError('Please select a recipe category');
      return;
    }
    
    if (activeTab === 'website') {
      if (!url) {
        setSubmitError('Please enter a URL');
        return;
      }
      
      if (!isValidHttpsUrl(url)) {
        setSubmitError('Please enter a valid HTTPS URL');
        return;
      }
    } else {
      if (!title.trim() || !ingredients.trim() || !directions.trim()) {
        setSubmitError('Please fill in Title, Ingredients, and Directions (Nutrition is optional)');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // GitHub API configuration
      const GREAT_SUCCESS = key;
      const REPO_OWNER = 'galvanized-solutions';
      const REPO_NAME = 'cookbook';

      if (!GREAT_SUCCESS) {
        throw new Error('GitHub token not configured');
      }

      // Gather request metadata
      const timestamp = new Date().toISOString();
      const userAgent = navigator.userAgent;
      const prompt = activeTab === 'website' 
        ? `Use the ./scripts/instructions.md file's description as your prompt information and the inputs category: ${category}, url: ${url} to generate the recipe output as instructed`
        : `Use the ./scripts/instructions.md file's description as your prompt information and the inputs category: ${category}, text: {title: "${title}", ingredients: "${ingredients}", directions: "${directions}", nutrition: "${nutrition}"} to generate the recipe output as instructed`;
      
      const body = {
        timestamp,
        userAgent,
        prompt,
        category,
        url: activeTab === 'website' ? url : null,
        title: activeTab === 'text' ? title : null,
        ingredients: activeTab === 'text' ? ingredients : null,
        directions: activeTab === 'text' ? directions : null,
        nutrition: activeTab === 'text' ? nutrition : null,
      }

      // Create new branch
      const createBranchResponse = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${GREAT_SUCCESS}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
          body: JSON.stringify({
            title: 'New recipe suggestion',
            body: JSON.stringify(body, null, 2),
            labels: ["recipe-suggestion"]
          }),
        }
      );

      if (!createBranchResponse.ok) {
        const errorData = await createBranchResponse.json();
        throw new Error(`Failed to create PR: ${errorData.message}`);
      }

      const prData = await createBranchResponse.json();

      setSubmitMessage(`Recipe suggestion submitted successfully! Pull request #${prData?.number} has been created.`);
      // Clear form on success
      setCategory('');
      setUrl('');
      setTitle('');
      setIngredients('');
      setDirections('');
      setNutrition('');
    } catch (error) {
      console.error('Error submitting recipe suggestion:', error);
      if (error.message.includes('GitHub token not configured')) {
        setSubmitError('GitHub integration is not configured. Please contact the site administrator.');
      } else {
        setSubmitError(`Failed to submit recipe suggestion: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
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

          <div className={styles.tabContainer}>
            <div className={styles.tabButtons}>
              <button
                type="button"
                className={clsx(styles.tabButton, activeTab === 'website' && styles.activeTab)}
                onClick={() => setActiveTab('website')}
              >
                Website
              </button>
              <button
                type="button"
                className={clsx(styles.tabButton, activeTab === 'text' && styles.activeTab)}
                onClick={() => setActiveTab('text')}
              >
                Text
              </button>
            </div>

            <div className={styles.tabContent}>
              {activeTab === 'website' ? (
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
                    required={activeTab === 'website'}
                  />
                  {urlError && <div className={styles.errorMessage}>{urlError}</div>}
                </div>
              ) : (
                <div className={styles.textFields}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="recipe-title" className={styles.label}>
                      Title *
                    </label>
                    <input
                      id="recipe-title"
                      name="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Recipe title"
                      className={clsx(styles.input, textError && styles.inputError)}
                      required={activeTab === 'text'}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="recipe-ingredients" className={styles.label}>
                      Ingredients *
                    </label>
                    <textarea
                      id="recipe-ingredients"
                      name="ingredients"
                      value={ingredients}
                      onChange={(e) => setIngredients(e.target.value)}
                      placeholder="List ingredients with quantities..."
                      className={clsx(styles.textarea, textError && styles.inputError)}
                      rows={4}
                      required={activeTab === 'text'}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="recipe-directions" className={styles.label}>
                      Directions *
                    </label>
                    <textarea
                      id="recipe-directions"
                      name="directions"
                      value={directions}
                      onChange={(e) => setDirections(e.target.value)}
                      placeholder="Step-by-step cooking instructions..."
                      className={clsx(styles.textarea, textError && styles.inputError)}
                      rows={4}
                      required={activeTab === 'text'}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="recipe-nutrition" className={styles.label}>
                      Nutrition (Optional)
                    </label>
                    <textarea
                      id="recipe-nutrition"
                      name="nutrition"
                      value={nutrition}
                      onChange={(e) => setNutrition(e.target.value)}
                      placeholder="Nutritional information, serving size, calories..."
                      className={styles.textarea}
                      rows={3}
                    />
                  </div>

                  {textError && <div className={styles.errorMessage}>{textError}</div>}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className={clsx('button button--primary', styles.submitButton)}
            disabled={!category || (activeTab === 'website' ? (!url || !!urlError) : (!title.trim() || !ingredients.trim() || !directions.trim())) || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Suggest Recipe'}
          </button>
          
          {submitMessage && (
            <div className={styles.successMessage}>
              {submitMessage}
            </div>
          )}
          
          {submitError && (
            <div className={styles.errorMessage}>
              {submitError}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}