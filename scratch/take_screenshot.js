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
    
    await page.setViewport({ width: 1200, height: 900 });
    
    // Screenshot 1: Single Mode
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await page.type('#journal-input', 'Nature Communication');
    await page.click('#search-btn');
    
    await page.waitForFunction(() => {
        const el = document.getElementById('results-container');
        return el && !el.classList.contains('hidden');
    }, { timeout: 10000 });
    
    await new Promise(r => setTimeout(r, 1000));
    const outSingle = path.join(__dirname, '..', 'public', 'screenshot.png');
    await page.screenshot({ path: outSingle, fullPage: true });
    
    // Screenshot 2: Bulk Mode
    await page.reload({ waitUntil: 'networkidle0' });
    await page.click('#btn-bulk-mode');
    await page.type('#bulk-input', 'Nature Communication\nCell\nJournal of Finance');
    await page.click('#search-btn');
    
    await page.waitForFunction(() => {
        const texts = document.querySelectorAll('.bulk-card h3');
        return texts.length === 3;
    }, { timeout: 60000 });
    
    await new Promise(r => setTimeout(r, 1000));
    const outBulk = path.join(__dirname, '..', 'public', 'screenshot_bulk.png');
    await page.screenshot({ path: outBulk, fullPage: true });
    
    console.log('Screenshots saved!');
    await browser.close();
})();
