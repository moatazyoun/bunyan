import puppeteer from 'puppeteer';

(async () => {
  console.log("STARTING TEST SCRIPT...");
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error' || type === 'warning' || type === 'log') {
        console.log(`PAGE [${type.toUpperCase()}]:`, msg.text());
      }
    });
    page.on('pageerror', err => console.error('PAGE ERROR:', err.toString()));
    
    await page.goto('http://localhost:3000');
    await new Promise(r => setTimeout(r, 5000));
    const content = await page.evaluate(() => document.getElementById('root')?.innerHTML || 'NO ROOT');
    console.log("ROOT HTML LENGTH:", content.length);
    if (content.length < 500) {
       console.log("ROOT HTML:", content);
    }
    
    await browser.close();
  } catch(e) {
    console.error("SCRIPT ERROR:", e);
  }
})();
