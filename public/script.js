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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = input.value.trim();
        const year = yearSelect.value;
        if (!query) return;

        // Reset UI
        errorMessage.classList.add('hidden');
        resultsContainer.classList.add('hidden');
        loading.classList.remove('hidden');
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
    });
});
