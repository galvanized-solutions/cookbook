#!/bin/bash

CATEGORY=$1
URL=$2

# Validate category
VALID_CATEGORIES=("appetizers" "entrees" "desserts")
if [[ ! " ${VALID_CATEGORIES[@]} " =~ " ${CATEGORY} " ]]; then
  echo "Error: Invalid category '$CATEGORY'. Must be one of: ${VALID_CATEGORIES[*]}"
  exit 1
fi

echo "claude -p \"Use the @scripts/instructions.md file and the category: ${CATEGORY} input to complete the task\""

# claude -p "Use the @scripts/instructions.md file and inputs category: ${CATEGORY} and url: ${URL} to generate a recipe"
