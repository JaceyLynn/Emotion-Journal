const { Ollama } = require('ollama');
const readlineSync = require('readline-sync');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

class EmotionalJournal {
    constructor() {
        this.ollama = new Ollama({ host: 'http://localhost:11434' });
        this.emotionCategories = [
            'joyful', 'sadness', 'anger', 'fear', 'surprise', 'trust','awe','confusion','love',
            'disgust', 'anticipation', 'calm', 'confident', 'gratitude','compassionate','annoyance'
        ];
        this.dataFile = path.join(__dirname, 'journal-data.json');
        this.entries = this.loadEntries();
        
        // Source event categories
        this.sourceEventCategories = [
            'work', 'social', 'family', 'health', 'daily routine', 'leisure',
            'education', 'relationships', 'travel', 'personal growth', 'other'
        ];
        
        // Emotion-emoji mappings
        this.emotionEmojis = {
            'joyful': ['😊', '😄', '🎉', '🌟', '✨'],
            'sadness': ['😢', '😔', '😞', '💧', '🌧️'],
            'anger': ['😠', '😡', '🔥', '⚡', '💢'],
            'fear': ['😰', '😨', '🫣', '😟', '⚠️'],
            'surprise': ['😲', '😯', '🤯', '🎆', '❗'],
            'trust': ['🤝', '💙', '🔒', '🛡️', '🌟'],
            'awe': ['😍', '🤩', '🌅', '🎆', '💫'],
            'confusion': ['😕', '🤔', '❓', '🌀', '🤷'],
            'love': ['❤️', '💕', '🥰', '💖', '🌹'],
            'disgust': ['🤢', '😷', '🤮', '😬', '👎'],
            'anticipation': ['🤗', '⏰', '🎯', '🚀', '📅'],
            'calm': ['😌', '🧘', '🌊', '🍃', '☮️'],
            'confident': ['😎', '💪', '🏆', '👑', '⭐'],
            'gratitude': ['🙏', '💝', '🌸', '🌈', '✨'],
            'compassionate': ['🤲', '💞', '🫂', '🌻', '🕊️'],
            'annoyance': ['😤', '🙄', '😒', '⚡', '💭']
        };
        
        // Color mappings for emotions
        this.emotionColors = {
            'joyful': ['yellow', 'orange', 'gold', 'sunshine'],
            'sadness': ['blue', 'grey', 'navy', 'silver'],
            'anger': ['red', 'crimson', 'scarlet', 'burgundy'],
            'fear': ['black', 'dark grey', 'purple', 'violet'],
            'surprise': ['bright yellow', 'electric blue', 'neon', 'magenta'],
            'trust': ['light blue', 'teal', 'mint', 'sage'],
            'awe': ['golden', 'rose gold', 'copper', 'amber'],
            'confusion': ['beige', 'tan', 'brown', 'muddy'],
            'love': ['pink', 'rose', 'coral', 'warm red'],
            'disgust': ['green', 'olive', 'lime', 'forest'],
            'anticipation': ['bright orange', 'lime green', 'cyan', 'electric'],
            'calm': ['soft blue', 'lavender', 'mint green', 'pearl'],
            'confident': ['royal blue', 'emerald', 'gold', 'platinum'],
            'gratitude': ['warm yellow', 'peach', 'soft pink', 'cream'],
            'compassionate': ['soft purple', 'warm beige', 'dusty rose', 'ivory'],
            'annoyance': ['burnt orange', 'rust', 'maroon', 'dark red']
        };
    }

