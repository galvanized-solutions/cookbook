#!/usr/bin/env node

import { scrapeWithHeadlessChrome, scrapeWithStructuredData } from './recipe-fetch.js';

async function testScraper() {
  const testUrl = process.argv[2];
  
  if (!testUrl) {
    console.error('Usage: node test-recipe-fetch.js <url>');
    process.exit(1);
  }

  if (!testUrl.startsWith('https://')) {
    console.error('Error: URL must use HTTPS');
    process.exit(1);
  }

  console.log(`Testing headless Chrome scraping for: ${testUrl}`);
  
  try {
    // Test basic HTML scraping
    console.log('\n--- Basic HTML Scraping ---');
    const html = await scrapeWithHeadlessChrome(testUrl);
    console.log(`✓ Successfully scraped ${html.length} characters of HTML`);
    
    // Test structured data extraction
    console.log('\n--- Structured Data Extraction ---');
    const { html: htmlWithData, jsonLd } = await scrapeWithStructuredData(testUrl);
    console.log(`✓ Successfully scraped ${htmlWithData.length} characters of HTML`);
    console.log(`✓ Found ${jsonLd.length} JSON-LD structured data blocks`);
    
    if (jsonLd.length > 0) {
      jsonLd.forEach((data, index) => {
        const type = Array.isArray(data['@type']) ? data['@type'].join(', ') : data['@type'];
        console.log(`  Block ${index + 1}: ${type || 'Unknown type'}`);
      });
    }
    
    console.log('\n✅ Headless Chrome scraping is working correctly!');
  } catch (error) {
    console.error('\n❌ Error during scraping:');
    console.error(error.message);
    process.exit(1);
  }
}

testScraper();