#!/bin/bash

echo "{{ github.event.issue.body }}" > /tmp/issue.json

# Extract URL and category from issue body
URL=$(echo '${{ github.event.issue.body }}' | jq -r '.url // empty')
CATEGORY=$(echo '${{ github.event.issue.body }}' | jq -r '.category // empty')

if [[ -z "$URL" ]]; then
  echo "Error: No URL found in issue"
  exit 1
fi

# Use the containerized recipe fetcher
node ./scripts/recipe-fetch.js "$URL"

# Verify the output file was created
if [[ ! -f "/tmp/html.json" ]]; then
  echo "Error: html.json was not created"
  exit 1
fi

# Verify the output file was created
if [[ -f "/tmp/jsonld.json" ]]; then
  echo "Info: /tmp/jsonld.json created. Using jsonld.json to build"
else
  echo "Warn: html.json was not created, attempting to use html.json"
fi
