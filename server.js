const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { parse } = require('csv-parse');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

function parseCsv(csvString) {
    return new Promise((resolve, reject) => {
        parse(csvString, {
            columns: true,
            delimiter: ';',
            skip_empty_lines: true
        }, (err, records) => {
            if (err) reject(err);
            else resolve(records);
        });
    });
}

app.get('/api/search', async (req, res) => {
    let browser = null;
    let page = null;
    
    // Helper to get or launch browser
    const getPage = async () => {
        if (!browser) {
            browser = await puppeteer.launch({ 
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            page = await browser.newPage();
            // Navigate to the domain to prevent CORS errors during page.evaluate fetch
            await page.goto('https://www.scimagojr.com', { waitUntil: 'domcontentloaded' });
            try {
                // Wait briefly in case of Cloudflare challenge on the homepage
                await page.waitForSelector('.searchinput', { timeout: 10000 });
            } catch (e) {
                console.log('Timeout waiting for .searchinput on homepage');
            }
        }
        return page;
    };

    try {
        const query = req.query.q;
        const year = req.query.year || '2025';
        
        if (!query) {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }

        const safeQuery = query.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const cacheDir = path.join(__dirname, 'csv_ranking_files');
        const infoCacheDir = path.join(__dirname, 'info_cache');
        
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        if (!fs.existsSync(infoCacheDir)) fs.mkdirSync(infoCacheDir, { recursive: true });

        const journalInfoFile = path.join(infoCacheDir, `journal_${safeQuery}.json`);
        
        let matchedName = null;
        let sourceId = null;
        let categories = [];
        let matchedHref = null;
        
        console.log(`Searching for journal: ${query}`);
        
        if (fs.existsSync(journalInfoFile)) {
            console.log(`Using cached journal info for ${query}`);
            const cachedInfo = JSON.parse(await fsPromises.readFile(journalInfoFile, 'utf8'));
            matchedName = cachedInfo.matchedName;
            sourceId = cachedInfo.sourceId;
            categories = cachedInfo.categories;
        } else {
            console.log(`Scraping journal info for ${query}`);
            const p = await getPage();
            
            // 1. Search for the journal
            const searchUrl = `https://www.scimagojr.com/journalsearch.php?q=${encodeURIComponent(query)}`;
            await p.goto(searchUrl, { waitUntil: 'domcontentloaded' });
            
            try {
                await p.waitForSelector('.search_results', { timeout: 15000 });
            } catch (e) {
                console.log('Timeout waiting for .search_results, might be cloudflare issue or no results');
            }
            
            const html1 = await p.content();
            const $1 = cheerio.load(html1);
            
            $1('.search_results > a').each((i, el) => {
                const jrnlname = $1(el).find('.jrnlname').text().trim();
                if (jrnlname.toLowerCase() === query.toLowerCase()) {
                    matchedHref = $1(el).attr('href');
                    matchedName = jrnlname;
                    return false; // break
                }
            });
            
            if (!matchedHref) {
                const firstA = $1('.search_results > a').first();
                if (firstA.length > 0) {
                    matchedHref = firstA.attr('href');
                    matchedName = firstA.find('.jrnlname').text().trim();
                }
            }
            
            if (!matchedHref) {
                if (browser) await browser.close();
                return res.status(404).json({ error: 'Journal not found' });
            }
            
            const sourceIdMatch = matchedHref.match(/q=(\d+)/);
            if (sourceIdMatch) {
                sourceId = sourceIdMatch[1];
            }
            
            // 2. Fetch the journal page to get categories
            const journalUrl = `https://www.scimagojr.com/${matchedHref}`;
            await p.goto(journalUrl, { waitUntil: 'domcontentloaded' });
            
            try {
                await p.waitForSelector('ul.treecategory', { timeout: 15000 });
            } catch (e) {
                console.log('Timeout waiting for ul.treecategory');
            }
            
            const html2 = await p.content();
            const $2 = cheerio.load(html2);
            
            $2('ul.treecategory a').each((i, el) => {
                const href = $2(el).attr('href');
                const name = $2(el).text().trim();
                if (href && href.includes('category=')) {
                    const catMatch = href.match(/category=(\d+)/);
                    if (catMatch) {
                        categories.push({ id: catMatch[1], name: name });
                    }
                }
            });
            
            if (categories.length > 0) {
                await fsPromises.writeFile(journalInfoFile, JSON.stringify({
                    matchedName, sourceId, categories
                }), 'utf8');
            }
        }
        
        if (categories.length === 0) {
            if (browser) await browser.close();
            return res.json({
                journalName: matchedName,
                sourceId: sourceId,
                categories: []
            });
        }
        
        // 3. For each category, get CSV (from cache, or download using page.evaluate)
        const categoryResults = [];
        let journalDetails = null;

        for (const cat of categories) {
            const csvUrl = `https://www.scimagojr.com/journalrank.php?category=${cat.id}&type=j&year=${year}&out=xls`;
            const cacheFilePath = path.join(cacheDir, `cat_${cat.id}_year_${year}.csv`);
            
            try {
                let csvData;
                if (fs.existsSync(cacheFilePath)) {
                    console.log(`Using cached CSV for category ${cat.id} year ${year}`);
                    csvData = await fsPromises.readFile(cacheFilePath, 'utf8');
                } else {
                    console.log(`Fetching CSV for category ${cat.id} year ${year}`);
                    const p = await getPage();
                    // Fetch CSV content using the browser context
                    csvData = await p.evaluate(async (url) => {
                        const response = await fetch(url);
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        return await response.text();
                    }, csvUrl);
                    
                    await fsPromises.writeFile(cacheFilePath, csvData, 'utf8');
                }
                
                const records = await parseCsv(csvData);
                
                const total = records.length;
                let rank = null;
                
                const journalRow = records.find(r => r.Sourceid === sourceId || r.Title.toLowerCase() === matchedName.toLowerCase());
                
                if (journalRow) {
                    rank = parseInt(journalRow.Rank, 10);
                    
                    if (!journalDetails) {
                        journalDetails = {
                            publisher: journalRow['Publisher'] || 'N/A',
                            country: journalRow['Country'] || 'N/A',
                            sjr: journalRow['SJR'] || 'N/A',
                            quartile: journalRow['SJR Quartile'] || 'N/A',
                            hIndex: journalRow['H index'] || 'N/A'
                        };
                    }
                }
                
                const percentage = rank ? (rank / total) : null;
                
                categoryResults.push({
                    categoryId: cat.id,
                    categoryName: cat.name,
                    rank: rank,
                    total: total,
                    percentage: percentage,
                    csvUrl: csvUrl
                });
            } catch (error) {
                console.error(`Error processing category ${cat.id} CSV:`, error.message);
                categoryResults.push({
                    categoryId: cat.id,
                    categoryName: cat.name,
                    error: 'Failed to retrieve or parse ranking data'
                });
            }
        }
        
        if (browser) await browser.close();
        
        res.json({
            journalName: matchedName,
            sourceId: sourceId,
            year: year,
            details: journalDetails,
            categories: categoryResults
        });
        
    } catch (error) {
        if (browser) await browser.close();
        console.error('Search API Error:', error);
        res.status(500).json({ error: error.message || 'An internal server error occurred while fetching data.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
