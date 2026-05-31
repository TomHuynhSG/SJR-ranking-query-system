const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Set a good viewport for the screenshot
    await page.setViewport({ width: 1200, height: 900 });
    
    // Navigate to local server
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Type in the search query and submit
    await page.type('#journal-input', 'Nature Communication');
    await page.click('button[type="submit"]');
    
    // Wait for the results container to be visible (it loses the hidden class)
    await page.waitForFunction(() => {
        const el = document.getElementById('results-container');
        return el && !el.classList.contains('hidden');
    }, { timeout: 30000 });
    
    // Give it a tiny bit of time for CSS animations to finish
    await new Promise(r => setTimeout(r, 1000));
    
    // Take a full page screenshot
    const outputPath = path.join(__dirname, '..', 'public', 'screenshot.png');
    await page.screenshot({ path: outputPath, fullPage: true });
    
    console.log('Screenshot saved to ' + outputPath);
    await browser.close();
})();