    loadEntries() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = fs.readFileSync(this.dataFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error(chalk.yellow('Warning: Could not load existing entries.'), error.message);
        }
        return [];
    }

    saveEntries() {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(this.entries, null, 2));
        } catch (error) {
            console.error(chalk.red('Error saving entries:'), error.message);
        }
    }

    getUserEmojiChoice(emotion) {
        const emojis = this.emotionEmojis[emotion] || ['😐'];
        console.log(chalk.cyan('\nChoose an emoji that represents your feeling:'));
        emojis.forEach((emoji, index) => {
            console.log(chalk.white(`${index + 1}. ${emoji}`));
        });
        
        const choice = readlineSync.questionInt(chalk.cyan('Enter number (1-' + emojis.length + '): '), {
            defaultInput: '1',
            limitMessage: 'Please enter a valid number.'
        });
        
        return emojis[Math.min(Math.max(choice - 1, 0), emojis.length - 1)];
    }

    getUserColorChoice(emotion) {
        const colors = this.emotionColors[emotion] || ['neutral'];
        console.log(chalk.cyan('\nChoose a color that matches your mood:'));
        colors.forEach((color, index) => {
            console.log(chalk.white(`${index + 1}. ${color}`));
        });
        
        const choice = readlineSync.questionInt(chalk.cyan('Enter number (1-' + colors.length + '): '), {
            defaultInput: '1',
            limitMessage: 'Please enter a valid number.'
        });
        
        return colors[Math.min(Math.max(choice - 1, 0), colors.length - 1)];
    }

    getUserSourceEventChoice() {
        console.log(chalk.cyan('\nWhat type of event or situation is this about?'));
        this.sourceEventCategories.forEach((category, index) => {
            console.log(chalk.white(`${index + 1}. ${category}`));
        });
        
        const choice = readlineSync.questionInt(chalk.cyan('Enter number (1-' + this.sourceEventCategories.length + '): '), {
            defaultInput: '1',
            limitMessage: 'Please enter a valid number.'
        });
        
        const category = this.sourceEventCategories[Math.min(Math.max(choice - 1, 0), this.sourceEventCategories.length - 1)];
        
        // Get description for the event
        const description = readlineSync.question(chalk.cyan(`Describe the ${category} event (e.g., "industry tech fair", "team meeting"): `));
        
        return {
            category: category,
            description: description.trim() || `${category} event`
        };
    }

    getUserEventTime() {
        console.log(chalk.cyan('\nWhen did this event happen?'));
        console.log(chalk.gray('Press Enter for current time, or enter a custom time'));
        console.log(chalk.gray('Examples: "11/22/2025, 2:30:00 PM" or "yesterday at 3pm"'));
        
        const eventTimeInput = readlineSync.question(chalk.cyan('Event time: '));
        
        if (eventTimeInput.trim() === '') {
            return new Date().toLocaleString();
        }
        
        // Try to parse the custom time
        try {
            const parsedDate = new Date(eventTimeInput);
            if (!isNaN(parsedDate.getTime())) {
                return parsedDate.toLocaleString();
            }
        } catch (error) {
            console.log(chalk.yellow('Could not parse time, using current time.'));
        }
        
        return new Date().toLocaleString();
    }

    createJournalEntry(inputText, analysis, userEmoji, userColor, sourceEvent, eventTime) {
        return {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            inputTime: new Date().toLocaleString(),
            userInput: inputText,
            sentimentAnalysis: {
                sentimentScore: analysis.sentiment || 0,
                emotionalCategory: analysis.emotion || 'unknown'
            },
            sourceEvent: {
                category: sourceEvent.category,
                description: sourceEvent.description,
                eventTime: eventTime
            },
            userCustomDesign: {
                userEmoji: userEmoji,
                userColor: userColor
            },
            createdAt: Date.now()
        };
    }

    async analyzeEmotion(text) {
        const prompt = `
Analyze the following journal entry and categorize the primary emotion. 
Choose from these emotions: ${this.emotionCategories.join(', ')}.

Also provide:
1. Primary emotion (one word from the list above)
2. Sentiment score (0-100, where 0 is very negative, 50 is neutral, 100 is very positive)
3. Brief explanation (1-2 sentences)

Journal entry: "${text}"

Respond in this exact format:
Emotion: [emotion]
Sentiment: [score]
Explanation: [explanation]
`;

        try {
            const response = await this.ollama.generate({
                model: 'deepseek-r1:8b',  // Using available model
                prompt: prompt,
                stream: false
            });

            return this.parseResponse(response.response);
        } catch (error) {
            console.error(chalk.red('Error analyzing emotion:'), error.message);
            return null;
        }
    }

    parseResponse(response) {
        const lines = response.split('\n');
        const result = {};

        for (const line of lines) {
            if (line.startsWith('Emotion:')) {
                result.emotion = line.replace('Emotion:', '').trim().toLowerCase();
            } else if (line.startsWith('Sentiment:')) {
                result.sentiment = parseInt(line.replace('Sentiment:', '').trim());
            } else if (line.startsWith('Explanation:')) {
                result.explanation = line.replace('Explanation:', '').trim();
            }
        }

        return result;
    }

    displayResults(analysis, userEmoji, userColor, sourceEvent, eventTime) {
        if (!analysis) {
            console.log(chalk.red('Unable to analyze the journal entry.'));
            return;
        }

        console.log('\n' + chalk.bold('--- Emotional Analysis ---'));
        console.log(chalk.blue('Primary Emotion: ') + chalk.yellow(analysis.emotion || 'Unknown'));
        console.log(chalk.blue('Sentiment Score: ') + chalk.yellow(analysis.sentiment || 'N/A') + '/100');
        console.log(chalk.blue('Event Time: ') + chalk.white(eventTime));
        console.log(chalk.blue('Event Category: ') + chalk.cyan(sourceEvent.category));
        console.log(chalk.blue('Event Description: ') + chalk.white(sourceEvent.description));
        console.log(chalk.blue('Your Emoji: ') + userEmoji);
        console.log(chalk.blue('Your Color: ') + chalk.keyword(userColor.replace(' ', ''))(userColor));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(chalk.green('✅ Entry saved to journal-data.json'));
    }

    async start() {
        console.log(chalk.green('Welcome to your Emotional Journal!'));
        console.log(chalk.gray('This app uses Ollama to analyze your emotions and sentiment.'));
        console.log(chalk.gray(`You have ${this.entries.length} previous journal entries.`));
        console.log(chalk.gray('Type "quit" to exit, "view" to see past entries, "stats" for statistics.\n'));

        while (true) {
            const entry = readlineSync.question(chalk.cyan('Enter your journal entry: '));
            
            if (entry.toLowerCase() === 'quit') {
                console.log(chalk.green('Thank you for journaling! Take care of yourself.'));
                break;
            }

            if (entry.toLowerCase() === 'view') {
                this.viewPastEntries();
                continue;
            }

            if (entry.toLowerCase() === 'stats') {
                this.showStatistics();
                continue;
            }

            if (entry.trim() === '') {
                console.log(chalk.yellow('Please enter some text for analysis.'));
                continue;
            }

            console.log(chalk.gray('Analyzing your emotions...'));
            
            const analysis = await this.analyzeEmotion(entry);
            
            if (analysis && analysis.emotion) {
                // Get user choices for emoji, color, source event, and event time
                const userEmoji = this.getUserEmojiChoice(analysis.emotion);
                const userColor = this.getUserColorChoice(analysis.emotion);
                const sourceEvent = this.getUserSourceEventChoice();
                const eventTime = this.getUserEventTime();
                
                // Create and save the journal entry
                const journalEntry = this.createJournalEntry(entry, analysis, userEmoji, userColor, sourceEvent, eventTime);
                this.entries.push(journalEntry);
                this.saveEntries();
                
                // Display results
                this.displayResults(analysis, userEmoji, userColor, sourceEvent, eventTime);
            } else {
                console.log(chalk.red('Unable to analyze the journal entry. Please try again.'));
            }
            
            console.log(''); // Add spacing
        }
    }

    viewPastEntries(limit = 5) {
        if (this.entries.length === 0) {
            console.log(chalk.yellow('No previous entries found.'));
            return;
        }

        console.log(chalk.bold(`\n--- Last ${Math.min(limit, this.entries.length)} Journal Entries ---`));
        
        const recentEntries = this.entries.slice(-limit).reverse();
        
        recentEntries.forEach((entry, index) => {
            console.log(chalk.gray(`\n${index + 1}. Journal Entry: ${entry.inputTime}`));
            console.log(chalk.gray(`   Event Time: ${entry.sourceEvent?.eventTime || 'N/A'}`));
            console.log(chalk.white(`"${entry.userInput}"`));
            const sourceEventDisplay = entry.sourceEvent 
                ? `${entry.sourceEvent.category}: ${entry.sourceEvent.description}`
                : 'N/A';
            const emotion = entry.sentimentAnalysis?.emotionalCategory || entry.emotionalCategory || 'unknown';
            const sentiment = entry.sentimentAnalysis?.sentimentScore || entry.sentimentScore || 0;
            const emoji = entry.userCustomDesign?.userEmoji || entry.userEmoji || '😐';
            const color = entry.userCustomDesign?.userColor || entry.userColor || 'neutral';
            console.log(`${emoji} ${chalk.yellow(emotion)} (${sentiment}/100) ${chalk.keyword(color.replace(' ', ''))(color)} [${chalk.cyan(sourceEventDisplay)}]`);
            console.log(chalk.gray('─'.repeat(50)));
        });
    }

    showStatistics() {
        if (this.entries.length === 0) {
            console.log(chalk.yellow('No entries available for statistics.'));
            return;
        }

        const emotions = {};
        let totalSentiment = 0;
        
        this.entries.forEach(entry => {
            const emotion = entry.sentimentAnalysis?.emotionalCategory || entry.emotionalCategory || 'unknown';
            const sentiment = entry.sentimentAnalysis?.sentimentScore || entry.sentimentScore || 0;
            emotions[emotion] = (emotions[emotion] || 0) + 1;
            totalSentiment += sentiment;
        });

        const averageSentiment = (totalSentiment / this.entries.length).toFixed(1);
        const mostCommonEmotion = Object.keys(emotions).reduce((a, b) => emotions[a] > emotions[b] ? a : b);

        console.log(chalk.bold('\n--- Journal Statistics ---'));
        console.log(chalk.blue('Total Entries: ') + chalk.yellow(this.entries.length));
        console.log(chalk.blue('Average Sentiment: ') + chalk.yellow(averageSentiment) + '/100');
        console.log(chalk.blue('Most Common Emotion: ') + chalk.yellow(mostCommonEmotion));
        
        console.log(chalk.blue('\nEmotion Distribution:'));
        Object.entries(emotions)
            .sort(([,a], [,b]) => b - a)
            .forEach(([emotion, count]) => {
                const percentage = ((count / this.entries.length) * 100).toFixed(1);
                console.log(chalk.white(`  ${emotion}: ${count} (${percentage}%)`));
            });
        
        console.log(chalk.gray('─'.repeat(40)));
    }
}

// Check if Ollama is available
async function checkOllamaConnection() {
    try {
        const ollama = new Ollama({ host: 'http://localhost:11434' });
        await ollama.list();
        return true;
    } catch (error) {
        console.error(chalk.red('Unable to connect to Ollama.'));
        console.log(chalk.yellow('Please make sure Ollama is running on localhost:11434'));
        console.log(chalk.gray('Install Ollama from: https://ollama.ai'));
        console.log(chalk.gray('Then run: ollama serve'));
        return false;
    }
}

// Main execution
async function main() {
    console.log(chalk.blue('Starting Emotional Journal...'));
    
    const isOllamaAvailable = await checkOllamaConnection();
    if (!isOllamaAvailable) {
        process.exit(1);
    }

    const journal = new EmotionalJournal();
    await journal.start();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = EmotionalJournal;
