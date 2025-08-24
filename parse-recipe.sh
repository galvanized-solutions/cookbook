#!/bin/bash

# Recipe parser wrapper script
# Usage: ./parse-recipe.sh <category> <url> <filename>

if [ $# -ne 3 ]; then
    echo "Usage: $0 <category> <url> <filename>"
    echo "Example: $0 entrees https://example.com/recipe 2025_8_24_entrees.json"
    exit 1
fi

CATEGORY=$1
URL=$2
FILENAME=$3

claude -p recipe-parser-config.json "Parse recipe with category: $CATEGORY, url: $URL, filename: $FILENAME"