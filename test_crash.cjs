const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => {
    if (request.url().includes('localhost')) {
      console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText);
    }
  });

  console.log('Navigating to login...');
  await page.goto('http://localhost:5173/login');
  
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'schoolkull@gmail.com');
  await page.type('input[type="password"]', 'School123@');
  await page.click('button[type="submit"]');
  
  console.log('Waiting for nav...');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  console.log('Logged in!');
  
  console.log('Navigating to tracking...');
  await page.goto('http://localhost:5173/tracking/3a4b7684-0e64-4c9b-9a0c-e84f07f1939a', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
