const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const rawData = `
0	All subject categories
1402	Accounting
3102	Acoustics and Ultrasonics
2902	Advanced and Specialized Nursing
2202	Aerospace Engineering
1302	Aging
1101	Agricultural and Biological Sciences (miscellaneous)
1102	Agronomy and Crop Science
2602	Algebra and Number Theory
2603	Analysis
1602	Analytical Chemistry
2702	Anatomy
2703	Anesthesiology and Pain Medicine
1103	Animal Science and Zoology
3314	Anthropology
2604	Applied Mathematics
2402	Applied Microbiology and Biotechnology
3202	Applied Psychology
1104	Aquatic Science
3302	Archeology
1204	Archeology (arts and humanities)
2216	Architecture
1702	Artificial Intelligence
1201	Arts and Humanities (miscellaneous)
2903	Assessment and Diagnosis
3103	Astronomy and Astrophysics
1902	Atmospheric Science
3107	Atomic and Molecular Physics, and Optics
2203	Automotive Engineering
2802	Behavioral Neuroscience
1303	Biochemistry
1301	Biochemistry, Genetics and Molecular Biology (miscellaneous)
2704	Biochemistry (medical)
1502	Bioengineering
2803	Biological Psychiatry
2502	Biomaterials
2204	Biomedical Engineering
1304	Biophysics
1305	Biotechnology
2215	Building and Construction
1403	Business and International Management
1401	Business, Management and Accounting (miscellaneous)
1306	Cancer Research
2705	Cardiology and Cardiovascular Medicine
2904	Care Planning
1503	Catalysis
1307	Cell Biology
2804	Cellular and Molecular Neuroscience
2503	Ceramics and Composites
1501	Chemical Engineering (miscellaneous)
1504	Chemical Health and Safety
1601	Chemistry (miscellaneous)
3602	Chiropractics
2205	Civil and Structural Engineering
1205	Classics
1308	Clinical Biochemistry
3203	Clinical Psychology
2805	Cognitive Neuroscience
1505	Colloid and Surface Chemistry
3315	Communication
2905	Community and Home Care
2707	Complementary and Alternative Medicine
3603	Complementary and Manual Therapy
2605	Computational Mathematics
2206	Computational Mechanics
1703	Computational Theory and Mathematics
1704	Computer Graphics and Computer-Aided Design
1705	Computer Networks and Communications
1706	Computer Science Applications
1701	Computer Science (miscellaneous)
1707	Computer Vision and Pattern Recognition
1903	Computers in Earth Sciences
3104	Condensed Matter Physics
1206	Conservation
2606	Control and Optimization
2207	Control and Systems Engineering
2706	Critical Care and Intensive Care Medicine
2906	Critical Care Nursing
3316	Cultural Studies
1801	Decision Sciences (miscellaneous)
3317	Demography
3502	Dental Assisting
3503	Dental Hygiene
3501	Dentistry (miscellaneous)
2708	Dermatology
3303	Development
3204	Developmental and Educational Psychology
1309	Developmental Biology
2806	Developmental Neuroscience
2607	Discrete Mathematics and Combinatorics
3002	Drug Discovery
2709	Drug Guides
1901	Earth and Planetary Sciences (miscellaneous)
1904	Earth-Surface Processes
2302	Ecological Modeling
2303	Ecology
1105	Ecology, Evolution, Behavior and Systematics
1905	Economic Geology
2002	Economics and Econometrics
2001	Economics, Econometrics and Finance (miscellaneous)
3304	Education
3399	E-learning
2208	Electrical and Electronic Engineering
1603	Electrochemistry
2504	Electronic, Optical and Magnetic Materials
2710	Embryology
3604	Emergency Medical Services
2711	Emergency Medicine
2907	Emergency Nursing
2807	Endocrine and Autonomic Systems
1310	Endocrinology
2712	Endocrinology, Diabetes and Metabolism
2102	Energy Engineering and Power Technology
2101	Energy (miscellaneous)
2201	Engineering (miscellaneous)
2304	Environmental Chemistry
2305	Environmental Engineering
2301	Environmental Science (miscellaneous)
2713	Epidemiology
3402	Equine
3205	Experimental and Cognitive Psychology
2714	Family Practice
1506	Filtration and Separation
2003	Finance
1507	Fluid Flow and Transfer Processes
3403	Food Animals
1106	Food Science
1107	Forestry
2103	Fuel Technology
2908	Fundamentals and Skills
2715	Gastroenterology
3318	Gender Studies
1311	Genetics
2716	Genetics (clinical)
1906	Geochemistry and Petrology
3305	Geography, Planning and Development
1907	Geology
2608	Geometry and Topology
1908	Geophysics
1909	Geotechnical Engineering and Engineering Geology
2717	Geriatrics and Gerontology
2909	Gerontology
2306	Global and Planetary Change
1708	Hardware and Architecture
2718	Health Informatics
3605	Health Information Management
2719	Health Policy
3601	Health Professions (miscellaneous)
3306	Health (social science)
2307	Health, Toxicology and Mutagenesis
2720	Hematology
2721	Hepatology
2722	Histology
1202	History
1207	History and Philosophy of Science
1108	Horticulture
3307	Human Factors and Ergonomics
1709	Human-Computer Interaction
2403	Immunology
2723	Immunology and Allergy
2401	Immunology and Microbiology (miscellaneous)
2209	Industrial and Manufacturing Engineering
1410	Industrial Relations
2725	Infectious Diseases
1710	Information Systems
1802	Information Systems and Management
1604	Inorganic Chemistry
1109	Insect Science
3105	Instrumentation
2724	Internal Medicine
2910	Issues, Ethics and Legal Aspects
3308	Law
2911	Leadership and Management
3309	Library and Information Sciences
3319	Life-span and Life-course Studies
3310	Linguistics and Language
1208	Literature and Literary Theory
2609	Logic
2912	LPN and LVN
1404	Management Information Systems
2308	Management, Monitoring, Policy and Law
1405	Management of Technology and Innovation
1803	Management Science and Operations Research
1406	Marketing
2505	Materials Chemistry
2501	Materials Science (miscellaneous)
2913	Maternity and Midwifery
2610	Mathematical Physics
2601	Mathematics (miscellaneous)
2210	Mechanical Engineering
2211	Mechanics of Materials
2214	Media Technology
2914	Medical and Surgical Nursing
3606	Medical Assisting and Transcription
3607	Medical Laboratory Technology
3608	Medical Terminology
2701	Medicine (miscellaneous)
2506	Metals and Alloys
2404	Microbiology
2726	Microbiology (medical)
2611	Modeling and Simulation
1312	Molecular Biology
1313	Molecular Medicine
1000	Multidisciplinary
1209	Museology
1210	Music
2509	Nanoscience and Nanotechnology
2309	Nature and Landscape Conservation
2727	Nephrology
2808	Neurology
2728	Neurology (clinical)
3206	Neuropsychology and Physiological Psychology
2801	Neuroscience (miscellaneous)
3106	Nuclear and High Energy Physics
2104	Nuclear Energy and Engineering
2612	Numerical Analysis
2915	Nurse Assisting
2901	Nursing (miscellaneous)
2916	Nutrition and Dietetics
2729	Obstetrics and Gynecology
3609	Occupational Therapy
2212	Ocean Engineering
1910	Oceanography
2730	Oncology
2917	Oncology (nursing)
2731	Ophthalmology
3610	Optometry
3504	Oral Surgery
1605	Organic Chemistry
1407	Organizational Behavior and Human Resource Management
3505	Orthodontics
2732	Orthopedics and Sports Medicine
2733	Otorhinolaryngology
1911	Paleontology
2405	Parasitology
2734	Pathology and Forensic Medicine
2918	Pathophysiology
2919	Pediatrics
2735	Pediatrics, Perinatology and Child Health
3506	Periodontics
3003	Pharmaceutical Science
3004	Pharmacology
2736	Pharmacology (medical)
2920	Pharmacology (nursing)
3001	Pharmacology, Toxicology and Pharmaceutics (miscellaneous)
3611	Pharmacy
1211	Philosophy
1606	Physical and Theoretical Chemistry
3612	Physical Therapy, Sports Therapy and Rehabilitation
3101	Physics and Astronomy (miscellaneous)
1314	Physiology
2737	Physiology (medical)
1110	Plant Science
3613	Podiatry
3320	Political Science and International Relations
2310	Pollution
2507	Polymers and Plastics
1508	Process Chemistry and Technology
2738	Psychiatry and Mental Health
3201	Psychology (miscellaneous)
3321	Public Administration
2739	Public Health, Environmental and Occupational Health
2740	Pulmonary and Respiratory Medicine
3108	Radiation
3614	Radiological and Ultrasound Technology
2741	Radiology, Nuclear Medicine and Imaging
2742	Rehabilitation
1212	Religious Studies
2105	Renewable Energy, Sustainability and the Environment
2743	Reproductive Medicine
2922	Research and Theory
3615	Respiratory Care
2923	Review and Exam Preparation
2744	Reviews and References (medical)
2745	Rheumatology
3311	Safety Research
2213	Safety, Risk, Reliability and Quality
2809	Sensory Systems
1711	Signal Processing
3404	Small Animals
3207	Social Psychology
3301	Social Sciences (miscellaneous)
3323	Social Work
3312	Sociology and Political Science
1712	Software
1111	Soil Science
1912	Space and Planetary Science
1607	Spectroscopy
3616	Speech and Hearing
3699	Sports Science
3109	Statistical and Nonlinear Physics
2613	Statistics and Probability
1804	Statistics, Probability and Uncertainty
1408	Strategy and Management
1913	Stratigraphy
1315	Structural Biology
3110	Surfaces and Interfaces
2508	Surfaces, Coatings and Films
2746	Surgery
2614	Theoretical Computer Science
1409	Tourism, Leisure and Hospitality Management
3005	Toxicology
2747	Transplantation
3313	Transportation
3322	Urban Studies
2748	Urology
3401	Veterinary (miscellaneous)
2406	Virology
1213	Visual Arts and Performing Arts
2311	Waste Management and Disposal
2312	Water Science and Technology
`;

