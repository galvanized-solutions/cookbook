import puppeteer from 'puppeteer';
import fs from 'node:fs';
import https from 'node:https';
import { URL } from 'node:url';

function getRecipeImage(imageUrl) {
  const imageFormat = imageUrl.split('.').pop();
  const imageName = `/tmp/image.${imageFormat}`;
  const file = fs.createWriteStream(imageName);

  https.get(imageUrl, (response) => {
    console.log('Getting image file', response);

    response.pipe(file);

    file.on('finish', () => {
      file.close();
      console.log(`Image downloaded as ${imageName}`);
    });
  }).on('error', (err) => {
    fs.unlink(imageName); // Remove the file if the download fails
    console.error(`Error downloading image: ${err.message}`);
  });
}

function recursiveGetJsonLd(parsedLd) {
  if (Array.isArray(parsedLd)) {
    const newLd = parsedLd?.[0];

    if (newLd) {
      return recursiveGetJsonLd(newLd);
    }
  } else if (typeof parsedLd === 'object') {
    if (parsedLd) {
      return parsedLd;
    }
  }

  return null;
}

/**
 * Enhanced version that also extracts JSON-LD structured data
 * @param {string} issueBody - The URL to scrape
 * @param {Object} options - Configuration options
 * @returns {Promise<{html: string, jsonLd: Object[]}>} The rendered HTML and extracted JSON-LD data
 */
export async function fetchWithStructuredData() {
  const issueBody = fs.readFileSync('/tmp/issue.json').toString('utf-8');
  const body = JSON.parse(issueBody, null, 2);

  console.log('Parsed issue body:', body);

  // Handle different possible issue body formats
  let url, category;
  
  if (body?.prompt?.url) {
    url = body.prompt.url;
    category = body.prompt.category;
  } else if (body?.url) {
    url = body.url;
    category = body.category;
  } else if (typeof body === 'string') {
    // If it's just a plain string, try to parse as JSON again
    try {
      const parsed = JSON.parse(body);
      url = parsed.url;
      category = parsed.category;
    } catch (e) {
      throw new ReferenceError('Could not parse issue body format');
    }
  } else {
    throw new ReferenceError('url is required in issue body');
  }

  if (!url) {
    throw new ReferenceError('url is required');
  }

  if (!category) {
    category = 'entrees'; // default fallback
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',  // Uses /tmp instead of /dev/shm
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  });
  try {
    const page = await browser.newPage();

    // Set page timeouts
    await page.setDefaultTimeout(60000);
    await page.setDefaultNavigationTimeout(60000);

    // Only allow essential resources for JSON-LD extraction
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      const url = req.url();

      // Only allow document and essential scripts/stylesheets from the main domain
      const mainDomain = new URL(url).hostname;
      const requestDomain = new URL(req.url()).hostname;

      // Allow main document
      if (resourceType === 'document') {
        req.continue();
        return;
      }

      // Allow scripts and stylesheets from the main domain only
      if ((resourceType === 'script' || resourceType === 'stylesheet') && 
          (requestDomain === mainDomain || requestDomain.includes(mainDomain))) {
        req.continue();
        return;
      }

      // Allow common CDNs that might contain essential scripts
      const allowedCDNs = [
        'cdn.jsdelivr.net',
        'cdnjs.cloudflare.com',
        'unpkg.com',
        'ajax.googleapis.com'
      ];

      if ((resourceType === 'script' || resourceType === 'stylesheet') && 
          allowedCDNs.some(cdn => url.includes(cdn))) {
        req.continue();
        return;
      }

      // Block everything else (images, fonts, tracking, ads, etc.)
      req.abort();
    });

    // Debug response errors
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`HTTP ${response.status()}: ${response.url()}`);
      }
    });

    await page.setViewport({ width: 1920, height: 1080 });
    
    // More realistic browser headers
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
    });

    console.log(`Navigating to: ${url}`);
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // Human-like delay after navigation
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    // Wait for recipe content to load (try multiple selectors)
    try {
      await page.waitForSelector('[itemtype*="Recipe"], script[type="application/ld+json"], .recipe', {
        timeout: 10000
      });
    } catch (e) {
      console.log('Recipe selectors not found, proceeding anyway...');
    }

    // Extract JSON-LD data with better error handling
    const jsonLd = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      console.log(`Found ${scripts.length} JSON-LD scripts`);
      
      let recipeData = null;

      scripts.forEach((script, index) => {
        try {
          const parsed = JSON.parse(script.textContent);
          console.log(`Script ${index}:`, parsed['@type'] || 'No @type');

          // Look for Recipe type in various structures
          if (parsed['@type'] === 'Recipe') {
            recipeData = parsed;
          } else if (Array.isArray(parsed)) {
            const recipe = parsed.find(item => item['@type'] === 'Recipe');
            if (recipe) recipeData = recipe;
          } else if (parsed['@graph']) {
            const recipe = parsed['@graph'].find(item => item['@type'] === 'Recipe');
            if (recipe) recipeData = recipe;
          }
        } catch (e) {
          console.error(`Failed to parse JSON-LD script ${index}:`, e.message);
        }
      });

      return recipeData;
    });

    const html = await page.content();

    fs.writeFileSync('/tmp/html.json', JSON.stringify(html, null, 2));

    if (jsonLd) {
      console.log('Found recipe JSON-LD data');
      fs.writeFileSync('/tmp/jsonld.json', JSON.stringify(jsonLd, null, 2));

      // Handle image URL (could be string, object, or array)
      let imageUrl;
      if (typeof jsonLd.image === 'string') {
        imageUrl = jsonLd.image;
      } else if (Array.isArray(jsonLd.image)) {
        imageUrl = jsonLd.image[0];
      } else if (jsonLd.image?.url) {
        imageUrl = jsonLd.image.url;
      }
      
      if (imageUrl) {
        console.log('Downloading recipe image:', imageUrl);
        getRecipeImage(imageUrl);
      } else {
        console.log('No recipe image found in JSON-LD');
      }
    } else {
      console.log('No recipe JSON-LD data found');
    }

    console.log(category);
  } catch (error) {
    console.error('Recipe fetch error:', error);
    throw new Error(`Failed to get recipe: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

await fetchWithStructuredData();