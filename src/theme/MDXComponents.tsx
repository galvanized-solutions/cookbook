import MDXComponents from '@theme-original/MDXComponents';
import RecipeToggle from '@site/src/components/RecipeToggle';
import ServingsSlider from '@site/src/components/ServingsSlider';
import SuggestRecipe from '@site/src/components/SuggestRecipe';

export default {
  ...MDXComponents,
  // Add our custom components to be available globally in MDX
  RecipeToggle,
  ServingsSlider,
  SuggestRecipe,
};