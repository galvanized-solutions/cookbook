#!/usr/bin/env node
/**
 * Sync tags.yml and authors.yml between recipes and suggestions directories
 * This ensures both blogs share the same metadata files during build
 */

const fs = require('fs');
const path = require('path');

const RECIPES_DIR = path.join(__dirname, '../recipes');
const SUGGESTIONS_DIR = path.join(__dirname, '../suggestions');

function syncFile(filename) {
  const sourcePath = path.join(RECIPES_DIR, filename);
  const targetPath = path.join(SUGGESTIONS_DIR, filename);
  
  // Check if source exists
  if (!fs.existsSync(sourcePath)) {
    console.warn(`⚠️  Source file ${sourcePath} does not exist`);
    return;
  }
  
  // Create suggestions directory if it doesn't exist
  if (!fs.existsSync(SUGGESTIONS_DIR)) {
    fs.mkdirSync(SUGGESTIONS_DIR, { recursive: true });
  }
  
  // Copy file from recipes to suggestions
  try {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✅ Synced ${filename} from recipes to suggestions`);
  } catch (error) {
    console.error(`❌ Failed to sync ${filename}:`, error.message);
    process.exit(1);
  }
}

function main() {
  console.log('🔄 Syncing blog metadata files...');
  
  // Sync both metadata files
  syncFile('authors.yml');
  syncFile('tags.yml');
  
  console.log('✨ Blog metadata sync complete!');
}

if (require.main === module) {
  main();
}

module.exports = { syncFile, main };