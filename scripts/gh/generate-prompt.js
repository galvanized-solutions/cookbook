function main() {
  const [_, __, bodyString] = process.argv;
  const isImport = bodyString.includes('import');
  const isManual = bodyString.includes('manual');

  if (!isImport && !isManual) {
    throw new Error('Issue must be labeled with either "import" or "manual"');
  }

  if (!bodyString.trim()) {
    throw new Error('No issue body found');
  }

  const type = isImport ? 'import' : 'manual';
  const body = JSON.parse(bodyString);

  if (type === 'import' && body.url && body.category) {
    console.log(`Use the @scripts/instructions.md file and input: category "${body.category}"`);
  } else if (type === 'manual' && body.title && body.metadata && body.ingredients && body.directions) {
    console.log(`Use the @scripts/instructions-manual.md file and the inputs:
      - category: ${body.category}
      - url: ${body.url} to generate a recipe
      - metadata: ${body.metadata}
      - ingredients: ${body.ingredients}
      - directions: ${body.directions}
      - nutrition: ${body.nutrition || ''}
      - title: ${body.title}
    `);
  }
}

main()