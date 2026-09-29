class EmotionalJournalApp {
    constructor() {
        this.currentAnalysis = null;
        this.selectedEmoji = null;
        this.selectedColor = null;
        this.availableEmojis = [];
        this.availableColors = [];
        this.sourceEventCategories = [];
        this.moodMeterPosition = null; // Store mood meter position {x, y}
        
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadConfig();
        this.setDefaultEventTime();
        this.populateColorWheel(); // Initialize color wheel
        this.initDateTime(); // Initialize date and time display
        this.initMoodMeter(); // Initialize mood meter
    }

    initDateTime() {
        this.updateDateTime();
        // Update time every minute
        setInterval(() => this.updateDateTime(), 60000);
    }

    updateDateTime() {
        const now = new Date();
        
        // Format date: "Nov 15, Monday"
        const dateOptions = { 
            month: 'short', 
            day: 'numeric', 
            weekday: 'long' 
        };
        const dateStr = now.toLocaleDateString('en-US', dateOptions);
        const formattedDate = dateStr.replace(/(\w+) (\d+), (\w+)/, '$1 $2, $3');
        
        // Format time: "1:10pm"
        const timeStr = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        }).toLowerCase();
        
        document.getElementById('current-date').textContent = formattedDate;
        document.getElementById('current-time').textContent = timeStr;
    }

    initMoodMeter() {
        const canvas = document.getElementById('mood-meter');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Draw mood meter grid
        this.drawMoodMeter(ctx, width, height);
        
        // Add click event
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Convert to percentage (0-100)
            const pleasureLevel = Math.round((x / width) * 100);
            const energyLevel = Math.round(100 - (y / height) * 100); // Invert Y axis
            
            this.moodMeterPosition = { x: pleasureLevel, y: energyLevel };
            
            // Redraw with dot
            this.drawMoodMeter(ctx, width, height, x, y);
            
            // Update display
            this.updateMoodMeterInfo(pleasureLevel, energyLevel);
        });
    }
    
    drawMoodMeter(ctx, width, height, dotX = null, dotY = null) {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Create a more detailed color gradient based on the mood meter quadrants
        // We'll use a radial approach from each corner for smooth transitions
        
        // RED QUADRANT (High Energy, Low Pleasure) - Top Left
        const redGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.7);
        redGradient.addColorStop(0, 'rgba(230, 40, 40, 0.4)');  // Enraged (deep red)
        redGradient.addColorStop(0.5, 'rgba(255, 87, 51, 0.3)'); // Stressed (red-orange)
        redGradient.addColorStop(1, 'rgba(255, 120, 80, 0.1)');  // Annoyed (light red)
        ctx.fillStyle = redGradient;
        ctx.fillRect(0, 0, width/2, height/2);
        
        // YELLOW QUADRANT (High Energy, High Pleasure) - Top Right
        const yellowGradient = ctx.createRadialGradient(width, 0, 0, width, 0, width * 0.7);
        yellowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');   // Ecstatic (bright yellow)
        yellowGradient.addColorStop(0.5, 'rgba(255, 223, 50, 0.3)'); // Lively (yellow)
        yellowGradient.addColorStop(1, 'rgba(255, 235, 100, 0.1)');  // Pleasant (light yellow)
        ctx.fillStyle = yellowGradient;
        ctx.fillRect(width/2, 0, width/2, height/2);
        
        // GREEN QUADRANT (Low Energy, High Pleasure) - Bottom Right
        const greenGradient = ctx.createRadialGradient(width, height, 0, width, height, width * 0.7);
        greenGradient.addColorStop(0, 'rgba(50, 180, 150, 0.4)');   // Serene (teal green)
        greenGradient.addColorStop(0.5, 'rgba(113, 201, 206, 0.3)'); // Calm (aqua)
        greenGradient.addColorStop(1, 'rgba(150, 220, 200, 0.1)');   // Content (light green)
        ctx.fillStyle = greenGradient;
        ctx.fillRect(width/2, height/2, width/2, height/2);
        
        // BLUE QUADRANT (Low Energy, Low Pleasure) - Bottom Left
        const blueGradient = ctx.createRadialGradient(0, height, 0, 0, height, width * 0.7);
        blueGradient.addColorStop(0, 'rgba(40, 60, 130, 0.4)');    // Miserable (deep blue)
        blueGradient.addColorStop(0.5, 'rgba(92, 124, 195, 0.3)'); // Glum (blue)
        blueGradient.addColorStop(1, 'rgba(130, 160, 210, 0.1)');  // Bored (light blue)
        ctx.fillStyle = blueGradient;
        ctx.fillRect(0, height/2, width/2, height/2);
        
        // Draw grid lines for detailed zones
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 0.5;
        
        // Draw a grid to show the detailed zones (10% increments)
        for (let i = 1; i < 10; i++) {
            // Vertical lines (pleasure)
            ctx.beginPath();
            ctx.moveTo(width * i / 10, 0);
            ctx.lineTo(width * i / 10, height);
            ctx.stroke();
            
            // Horizontal lines (energy)
            ctx.beginPath();
            ctx.moveTo(0, height * i / 10);
            ctx.lineTo(width, height * i / 10);
            ctx.stroke();
        }
        
        // Center lines (axes) - make them more prominent
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(width/2, 0);
        ctx.lineTo(width/2, height);
        ctx.moveTo(0, height/2);
        ctx.lineTo(width, height/2);
        ctx.stroke();
        
        // Draw axis labels on canvas
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        
        // X-axis labels
        ctx.fillText('Low', 30, height - 5);
        ctx.fillText('High', width - 30, height - 5);
        
        // Y-axis labels - Low at bottom, High at top
        ctx.save();
        ctx.translate(10, height - 20);
        ctx.rotate(-Math.PI/2);
        ctx.fillText('Low', 0, 0);
        ctx.restore();
        
        ctx.save();
        ctx.translate(10, 20);
        ctx.rotate(-Math.PI/2);
        ctx.fillText('High', 0, 0);
        ctx.restore();
        
        // Draw dot if position is set
        if (dotX !== null && dotY !== null) {
            ctx.beginPath();
            ctx.arc(dotX, dotY, 8, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(41, 189, 103, 1)';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }
    
    getMoodZone(pleasure, energy) {
        // RED QUADRANT (High Energy, Low Pleasantness) - Top Left
        if (energy >= 95 && energy <= 100 && pleasure >= 0 && pleasure <= 5) return 'Enraged';
        if (energy >= 90 && energy <= 95 && pleasure >= 5 && pleasure <= 10) return 'Furious';
        if (energy >= 90 && energy <= 95 && pleasure >= 5 && pleasure <= 10) return 'Panicked';
        if (energy >= 80 && energy <= 90 && pleasure >= 10 && pleasure <= 20) return 'Stressed';
        if (energy >= 80 && energy <= 90 && pleasure >= 15 && pleasure <= 25) return 'Jittery';
        if (energy >= 75 && energy <= 85 && pleasure >= 15 && pleasure <= 25) return 'Angry';
        if (energy >= 70 && energy <= 80 && pleasure >= 20 && pleasure <= 30) return 'Anxious';
        if (energy >= 65 && energy <= 75 && pleasure >= 25 && pleasure <= 35) return 'Nervous';
        if (energy >= 60 && energy <= 70 && pleasure >= 25 && pleasure <= 35) return 'Irritated';
        if (energy >= 55 && energy <= 65 && pleasure >= 30 && pleasure <= 40) return 'Annoyed';
        
        // BLUE QUADRANT (Low Energy, Low Pleasantness) - Bottom Left
        if (energy >= 0 && energy <= 10 && pleasure >= 0 && pleasure <= 10) return 'Despairing';
        if (energy >= 5 && energy <= 15 && pleasure >= 5 && pleasure <= 15) return 'Hopeless';
        if (energy >= 10 && energy <= 20 && pleasure >= 10 && pleasure <= 20) return 'Depressed';
        if (energy >= 10 && energy <= 20 && pleasure >= 10 && pleasure <= 20) return 'Desolate';
        if (energy >= 15 && energy <= 25 && pleasure >= 15 && pleasure <= 25) return 'Miserable';
        if (energy >= 20 && energy <= 30 && pleasure >= 20 && pleasure <= 30) return 'Sad';
        if (energy >= 25 && energy <= 35 && pleasure >= 25 && pleasure <= 35) return 'Discouraged';
        if (energy >= 25 && energy <= 35 && pleasure >= 25 && pleasure <= 35) return 'Lonely';
        if (energy >= 30 && energy <= 40 && pleasure >= 30 && pleasure <= 40) return 'Tired';
        if (energy >= 35 && energy <= 45 && pleasure >= 35 && pleasure <= 45) return 'Bored';
        
        // GREEN QUADRANT (Low Energy, High Pleasantness) - Bottom Right
        if (energy >= 5 && energy <= 15 && pleasure >= 90 && pleasure <= 100) return 'Serene';
        if (energy >= 10 && energy <= 20 && pleasure >= 85 && pleasure <= 95) return 'Tranquil';
        if (energy >= 15 && energy <= 25 && pleasure >= 80 && pleasure <= 90) return 'Peaceful';
        if (energy >= 20 && energy <= 30 && pleasure >= 75 && pleasure <= 85) return 'Comfortable';
        if (energy >= 25 && energy <= 35 && pleasure >= 70 && pleasure <= 80) return 'Calm';
        if (energy >= 20 && energy <= 35 && pleasure >= 70 && pleasure <= 85) return 'Relaxed';
        if (energy >= 30 && energy <= 40 && pleasure >= 65 && pleasure <= 75) return 'Content';
        if (energy >= 30 && energy <= 40 && pleasure >= 65 && pleasure <= 75) return 'Secure';
        if (energy >= 35 && energy <= 45 && pleasure >= 60 && pleasure <= 70) return 'Satisfied';
        if (energy >= 35 && energy <= 45 && pleasure >= 70 && pleasure <= 85) return 'Grateful';
        
        // YELLOW QUADRANT (High Energy, High Pleasantness) - Top Right
        if (energy >= 95 && energy <= 100 && pleasure >= 95 && pleasure <= 100) return 'Ecstatic';
        if (energy >= 90 && energy <= 95 && pleasure >= 90 && pleasure <= 95) return 'Elated';
        if (energy >= 85 && energy <= 95 && pleasure >= 90 && pleasure <= 100) return 'Exhilarated';
        if (energy >= 85 && energy <= 95 && pleasure >= 85 && pleasure <= 95) return 'Thrilled';
        if (energy >= 80 && energy <= 90 && pleasure >= 80 && pleasure <= 90) return 'Enthusiastic';
        if (energy >= 75 && energy <= 85 && pleasure >= 80 && pleasure <= 90) return 'Inspired';
        if (energy >= 75 && energy <= 85 && pleasure >= 75 && pleasure <= 85) return 'Excited';
        if (energy >= 70 && energy <= 80 && pleasure >= 70 && pleasure <= 80) return 'Motivated';
        if (energy >= 65 && energy <= 75 && pleasure >= 70 && pleasure <= 80) return 'Happy';
        if (energy >= 65 && energy <= 75 && pleasure >= 75 && pleasure <= 85) return 'Proud';
        
        // Fallback for areas not covered
        if (energy > 50 && pleasure > 50) return 'Pleasant';
        if (energy > 50 && pleasure <= 50) return 'Tense';
        if (energy <= 50 && pleasure > 50) return 'At Ease';
        if (energy <= 50 && pleasure <= 50) return 'Down';
        
        return 'Neutral';
    }
    
    updateMoodMeterInfo(pleasure, energy) {
        const info = document.getElementById('mood-coordinates');
        if (info) {
            const moodZone = this.getMoodZone(pleasure, energy);
            info.textContent = `Pleasure: ${pleasure}%, Energy: ${energy}% (${moodZone})`;
            
            // Set prompt based on specific mood
            this.setMoodPrompt(moodZone);
        }
    }

    setMoodPrompt(moodZone) {
        const textarea = document.getElementById('feeling-input');
        if (!textarea) return;
        
        const moodPrompts = {
            // RED QUADRANT - High Energy, Low Pleasure
            'Enraged': 'What triggered this intense anger? Let it all out here...',
            'Furious': 'What made you feel so furious right now?',
            'Panicked': 'What is making you feel panicked? Describe the situation...',
            'Stressed': 'What is stressing you out? Share what is on your mind...',
            'Jittery': 'What is making you feel on edge and restless?',
            'Angry': 'What happened that made you angry? Express your frustration...',
            'Anxious': 'What is causing your anxiety? Write about your worries...',
            'Nervous': 'What is making you feel nervous? Describe your concerns...',
            'Irritated': 'What is irritating you right now?',
            'Annoyed': 'What is annoying you? Let it out...',
            
            // BLUE QUADRANT - Low Energy, Low Pleasure
            'Despairing': 'What is making you feel this way? You are not alone...',
            'Hopeless': 'What thoughts are weighing you down? Share them here...',
            'Depressed': 'How are you feeling today? It is okay to express sadness...',
            'Desolate': 'What is making you feel isolated? Write about it...',
            'Miserable': 'What is making you feel miserable right now?',
            'Sad': 'What is making you sad? Share your feelings...',
            'Discouraged': 'What has discouraged you? Express your thoughts...',
            'Lonely': 'What is making you feel lonely? You can share here...',
            'Tired': 'What is draining your energy? Describe how you feel...',
            'Bored': 'What would make this moment more meaningful for you?',
            
            // GREEN QUADRANT - Low Energy, High Pleasure
            'Serene': 'What is bringing you this peaceful feeling?',
            'Tranquil': 'What peaceful moments are you experiencing?',
            'Peaceful': 'What is giving you peace right now? Reflect on it...',
            'Comfortable': 'What is making you feel comfortable and at ease?',
            'Calm': 'What is helping you feel calm? Describe this moment...',
            'Relaxed': 'What is allowing you to relax? Share your contentment...',
            'Content': 'What are you grateful for in this moment?',
            'Secure': 'What makes you feel safe and secure right now?',
            'Satisfied': 'What is bringing you satisfaction? Reflect on it...',
            'Grateful': 'What are you feeling grateful for today?',
            
            // YELLOW QUADRANT - High Energy, High Pleasure
            'Ecstatic': 'What made you feel so incredibly happy? Celebrate it here!',
            'Elated': 'What lifted your spirits so high? Share your joy!',
            'Exhilarated': 'What thrilling experience are you going through?',
            'Thrilled': 'What is exciting you so much right now?',
            'Enthusiastic': 'What are you passionate about at this moment?',
            'Inspired': 'What inspired you today? Capture this feeling...',
            'Excited': 'What is making you feel so energized and excited?',
            'Motivated': 'What is driving your motivation right now?',
            'Happy': 'What brought you happiness today? Share the joy...',
            'Proud': 'What are you proud of? Celebrate your achievement...',
            
            // Fallback zones
            'Pleasant': 'What is making this a pleasant moment for you?',
            'Tense': 'What is creating tension? Express what you are feeling...',
            'At Ease': 'What is bringing you comfort? Describe this feeling...',
            'Down': 'How are you feeling? It is okay to share...',
            'Neutral': 'How are you feeling right now? Share your thoughts...'
        };
        
        textarea.placeholder = moodPrompts[moodZone] || 'How are you feeling? Share your thoughts...';
    }

    async generateMoodPrompt(moodZone, pleasure, energy) {
        const textarea = document.getElementById('feeling-input');
        if (!textarea) return;
        
        console.log('\n=== CLIENT: PROMPT GENERATION START ===');
        console.log('Mood Zone:', moodZone);
        console.log('Pleasure:', pleasure, 'Energy:', energy);
        
        // Show loading state
        const originalPlaceholder = textarea.placeholder;
        textarea.placeholder = 'Generating personalized prompt...';
        
        try {
            const response = await fetch('/api/generate-prompt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    moodZone,
                    pleasure,
                    energy
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to generate prompt');
            }
            
            const data = await response.json();
            console.log('Received data from server:', data);
            
            if (data.prompt) {
                console.log('Setting placeholder to:', data.prompt);
                console.log('Prompt character length:', data.prompt.length);
                textarea.placeholder = data.prompt;
                console.log('Actual textarea placeholder value:', textarea.placeholder);
                console.log('Textarea scrollHeight:', textarea.scrollHeight);
                console.log('Textarea clientHeight:', textarea.clientHeight);
            }
            console.log('=== CLIENT: PROMPT GENERATION END ===\n');
        } catch (error) {
            console.error('Error generating prompt:', error);
            // Fallback to static prompts based on mood zone
            const fallback = this.getFallbackPrompt(moodZone);
            console.log('Using fallback prompt:', fallback);
            textarea.placeholder = fallback;
        }
    }
    
    getFallbackPrompt(moodZone) {
        const prompts = {
            'Excited/Happy': 'What made you feel energized and joyful today? Describe the exciting moments...',
            'Tense/Angry': 'What is causing you stress or frustration? Let it out here...',
            'Calm/Peaceful': 'What peaceful moments did you experience? Reflect on what brings you contentment...',
            'Sad/Down': 'What\'s weighing on your mind? It\'s okay to express how you\'re feeling...'
        };
        return prompts[moodZone] || 'Type your thoughts and feelings here...';
    }

    toggleSection(header) {
        const content = header.nextElementSibling;
        const isCollapsed = content.classList.contains('collapsed');
        
        if (isCollapsed) {
            content.classList.remove('collapsed');
            header.classList.add('expanded');
        } else {
            content.classList.add('collapsed');
            header.classList.remove('expanded');
        }
    }

    toggleMoodMeter() {
        const toggle = document.getElementById('mood-meter-toggle');
        const content = document.getElementById('mood-meter-content');
        const isCollapsed = content.classList.contains('collapsed');
        
        if (isCollapsed) {
            content.classList.remove('collapsed');
            toggle.classList.add('active');
        } else {
            content.classList.add('collapsed');
            toggle.classList.remove('active');
        }
    }

    bindEvents() {
        // Collapsible sections
        document.querySelectorAll('.section-header').forEach(header => {
            header.addEventListener('click', () => this.toggleSection(header));
        });

        // Mood meter collapsible toggle
        const moodMeterToggle = document.getElementById('mood-meter-toggle');
        if (moodMeterToggle) {
            moodMeterToggle.addEventListener('click', () => this.toggleMoodMeter());
        }

        // Feeling section
        document.getElementById('analyze-btn').addEventListener('click', () => this.analyzeEmotion());
        document.getElementById('feeling-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.analyzeEmotion();
            }
        });

        // Sentiment slider
        document.getElementById('sentiment-slider').addEventListener('input', (e) => {
            document.getElementById('sentiment-value').textContent = e.target.value;
            if (this.currentAnalysis) {
                this.currentAnalysis.sentiment = parseInt(e.target.value);
            }
        });

        // Save button
        document.getElementById('save-btn').addEventListener('click', () => this.saveEntry());

        // Navigation button
        document.getElementById('view-entries-btn').addEventListener('click', () => {
            window.location.href = 'entries.html';
        });

        // Form validation
        document.getElementById('feeling-input').addEventListener('input', () => this.validateForm());
        document.getElementById('event-category').addEventListener('change', () => this.validateForm());
        document.getElementById('event-description').addEventListener('input', () => this.validateForm());
    }

    async loadConfig() {
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            this.sourceEventCategories = config.sourceEventCategories;
            this.populateEventCategories();
        } catch (error) {
            console.error('Error loading config:', error);
        }
    }

    populateEventCategories() {
        const select = document.getElementById('event-category');
        this.sourceEventCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
    }

    setDefaultEventTime() {
        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        document.getElementById('event-time').value = localDateTime;
    }

    async analyzeEmotion() {
        const text = document.getElementById('feeling-input').value.trim();
        const analyzeBtn = document.getElementById('analyze-btn');
        
        if (!text) {
            this.showError('Please enter some text to analyze');
            return;
        }

        // Hide any previous AI response
        document.getElementById('ai-response-section').classList.add('hidden');

        // Show loading state on button only
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'Analyzing...';

        // Auto-expand the Event Source section immediately
        this.expandEventSourceSection();

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.currentAnalysis = data.analysis;
            this.availableEmojis = data.availableEmojis;
            // Store suggested color from AI
            const suggestedColor = data.suggestedColor || '#29BD67';
            
            this.displayAnalysisResult();
            this.populateEmojis();
            this.populateColorWheel(suggestedColor); // Pass suggested color
            this.expandCustomizeSection(); // Auto-expand customize section
            this.validateForm();
            
            // Generate and display caring AI response
            await this.showCaringResponse(text, data.analysis);

        } catch (error) {
            console.error('Error analyzing emotion:', error);
            this.showError('Failed to analyze emotion. Make sure LM Studio is running on port 1234.');
        } finally {
            // Reset button state
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = 'Record Emotion';
        }
    }

    expandEventSourceSection() {
        const sourceHeader = document.querySelector('[data-section="source"]');
        const sourceContent = sourceHeader.nextElementSibling;
        
        if (sourceContent && sourceContent.classList.contains('collapsed')) {
            sourceContent.classList.remove('collapsed');
            sourceHeader.classList.add('expanded');
        }
    }

    expandCustomizeSection() {
        const customizeHeader = document.querySelector('[data-section="design"]');
        const customizeContent = customizeHeader.nextElementSibling;
        
        if (customizeContent && customizeContent.classList.contains('collapsed')) {
            customizeContent.classList.remove('collapsed');
            customizeHeader.classList.add('expanded');
        }
    }

    displayAnalysisResult() {
        const resultDiv = document.getElementById('analysis-result');
        const emotionSpan = document.getElementById('emotion-category');
        const sentimentSlider = document.getElementById('sentiment-slider');
        const sentimentValue = document.getElementById('sentiment-value');

        emotionSpan.textContent = this.currentAnalysis.emotion;
        sentimentSlider.value = this.currentAnalysis.sentiment;
        sentimentValue.textContent = this.currentAnalysis.sentiment;

        resultDiv.classList.remove('hidden');
        
        // Make emotion category editable
        this.makeEmotionEditable(emotionSpan);
    }
    
    makeEmotionEditable(emotionSpan) {
        // Add visual indicator that it's clickable
        emotionSpan.style.cursor = 'pointer';
        emotionSpan.title = 'Click to edit emotion';
        
        // Remove any existing click handlers to avoid duplicates
        emotionSpan.replaceWith(emotionSpan.cloneNode(true));
        const newEmotionSpan = document.getElementById('emotion-category');
        
        newEmotionSpan.addEventListener('click', () => {
            const currentEmotion = newEmotionSpan.textContent;
            
            // Create input field
            const input = document.createElement('input');
            input.type = 'text';
            input.value = currentEmotion;
            input.className = 'emotion-input';
            input.style.cssText = `
                background: rgba(255, 255, 255, 0.2);
                border: 2px solid rgba(255, 255, 255, 0.5);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: inherit;
                font-family: inherit;
                width: 150px;
                outline: none;
            `;
            
            // Replace span with input
            newEmotionSpan.style.display = 'none';
            newEmotionSpan.parentNode.insertBefore(input, newEmotionSpan);
            input.focus();
            input.select();
            
            const saveEdit = () => {
                const newEmotion = input.value.trim();
                if (newEmotion && newEmotion !== '') {
                    newEmotionSpan.textContent = newEmotion;
                    this.currentAnalysis.emotion = newEmotion;
                    this.validateForm();
                }
                input.remove();
                newEmotionSpan.style.display = '';
            };
            
            // Save on Enter or blur
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    saveEdit();
                } else if (e.key === 'Escape') {
                    input.remove();
                    newEmotionSpan.style.display = '';
                }
            });
            
            input.addEventListener('blur', saveEdit);
        });
    }

    async showCaringResponse(text, analysis) {
        const responseSection = document.getElementById('ai-response-section');
        const responseText = document.getElementById('ai-response-text');
        
        console.log('🤖 Requesting caring AI response...');
        console.log('   Emotion:', analysis.emotion);
        console.log('   Sentiment:', analysis.sentiment);
        
        try {
            const response = await fetch('/api/generate-caring-response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emotion: analysis.emotion,
                    sentiment: analysis.sentiment,
                    text: text
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Received AI response:', data.response);
                responseText.textContent = data.response;
                responseSection.classList.remove('hidden');
            } else {
                console.error('❌ API response not ok:', response.status);
                throw new Error('API response failed');
            }
        } catch (error) {
            console.error('❌ Error generating caring response:', error);
            // Show a fallback message
            const fallback = "Thank you for sharing your feelings. Your emotions are valid and important.";
            console.log('🔄 Using fallback response:', fallback);
            responseText.textContent = fallback;
            responseSection.classList.remove('hidden');
        }
    }

    populateEmojis() {
        const emojiGrid = document.getElementById('emoji-options');
        emojiGrid.innerHTML = '';

        this.availableEmojis.forEach(emoji => {
            const emojiDiv = document.createElement('div');
            emojiDiv.className = 'emoji-option';
            emojiDiv.textContent = emoji;
            emojiDiv.addEventListener('click', () => this.selectEmoji(emoji, emojiDiv));
            emojiGrid.appendChild(emojiDiv);
        });

        // Auto-select first emoji
        if (this.availableEmojis.length > 0) {
            const firstEmoji = emojiGrid.firstChild;
            this.selectEmoji(this.availableEmojis[0], firstEmoji);
        }
    }

    populateColorWheel(suggestedColor = '#29BD67') {
        const colorWheel = document.getElementById('color-wheel');
        colorWheel.innerHTML = '';

        // Create a simple color input for user to pick any color
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.id = 'color-picker';
        colorInput.value = suggestedColor; // Use AI-suggested color
        colorInput.style.width = '100%';
        colorInput.style.height = '50px';
        colorInput.style.border = 'none';
        colorInput.style.borderRadius = '0px';
        colorInput.style.cursor = 'pointer';
        
        colorInput.addEventListener('change', (e) => {
            this.selectedColor = e.target.value;
            this.updateColorPreview(e.target.value);
            this.validateForm();
        });

        colorWheel.appendChild(colorInput);
        
        // Set initial color to suggested color
        this.selectedColor = suggestedColor;
        this.updateColorPreview(suggestedColor);
    }

    updateColorPreview(color) {
        const preview = document.getElementById('color-preview');
        const colorName = document.getElementById('color-name');
        preview.style.backgroundColor = color;
        colorName.textContent = color;
    }

    selectEmoji(emoji, element) {
        // Remove previous selection
        document.querySelectorAll('.emoji-option').forEach(el => el.classList.remove('selected'));
        
        // Add selection to clicked element
        element.classList.add('selected');
        this.selectedEmoji = emoji;
        this.validateForm();
    }

    selectColor(color, element) {
        // Remove previous selection
        document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
        
        // Add selection to clicked element
        element.classList.add('selected');
        this.selectedColor = color;
        
        // Update color preview
        const preview = document.getElementById('color-preview');
        const colorName = document.getElementById('color-name');
        preview.style.backgroundColor = color;
        colorName.textContent = color;
        
        this.validateForm();
    }

    validateForm() {
        const text = document.getElementById('feeling-input').value.trim();
        const category = document.getElementById('event-category').value;
        const description = document.getElementById('event-description').value.trim();
        
        const isValid = text && 
                       this.currentAnalysis && 
                       category && 
                       description && 
                       this.selectedEmoji && 
                       this.selectedColor;
        
        document.getElementById('save-btn').disabled = !isValid;
    }

    async saveEntry() {
        if (!this.validateFormData()) {
            return;
        }

        const saveBtn = document.getElementById('save-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = '💾 Saving...';

        try {
            const entryData = {
                text: document.getElementById('feeling-input').value.trim(),
                analysis: this.currentAnalysis,
                emoji: this.selectedEmoji,
                color: this.selectedColor,
                moodMeter: this.moodMeterPosition, // Include mood meter data
                sourceEvent: {
                    category: document.getElementById('event-category').value,
                    description: document.getElementById('event-description').value.trim()
                },
                eventTime: new Date(document.getElementById('event-time').value).toLocaleString()
            };

            const response = await fetch('/api/save-entry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(entryData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                // Show success message briefly then redirect
                this.showSuccess();
                setTimeout(() => {
                    window.location.href = 'visualization.html';
                }, 1500);
            } else {
                throw new Error('Failed to save entry');
            }

        } catch (error) {
            console.error('Error saving entry:', error);
            this.showError('Failed to save journal entry');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 Save Journal Entry';
        }
    }

    validateFormData() {
        const text = document.getElementById('feeling-input').value.trim();
        const category = document.getElementById('event-category').value;
        const description = document.getElementById('event-description').value.trim();

        if (!text) {
            this.showError('Please enter your feelings');
            return false;
        }

        if (!this.currentAnalysis) {
            this.showError('Please analyze your emotion first');
            return false;
        }

        if (!category) {
            this.showError('Please select an event category');
            return false;
        }

        if (!description) {
            this.showError('Please describe the event');
            return false;
        }

        if (!this.selectedEmoji) {
            this.showError('Please select an emoji');
            return false;
        }

        if (!this.selectedColor) {
            this.showError('Please select a color');
            return false;
        }

        return true;
    }

    resetForm() {
        document.getElementById('feeling-input').value = '';
        document.getElementById('event-category').value = '';
        document.getElementById('event-description').value = '';
        document.getElementById('analysis-result').classList.add('hidden');
        
        // Clear emoji selections
        document.querySelectorAll('.emoji-option').forEach(el => el.classList.remove('selected'));
        
        // Reset color picker
        const colorPicker = document.getElementById('color-picker');
        if (colorPicker) {
            colorPicker.value = '#29BD67';
        }
        
        // Reset state
        this.currentAnalysis = null;
        this.selectedEmoji = null;
        this.selectedColor = '#29BD67';
        
        // Reset color preview
        this.updateColorPreview('#29BD67');
        
        // Set new default time
        this.setDefaultEventTime();
        
        // Disable save button
        document.getElementById('save-btn').disabled = true;
    }

    showLoading() {
        document.getElementById('loading-overlay').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }

    showSuccess() {
        const successMessage = document.getElementById('success-message');
        successMessage.classList.remove('hidden');
        
        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 2000);
    }

    showError(message) {
        alert(message); // Simple error display - you could make this more elegant
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EmotionalJournalApp();
});