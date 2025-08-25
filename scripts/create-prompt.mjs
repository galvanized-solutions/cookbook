import fs from 'node:fs';

const prompt_path = './prompt.txt';
const error_log_path = './error.log';
const output_log_path = './output.log';
const settings_path = './scripts/settings.json';

const settingJson = {
  tools: [
    'WebFetch',
    'Read',
    'Write',
    'LS',
    'TodoWrite',
    'Edit',
    'Grep'
  ],
  allow: [
    'LS(.)',
    'TodoWrite(./TODO.md)',
    'Read(./instructions.md)',
    'Read(./conversions.yaml)',
    'Read(./CLAUDE.md)',
    'Read(./recipe.json)',
    'Write(./recipe.json)'
  ]
};

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
      const prompt = `Please use the ./scripts/instructions.md file's description as your prompt information the inputs category: ${category}, url: ${url} to generate the recipe`;

      settingJson.allow.unshift(`WebFetch(${url})`);
      fs.writeFileSync(settings_path, JSON.stringify(settingJson, null, 2));

      console.log(prompt)
    } else {
      throw new Error('Invalid URL, website must use TLS/HTTPS');
    }
  } catch (error) {
    fs.writeFileSync(error_log_path, error.stack);
  }
}

main();