const ids = rawData.trim().split('\n').map(line => {
    const match = line.match(/^(\d+)/);
    return match ? match[1] : null;
}).filter(Boolean);

console.log(`Found ${ids.length} categories to download.`);

(async () => {
    const cacheDir = path.join(__dirname, '..', 'csv_ranking_files');
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }

    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    console.log('Navigating to scimagojr.com to clear Cloudflare...');
    await page.goto('https://www.scimagojr.com', { waitUntil: 'domcontentloaded' });
    try {
        await page.waitForSelector('.searchinput', { timeout: 10000 });
    } catch (e) {}

    let downloadedCount = 0;
    let skippedCount = 0;
    
    for (const id of ids) {
        const year = 2022;
        const csvUrl = `https://www.scimagojr.com/journalrank.php?category=${id}&type=j&year=${year}&out=xls`;
        const cacheFilePath = path.join(cacheDir, `cat_${id}_year_${year}.csv`);
        
        if (fs.existsSync(cacheFilePath)) {
            skippedCount++;
            continue; // Already downloaded
        }
        
        console.log(`Downloading category ${id}...`);
        try {
            const csvData = await page.evaluate(async (url) => {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return await response.text();
            }, csvUrl);
            
            await fsPromises.writeFile(cacheFilePath, csvData, 'utf8');
            downloadedCount++;
            
            // Wait 200ms between requests to avoid rate limits
            await new Promise(r => setTimeout(r, 200));
        } catch (error) {
            console.error(`Failed to download category ${id}: ${error.message}`);
        }
    }
    
    await browser.close();
    console.log(`Finished! Downloaded ${downloadedCount}, Skipped ${skippedCount}.`);
})();
