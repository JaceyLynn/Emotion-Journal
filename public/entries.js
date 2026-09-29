class EntriesPage {
    constructor() {
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadRecentEntries();
    }

    bindEvents() {
        document.getElementById('back-btn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        
        document.getElementById('chart-btn').addEventListener('click', () => {
            window.location.href = 'mood-chart.html';
        });
    }

    async loadRecentEntries() {
        try {
            const response = await fetch('/api/entries');
            const entries = await response.json();
            this.displayEntries(entries);
        } catch (error) {
            console.error('Error loading entries:', error);
            document.getElementById('entries-list').innerHTML = '<p>Error loading entries</p>';
        }
    }

    displayEntries(entries) {
        const entriesList = document.getElementById('entries-list');
        
        if (entries.length === 0) {
            entriesList.innerHTML = '<p>No journal entries yet. Start writing to see your history here!</p>';
            return;
        }

        entriesList.innerHTML = entries.map(entry => `
            <div class="entry-item">
                <div class="entry-meta">
                    <span>${new Date(entry.timestamp).toLocaleDateString()}</span>
                    <span>${entry.inputTime}</span>
                </div>
                <div class="entry-text">${entry.userInput}</div>
                <div class="entry-emotion">
                    <span>${entry.userCustomDesign?.userEmoji || '😐'}</span>
                    <span>${entry.sentimentAnalysis?.emotionalCategory || 'neutral'}</span>
                    <span class="sentiment-score">Score: ${entry.sentimentAnalysis?.sentimentScore || 50}</span>
                    <span class="entry-color" style="background-color: ${entry.userCustomDesign?.userColor || '#ccc'}; width: 16px; height: 16px; border-radius: 50%; display: inline-block; margin-left: 8px;"></span>
                </div>
                <div class="entry-source">
                    <small>${entry.sourceEvent?.category || 'general'} - ${entry.sourceEvent?.description || 'No description'}</small>
                </div>
            </div>
        `).join('');
    }
}

// Initialize the entries page when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    new EntriesPage();
});