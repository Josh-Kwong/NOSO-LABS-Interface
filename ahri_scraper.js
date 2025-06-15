// Filename: ahri_scraper.js
// Description: Scrapes 'Air Conditioners' from AHRI using Puppeteer with stealth and UI navigation

const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const CATEGORY = {
  name: 'Air Conditioners',
  limit: 300
};

async function scrapeAirConditioners(page, limit) {
  let products = [];
  let hasNext = true;

  // 1. Go to homepage
  await page.goto('https://www.ahridirectory.org/', { waitUntil: 'networkidle2' });

  // Debug: Wait extra time, take screenshot, log iframes and text content
  await new Promise(res => setTimeout(res, 5000)); // Wait 5 seconds for everything to load
  await page.screenshot({ path: 'debug_home.png' }); // Save screenshot for debugging

  // Log all iframe URLs
  const frameUrls = await page.frames().map(f => f.url());
  console.log('iframes:', frameUrls);

  // Log all text content on the page
  const cardTitles = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*')).map(el => el.textContent);
  });
  console.log('All text content on page:', cardTitles);

  // Log all elements containing "Air Conditioning"
  const acElements = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*'))
      .filter(el => el.textContent && el.textContent.includes('Air Conditioning'))
      .map(el => ({
        tag: el.tagName,
        class: el.className,
        text: el.textContent.trim()
      }));
  });
  console.log('Elements containing "Air Conditioning":', acElements);

  // Try to wait for a more general selector
  await page.waitForSelector('.card-title, .card, div', { timeout: 60000 });

  // 2. Find all cards and click the one with the exact text "Air Conditioning"
  const cardHandles = await page.$$('.card.shadow.h-100.cursor-pointer');
  let found = false;
  for (const handle of cardHandles) {
    const text = await page.evaluate(el => el.textContent.trim(), handle);
    if (text === 'Air Conditioning') {
      await handle.click();
      found = true;
      await new Promise(res => setTimeout(res, 1000)); // Wait for navigation/animation
      break;
    }
  }
  if (!found) {
    throw new Error('Could not find Air Conditioning card to click!');
  }

  // Wait for the "Search" button to appear after clicking
  await page.waitForSelector('button[type="submit"]', { timeout: 10000 });

  // 4. Wait for results table
  await page.waitForSelector('table.dataTable', { timeout: 60000 });

  while (products.length < limit && hasNext) {
    await new Promise(res => setTimeout(res, 3000));

    // Scrape products on this page
    const pageProducts = await page.evaluate(() => {
      const rows = document.querySelectorAll('table.dataTable tbody tr');
      return Array.from(rows).map(row => {
        const cells = row.querySelectorAll('td');
        return {
          ahriRef: cells[0]?.innerText.trim(),
          detailLink: cells[0]?.querySelector('a')?.href,
          brand: cells[1]?.innerText.trim(),
          model: cells[3]?.innerText.trim(),
          manualLink: cells[0]?.querySelector('a')?.href
        };
      });
    });

    // Optionally, scrape details for each product (can be slow)
    for (let product of pageProducts) {
      if (products.length >= limit) break;
      if (!product.detailLink) continue;
      const detailPage = await page.browser().newPage();
      try {
        await detailPage.goto(product.detailLink, { waitUntil: 'networkidle2' });
        await new Promise(res => setTimeout(res, 1000));
        const detailData = await detailPage.evaluate(() => {
          const getText = (label) => {
            const el = [...document.querySelectorAll('.card-body div')]
              .find(div => div.innerText.includes(label));
            return el ? el.innerText.split(':').slice(1).join(':').trim() : '';
          };
          return {
            seer2: getText('SEER2'),
            voltage: getText('Voltage'),
            phase: getText('Phase')
          };
        });
        Object.assign(product, detailData);
      } catch (err) {
        // Ignore detail errors
      }
      await detailPage.close();
      products.push(product);
    }

    // Check for next page
    const nextBtn = await page.$('a.paginate_button.next:not(.disabled)');
    if (nextBtn && products.length < limit) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        nextBtn.click()
      ]);
    } else {
      hasNext = false;
    }
  }

  return products.slice(0, limit);
}

(async () => {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = await browser.newPage();

  // Set a real user-agent
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  console.log(`Scraping ${CATEGORY.name}...`);
  const products = await scrapeAirConditioners(page, CATEGORY.limit);
  console.log(`✅ Scraped ${products.length} products from ${CATEGORY.name}`);

  fs.writeFileSync('products.json', JSON.stringify(products, null, 2));
  console.log(`✅ Saved ${products.length} products to products.json`);

  await browser.close();
})();

