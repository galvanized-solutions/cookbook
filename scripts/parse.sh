#!/bin/bash

CATEGORY=$1
URL=$2

PROMPT=$(node ./scripts/create-prompt.mjs "$CATEGORY" "$URL")

if [[ -n "$PROMPT" ]]; then
  echo "claude --settings ./scripts/settings.json -p \"${PROMPT}\""

  claude --settings ./scripts/settings.json -p "\"${PROMPT}\""
else
  echo "Error: Prompt generation failed."
fi

