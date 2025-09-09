# Claude's Cookbook
*An AI-Powered Recipe Management System*

## About This Project

This cookbook represents an exploration into how AI can solve everyday problems through practical feature development. The challenge: constantly losing recipes and dealing with inconsistent measurements across different sources. The solution: a centralized recipe management system that can parse any recipe from the web, standardize formats, and provide features tailored to actual cooking needs.

**Key Features:**
- **Automated Recipe Parsing**: Submit any recipe URL via GitHub issues and Claude automatically extracts, standardizes, and formats the recipe using Schema.org JSON-LD
- **Dual Measurement Support**: Toggle between metric and imperial measurements with clean, separate ingredient lists
- **Interactive Cooking Mode**: Track cooking progress with checkboxes, celebration animations, and persistent step completion
- **Smart Ingredient Scaling**: Adjust servings with intelligent fraction and decimal handling
- **Consistent Formatting**: All recipes follow the same structure regardless of source, making them easier to follow

This project demonstrates how AI can be leveraged not just for code generation, but for building complete features that solve real-world problems. Claude was used throughout development for parsing recipes, building React components, implementing GitHub Actions workflows, and creating the overall architecture.

**Built with**: Docusaurus, React, TypeScript, Puppeteer, GitHub Actions, and Claude AI

## The Real Recipe

Sure, this looks like a cookbook app on the surface. But let's be honest—this project is really a recipe for something much more interesting: **AI-human collaborative development**. 

What started as "I keep losing my recipes" became a fascinating experiment in how AI can participate in the entire software development lifecycle. Not just "write me a function," but "understand my problem, architect a solution, build the components, set up the automation, handle the edge cases, and oh yeah—make it actually work."

This project represents a new kind of development workflow where:
- **AI doesn't just code, it collaborates**: From initial problem analysis to component simplification based on user feedback
- **Real problems drive AI capabilities**: The need for consistent recipe parsing pushed us through JSON-LD schemas, Docker containerization, and GitHub Actions workflows
- **Iteration actually works**: When the RecipeToggle component was "more complex than I want," we simplified it. When containers couldn't find Chrome, we fixed it. AI development that responds to real feedback.
- **The meta is the message**: We built an AI-powered system that uses AI to parse content, using AI to automate the development process itself

In other words, this cookbook serves up more than just recipes—it's a proof-of-concept for AI as a development partner, not just a code generator. The recipes are just the excuse; the real dish is the development process itself.

*Bon appétit, fellow developers.*

[![Build and Push Cookbook Containers](https://github.com/galvanized-solutions/cookbook/actions/workflows/build-container.yml/badge.svg)](https://github.com/galvanized-solutions/cookbook/actions/workflows/build-container.yml)
[![Build and Deploy Docusaurus to Pages](https://github.com/galvanized-solutions/cookbook/actions/workflows/build.yml/badge.svg)](https://github.com/galvanized-solutions/cookbook/actions/workflows/build.yml)
[![Generate Recipe](https://github.com/galvanized-solutions/cookbook/actions/workflows/generate-recipe.yml/badge.svg)](https://github.com/galvanized-solutions/cookbook/actions/workflows/generate-recipe.yml)

## 🌐 Live Site
**[View the Cookbook →](https://galvanized-solutions.github.io/cookbook/)**
