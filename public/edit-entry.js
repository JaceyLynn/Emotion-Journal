class EditEntryApp {
    constructor() {
        console.log('=== EDIT ENTRY APP INITIALIZED ===');
        this.entryId = null;
        this.currentEntry = null;
        this.emotionCategories = [];
        
        this.init();
    }

    async init() {
        console.log('=== INIT CALLED ===');
        // Get entry ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.entryId = urlParams.get('id');
        
        console.log('URL:', window.location.href);
        console.log('Search params:', window.location.search);
        console.log('Entry ID from URL:', this.entryId);
        
        if (!this.entryId) {
            console.error('No entry ID in URL');
            alert('No entry ID provided');
            window.location.href = 'visualization.html';
            return;
        }

        await this.loadConfig();
        await this.loadEntry();
        this.bindEvents();
    }

    async loadConfig() {
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            this.emotionCategories = config.emotionCategories;
            this.populateEmotionDropdown();
        } catch (error) {
            console.error('Error loading config:', error);
        }
    }

    populateEmotionDropdown() {
        const select = document.getElementById('updated-mood');
        this.emotionCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            select.appendChild(option);
        });
    }

    async loadEntry() {
        try {
            console.log('Fetching entry with ID:', this.entryId);
            const url = `/api/entry/${this.entryId}`;
            console.log('Fetch URL:', url);
            
            const response = await fetch(url);
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Entry not found (status: ${response.status})`);
            }

            this.currentEntry = await response.json();
            console.log('Loaded entry:', this.currentEntry);
            this.displayEntry();
        } catch (error) {
            console.error('Error loading entry:', error);
            alert(`Failed to load entry: ${error.message}`);
            window.location.href = 'visualization.html';
        }
    }

    displayEntry() {
        const entry = this.currentEntry;
        console.log('Displaying entry:', entry);

        // Display time (use inputTime if available, otherwise format timestamp)
        const timeDisplay = entry.inputTime || new Date(entry.timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        console.log('Time:', timeDisplay);
        document.getElementById('entry-time').textContent = timeDisplay;

        // Display event description
        const eventDesc = entry.sourceEvent?.description || 'No event description';
        console.log('Event:', eventDesc);
        document.getElementById('event-description').textContent = eventDesc;

        // Display user input
        const userInput = entry.userInput || 'No entry text';
        console.log('User input:', userInput);
        document.getElementById('feeling-input').textContent = userInput;

        // Display emotion
        const emotion = entry.sentimentAnalysis?.emotionalCategory || 'unknown';
        console.log('Emotion:', emotion);
        document.getElementById('emotion-category').textContent = emotion;

        // Load existing reflection if available
        if (entry.addedReflection) {
            console.log('Existing reflection:', entry.addedReflection);
            document.getElementById('updated-mood').value = entry.addedReflection.updatedMood || '';
            document.getElementById('reflection-input').value = entry.addedReflection.addedInput || '';
        }
    }

    bindEvents() {
        // Back arrow button
        const backArrow = document.getElementById('back-arrow');
        if (backArrow) {
            backArrow.addEventListener('click', () => {
                window.location.href = 'visualization.html';
            });
        }

        document.getElementById('delete-btn').addEventListener('click', () => {
            this.showDeleteConfirmation();
        });

        document.getElementById('confirm-delete-btn').addEventListener('click', () => {
            this.deleteEntry();
        });

        document.getElementById('cancel-delete-btn').addEventListener('click', () => {
            document.getElementById('delete-confirmation').classList.add('hidden');
        });

        // Save reflection button
        const saveReflectionBtn = document.getElementById('save-reflection-btn');
        if (saveReflectionBtn) {
            saveReflectionBtn.addEventListener('click', async () => {
                console.log('Save reflection clicked');
                const updatedMood = document.getElementById('updated-mood').value;
                const reflectionInput = document.getElementById('reflection-input').value.trim();

                // Validate inputs
                if (!updatedMood) {
                    alert('Please select your current feeling');
                    return;
                }
                if (!reflectionInput) {
                    alert('Please add your reflection');
                    return;
                }

                try {
                    const reflectionData = {
                        addedReflection: {
                            updatedMood: updatedMood,
                            addedInput: reflectionInput,
                            editTime: new Date().toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                            })
                        }
                    };

                    console.log('Saving reflection:', reflectionData);

                    const response = await fetch(`/api/entry/${this.entryId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(reflectionData)
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const result = await response.json();
                    console.log('Reflection saved successfully:', result);
                    alert('Reflection saved successfully');
                    
                    // Reload the entry to show the saved reflection
                    await this.loadEntry();
                } catch (error) {
                    console.error('Error saving reflection:', error);
                    alert('Failed to save reflection. Please try again.');
                }
            });
        }
    }

    showDeleteConfirmation() {
        document.getElementById('delete-confirmation').classList.remove('hidden');
    }

    async deleteEntry() {
        try {
            const response = await fetch(`/api/entry/${this.entryId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete entry');
            }

            window.location.href = 'visualization.html';
        } catch (error) {
            console.error('Error deleting entry:', error);
            alert('Failed to delete entry');
            document.getElementById('delete-confirmation').classList.add('hidden');
        }
    }
}

// Initialize the app
new EditEntryApp();
