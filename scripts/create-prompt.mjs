import fs from 'node:fs';

const prompt_path = './prompt.txt';
const error_log_path = './error.log';

function getCategoryPath(category) {
  switch (category) {
    case 'appetizers':
      return './docs/appetizers';
    case 'entrees':
      return './docs/entrees';
    case 'desserts':
      return './docs/desserts';
    default:
      throw new Error(`Unknown category: ${category}`);
  }
}

function main() {
  try {
    const [_, __, category, url] = process.argv
    const now = new Date();
    const category_path = getCategoryPath(category);
    const filename = `${now.getFullYear()}_${now.getMonth() + 1}_${now.getDate()}_${category}.json`;

    if (url.startsWith('https://')) {
      const prompt = `Please use the description in the ./scripts/instructions.md file and the inputs are as follows category: ${category}, the url: ${url} and filename: ${filename}`;

      fs.writeFileSync(prompt_path, prompt);
    } else {
      throw new Error('Invalid URL, website must use TLS/HTTPS');
    }
  } catch (error) {
    fs.writeFileSync(error_log_path, error.stack);
  }
}

main();