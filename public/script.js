document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('search-form');
    const input = document.getElementById('journal-input');
    const yearSelect = document.getElementById('year-select');
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    const resultsContainer = document.getElementById('results-container');
    const journalTitle = document.getElementById('journal-title');
    const journalYear = document.getElementById('journal-year');
    const journalDetails = document.getElementById('journal-details');
    const categoriesGrid = document.getElementById('categories-grid');
    
    // Bulk Search UI elements
    const btnSingleMode = document.getElementById('btn-single-mode');
    const btnBulkMode = document.getElementById('btn-bulk-mode');
    const bulkInput = document.getElementById('bulk-input');
    const bulkResultsContainer = document.getElementById('bulk-results-container');
    const bulkCategoriesGrid = document.getElementById('bulk-categories-grid');
    const progressText = document.getElementById('progress-text');
    
    let isBulkMode = false;

    // Toggle Mode Logic
    btnSingleMode.addEventListener('click', () => {
        isBulkMode = false;
        btnSingleMode.classList.add('active');
        btnBulkMode.classList.remove('active');
        input.classList.remove('hidden');
        input.setAttribute('required', 'true');
        bulkInput.classList.add('hidden');
        bulkInput.removeAttribute('required');
        
        // UI cleanup
        bulkResultsContainer.classList.add('hidden');
        errorMessage.classList.add('hidden');
    });

    btnBulkMode.addEventListener('click', () => {
        isBulkMode = true;
        btnBulkMode.classList.add('active');
        btnSingleMode.classList.remove('active');
        bulkInput.classList.remove('hidden');
        bulkInput.setAttribute('required', 'true');
        input.classList.add('hidden');
        input.removeAttribute('required');
        
        // UI cleanup
        resultsContainer.classList.add('hidden');
        errorMessage.classList.add('hidden');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const year = yearSelect.value;
        if (isBulkMode) {
            await handleBulkSearch(year);
        } else {
            const query = input.value.trim();
            await handleSingleSearch(query, year);
        }
    });

    async function handleSingleSearch(query, year) {
        if (!query) return;

        // Reset UI
        errorMessage.classList.add('hidden');
        bulkResultsContainer.classList.add('hidden');
        resultsContainer.classList.add('hidden');
        loading.classList.remove('hidden');
        progressText.classList.add('hidden');
        categoriesGrid.innerHTML = '';

        try {
            // Encode the query and send to our backend
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&year=${year}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch journal data');
            }

            if (!data.categories || data.categories.length === 0) {
                throw new Error('No categories found for this journal.');
            }

            // Update UI with results
            journalTitle.textContent = data.journalName;
            journalYear.textContent = data.year;

            // Render details
            if (data.details) {
                journalDetails.innerHTML = `
                    <div class="detail-item">
                        <span class="label">Publisher</span>
                        <span class="value">${data.details.publisher}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Country</span>
                        <span class="value">${data.details.country}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">SJR</span>
                        <span class="value">${data.details.sjr}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Quartile</span>
                        <span class="value">${data.details.quartile}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">H-Index</span>
                        <span class="value">${data.details.hIndex}</span>
                    </div>
                `;
                journalDetails.classList.remove('hidden');
            } else {
                journalDetails.classList.add('hidden');
            }

            // Render cards
            // Sort categories by percentage (lowest to highest). Put nulls/errors at the end.
            data.categories.sort((a, b) => {
                if (a.percentage === null || a.error) return 1;
                if (b.percentage === null || b.error) return -1;
                return a.percentage - b.percentage;
            });

            data.categories.forEach((cat, index) => {
                const card = document.createElement('div');
                card.className = 'card';
                if (index === 0 && cat.percentage !== null && !cat.error) {
                    card.classList.add('highlight');
                }

                if (cat.error) {
                    card.innerHTML = `
                        <h3>${cat.categoryName}</h3>
                        <div style="color: #fca5a5; font-size: 0.9rem;">Error: ${cat.error}</div>
                    `;
                } else if (cat.rank === null) {
                    card.innerHTML = `
                        <h3>${cat.categoryName}</h3>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">No ranking data found for this journal in this category. Total journals: ${cat.total}</div>
                    `;
                } else {
                    const percentageFormatted = (cat.percentage * 100).toFixed(2) + '%';
                    card.innerHTML = `
                        <h3>${cat.categoryName}</h3>
                        <div class="stats">
                            <div class="stat-box">
                                <span class="stat-label">Rank</span>
                                <div class="stat-value">${cat.rank} <span>/ ${cat.total}</span></div>
                            </div>
                            <div class="percentile">${percentageFormatted}</div>
                        </div>
                    `;
                }

                categoriesGrid.appendChild(card);
            });

            loading.classList.add('hidden');
            resultsContainer.classList.remove('hidden');

        } catch (error) {
            loading.classList.add('hidden');
            errorMessage.textContent = error.message;
            errorMessage.classList.remove('hidden');
        }
    }

    async function handleBulkSearch(year) {
        const rawInput = bulkInput.value;
        if (!rawInput.trim()) return;

        // Parse input by commas, semicolons, and newlines
        const journalList = rawInput.split(/[,\n;]+/)
            .map(j => j.trim())
            .filter(j => j.length > 0);

        if (journalList.length === 0) return;

        // Reset UI
        errorMessage.classList.add('hidden');
        resultsContainer.classList.add('hidden');
        bulkResultsContainer.classList.add('hidden');
        loading.classList.remove('hidden');
        progressText.classList.remove('hidden');
        bulkCategoriesGrid.innerHTML = '';
        
        let completed = 0;
        
        // Show container early so they see items pop in
        bulkResultsContainer.classList.remove('hidden');

        for (const journalName of journalList) {
            completed++;
            progressText.textContent = `Processing ${completed} of ${journalList.length}: ${journalName}...`;

            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(journalName)}&year=${year}`);
                const data = await response.json();

                if (!response.ok) {
                    renderBulkError(journalName, data.error || 'Failed to fetch journal data');
                    continue;
                }

                if (!data.categories || data.categories.length === 0) {
                    renderBulkError(journalName, 'No categories found');
                    continue;
                }

                // Find the best category
                data.categories.sort((a, b) => {
                    if (a.percentage === null || a.error) return 1;
                    if (b.percentage === null || b.error) return -1;
                    return a.percentage - b.percentage;
                });

                const bestCat = data.categories[0];
                renderBulkSuccess(data.journalName, bestCat);

            } catch (error) {
                renderBulkError(journalName, error.message);
            }
        }

        loading.classList.add('hidden');
        progressText.classList.add('hidden');
    }

    function renderBulkSuccess(journalName, bestCat) {
        const card = document.createElement('div');
        card.className = 'bulk-card';
        
        if (bestCat.error || bestCat.percentage === null) {
            card.innerHTML = `
                <h3>${journalName}</h3>
                <div class="category-name" style="color: #fca5a5;">No valid ranking data available</div>
            `;
        } else {
            const percentageFormatted = (bestCat.percentage * 100).toFixed(2) + '%';
            card.innerHTML = `
                <h3 title="${journalName}">${journalName}</h3>
                <div class="category-name" title="${bestCat.categoryName}">${bestCat.categoryName}</div>
                <div class="bulk-stats">
                    <div class="stat-box">
                        <span class="stat-label">Best Rank</span>
                        <div class="stat-value" style="font-size: 1.25rem;">${bestCat.rank} <span>/ ${bestCat.total}</span></div>
                    </div>
                    <div class="percentile" style="font-size: 1.5rem;">${percentageFormatted}</div>
                </div>
            `;
        }
        
        bulkCategoriesGrid.appendChild(card);
    }

    function renderBulkError(journalName, errorMsg) {
        const card = document.createElement('div');
        card.className = 'bulk-card';
        card.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        card.style.background = 'rgba(239, 68, 68, 0.05)';
        
        card.innerHTML = `
            <h3>${journalName}</h3>
            <div class="category-name" style="color: #fca5a5;">Error: ${errorMsg}</div>
        `;
        
        bulkCategoriesGrid.appendChild(card);
    }
});
