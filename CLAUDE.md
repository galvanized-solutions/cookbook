# Cookbook Project Context

## Thought pattern
- Be detailed with your internal monologue

## Files to Act on
@/tmp/jsonld.json
@/tmp/html.json
/tmp/image.{jpg|png|*}

- @/tmp/jsonld.json:
  - Possibly does not exist if it is available it should be preferred otherwise use the @/tmp/html.json
- @/tmp/html.json: 
  - Should always be available, if it is not then we cannot perform this action and should exit stating so

There will be an image file that could be of any format it will be /tmp/recipe.{jpg|png|*} we cannot know what format it is until the time it runs.

## Measurement Conversions
@scripts/instructions.md
@scripts/conversions.yaml