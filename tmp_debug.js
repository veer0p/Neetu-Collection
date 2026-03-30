const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.error('REQUEST FAILED:', request.url(), request.failure().errorText));

  try {
      await page.goto('http://localhost:8081', { waitUntil: 'networkidle0' });
      console.log('Page loaded');
      
      // We need to click "New Order"
      // Wait for navigation sidebar to render
      await page.waitForTimeout(3000);
      
      // Find the element with text "New Order"
      const newOrderEl = await page.evaluateHandle(() => {
          const els = Array.from(document.querySelectorAll('div'));
          return els.find(el => el.textContent === 'New Order');
      });
      
      if (newOrderEl) {
          console.log('Clicking New Order');
          await newOrderEl.click();
          await page.waitForTimeout(3000); // give it time to crash
      } else {
          console.log('Could not find New Order button');
      }
      
  } catch (e) {
      console.error('Test script error:', e);
  } finally {
      await browser.close();
  }
})();
