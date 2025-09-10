import { chromium } from '@playwright/test';
import fs from 'node:fs';
import https from 'node:https';
import { URL } from 'node:url';

function getRecipeImage(imageUrl) {
  const imageFormat = imageUrl.split('.').pop();
  const imageName = `/tmp/image.${imageFormat}`;
  const file = fs.createWriteStream(imageName);

  https.get(imageUrl, (response) => {
    response.pipe(file);

    file.on('finish', () => {
      file.close();
    });
  }).on('error', (err) => {
    fs.unlink(imageName); // Remove the file if the download fails
    console.warn(`Error downloading image: ${err.message}`);
  });
}

/**
 * Enhanced version that also extracts JSON-LD structured data using Playwright
 * @returns {Promise<{html: string, jsonLd: Object[]}>} The rendered HTML and extracted JSON-LD data
 */
export async function fetchWithStructuredData() {
  const issueBody = fs.readFileSync('/tmp/issue.json').toString('utf-8');
  const body = JSON.parse(issueBody, null, 2);

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

  // Launch browser with Playwright - much simpler configuration
  const browser = await chromium.launch({
    headless: true
  });

  try {
    const page = await browser.newPage();

    // Set timeouts
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(60000);

    // Block unnecessary resources for faster loading
    await page.route('**/*', (route) => {
      const request = route.request();
      const resourceType = request.resourceType();
      const requestUrl = request.url();

      // Allow document and essential resources
      if (resourceType === 'document') {
        return route.continue();
      }

      // Only allow scripts and stylesheets from main domain or trusted CDNs
      const mainDomain = new URL(url).hostname;
      const requestDomain = new URL(requestUrl).hostname;
      
      const allowedCDNs = [
        'cdn.jsdelivr.net',
        'cdnjs.cloudflare.com', 
        'unpkg.com',
        'ajax.googleapis.com'
      ];

      if ((resourceType === 'script' || resourceType === 'stylesheet') && 
          (requestDomain === mainDomain || 
           requestDomain.includes(mainDomain) ||
           allowedCDNs.some(cdn => requestUrl.includes(cdn)))) {
        return route.continue();
      }

      // Block everything else
      route.abort();
    });

    // Set realistic browser properties
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
    });

    console.warn(`Navigating to: ${url}`);
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // Human-like delay after navigation
    await page.waitForTimeout(Math.random() * 1000 + 500);

    // Wait for recipe content to load
    try {
      await page.waitForSelector('script[type="application/ld+json"]', {
        timeout: 5000
      });
    } catch (e) {
      console.warn('Recipe selectors not found, proceeding anyway...');
    }

    // Extract JSON-LD data
    const jsonLd = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      
      function getRecipe(input) {
        if (Array.isArray(input)) {
          for (const value of input) {
            const recipe = getRecipe(value);
            if (recipe) return recipe;
          }
        }

        if (input && typeof input === "object") {
          if (input?.['@type'] === 'Recipe') {
            return input;
          }

          if (input?.['@graph']) {
            return getRecipe(input['@graph']);
          }
        }
      }

      if (scripts?.length) {
        for (const script of scripts.values()) {
          try {
            const parsed = JSON.parse(script.textContent);
            const recipeJsonLd = getRecipe(parsed);

            if (recipeJsonLd) {
              return recipeJsonLd;
            }
          } catch (e) {
            console.warn(`Failed to parse JSON-LD script:`, e.message);
          }
        }
      }
    });

    const html = await page.content();

    fs.writeFileSync('/tmp/html.json', JSON.stringify(html, null, 2));

    if (jsonLd) {
      console.warn('Found recipe JSON-LD data');
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
        console.warn('Downloading recipe image:', imageUrl);
        getRecipeImage(imageUrl);
      } else {
        console.warn('No recipe image found in JSON-LD');
      }
    } else {
      console.warn('No recipe JSON-LD data found');
    }

    console.log(category);
  } catch (error) {
    console.warn('Recipe fetch error:', error);
    throw new Error(`Failed to get recipe: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

await fetchWithStructuredData();