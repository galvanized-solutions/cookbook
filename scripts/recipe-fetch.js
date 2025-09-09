import puppeteer from 'puppeteer';
import fs from 'node:fs';
import https from 'node:https';

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

/**
 * Enhanced version that also extracts JSON-LD structured data
 * @param {string} issueBody - The URL to scrape
 * @param {Object} options - Configuration options
 * @returns {Promise<{html: string, jsonLd: Object[]}>} The rendered HTML and extracted JSON-LD data
 */
export async function fetchWithStructuredData() {
  let browser;
  try {
    const issueBody = fs.readFileSync('/tmp/issue.json');
    const body = JSON.stringify(issueBody, null, 2);

    if (!body?.prompt?.url) {
      throw new ReferenceError('url is required on body');
    }

    if (!body?.prompt?.category) {
      throw new ReferenceError('url is required on body');
    }
    const url = body.prompt.url;

    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Block images for faster loading
    if (options.blockImages !== false) {
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (resourceType === 'image' || resourceType === 'media' || resourceType === 'font') {
          req.abort();
        } else {
          req.continue();
        }
      });
    }

    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: options.timeout || 30000
    });

    // Extract JSON-LD data
    const jsonLd = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      let data = null;

      scripts.forEach((script) => {
        try {
          const parsed = JSON.parse(script.textContent);

          if (parsed?.length) {
            data = parsed
          }
        } catch (e) {
          console.error('Failed to parse JSON-LD:', e);
        }
      });

      return data;
    });

    const html = await page.content();

    fs.writeFileSync('/tmp/html.json', JSON.stringify(html, null, 2));

    if (jsonLd.length) {
      const [recipeJsonLd] = jsonLd;

      fs.writeFileSync('/tmp/jsonld.json', JSON.stringify(recipeJsonLd, null, 2));

      if (recipeJsonLd?.image?.url) {
        console.log('Getting image', recipeJsonLd?.image?.url)
        getRecipeImage(recipeJsonLd.image.url);
      } else {
        console.error('Unable to locate image', jsonLd?.image?.url);
      }
    }

    console.log(body.prompt.category);
  } catch (error) {
    throw new Error(`Failed to get recipe: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

const [_, __, URL] = process.argv;

await fetchWithStructuredData(URL);