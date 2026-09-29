const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class DataVisualizer {
    constructor() {
        this.dataFile = path.join(__dirname, 'journal-data.json');
        this.entries = this.loadEntries();
    }

    loadEntries() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = fs.readFileSync(this.dataFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading data:', error.message);
        }
        return [];
    }

    generateReport() {
        if (this.entries.length === 0) {
            console.log(chalk.yellow('No journal entries found. Create some entries first!'));
            return;
        }

        console.log(chalk.bold.cyan('📊 EMOTIONAL JOURNAL DATA REPORT'));
        console.log(chalk.gray('═'.repeat(50)));

        this.showOverviewStats();
        this.showEmotionTrends();
        this.showSourceEventAnalysis();
        this.showSentimentAnalysis();
        this.showTimePatterns();
        this.exportData();
    }

    showOverviewStats() {
        console.log(chalk.bold('\n📈 OVERVIEW STATISTICS'));
        console.log(chalk.gray('─'.repeat(30)));
        
        const totalEntries = this.entries.length;
        const dateRange = this.getDateRange();
        const averageSentiment = this.getAverageSentiment();
        
        console.log(chalk.blue('Total Journal Entries: ') + chalk.white(totalEntries));
        console.log(chalk.blue('Date Range: ') + chalk.white(dateRange));
        console.log(chalk.blue('Average Sentiment: ') + chalk.white(averageSentiment + '/100'));
    }

    showEmotionTrends() {
        console.log(chalk.bold('\n🎭 EMOTION DISTRIBUTION'));
        console.log(chalk.gray('─'.repeat(30)));
        
        const emotions = {};
        this.entries.forEach(entry => {
            const emotion = entry.sentimentAnalysis?.emotionalCategory || entry.emotionalCategory || 'unknown';
            emotions[emotion] = (emotions[emotion] || 0) + 1;
        });

        const sortedEmotions = Object.entries(emotions)
            .sort(([,a], [,b]) => b - a);

        sortedEmotions.forEach(([emotion, count]) => {
            const percentage = ((count / this.entries.length) * 100).toFixed(1);
            const bar = '█'.repeat(Math.round(percentage / 5));
            console.log(chalk.yellow(emotion.padEnd(15)) + 
                       chalk.green(bar.padEnd(20)) + 
                       chalk.white(`${count} (${percentage}%)`));
        });
    }

    showSourceEventAnalysis() {
        console.log(chalk.bold('\n📝 SOURCE EVENT ANALYSIS'));
        console.log(chalk.gray('─'.repeat(30)));
        
        const sourceEvents = {};
        const eventDescriptions = {};
        
        this.entries.forEach(entry => {
            const category = entry.sourceEvent?.category || 'unknown';
            const description = entry.sourceEvent?.description || '';
                
            sourceEvents[category] = (sourceEvents[category] || 0) + 1;
            
            if (description) {
                if (!eventDescriptions[category]) eventDescriptions[category] = [];
                if (!eventDescriptions[category].includes(description)) {
                    eventDescriptions[category].push(description);
                }
            }
        });

        const sortedEvents = Object.entries(sourceEvents)
            .sort(([,a], [,b]) => b - a);

        console.log(chalk.bold('By Category:'));
        sortedEvents.forEach(([event, count]) => {
            const percentage = ((count / this.entries.length) * 100).toFixed(1);
            const bar = '█'.repeat(Math.round(percentage / 5));
            console.log(chalk.magenta(event.padEnd(15)) + 
                       chalk.green(bar.padEnd(20)) + 
                       chalk.white(`${count} (${percentage}%)`));
        });

        console.log(chalk.bold('\nSpecific Events:'));
        Object.entries(eventDescriptions).forEach(([category, descriptions]) => {
            console.log(chalk.cyan(`${category}:`));
            descriptions.forEach(desc => {
                console.log(chalk.gray(`  • ${desc}`));
            });
        });
    }

    showSentimentAnalysis() {
        console.log(chalk.bold('\n💭 SENTIMENT ANALYSIS'));
        console.log(chalk.gray('─'.repeat(30)));
        
        const sentimentRanges = {
            'Very Positive (80-100)': 0,
            'Positive (60-79)': 0,
            'Neutral (40-59)': 0,
            'Negative (20-39)': 0,
            'Very Negative (0-19)': 0
        };

        this.entries.forEach(entry => {
            const score = entry.sentimentAnalysis?.sentimentScore || entry.sentimentScore || 0;
            if (score >= 80) sentimentRanges['Very Positive (80-100)']++;
            else if (score >= 60) sentimentRanges['Positive (60-79)']++;
            else if (score >= 40) sentimentRanges['Neutral (40-59)']++;
            else if (score >= 20) sentimentRanges['Negative (20-39)']++;
            else sentimentRanges['Very Negative (0-19)']++;
        });

        Object.entries(sentimentRanges).forEach(([range, count]) => {
            if (count > 0) {
                const percentage = ((count / this.entries.length) * 100).toFixed(1);
                console.log(chalk.cyan(range.padEnd(25)) + chalk.white(`${count} (${percentage}%)`));
            }
        });
    }

    showTimePatterns() {
        console.log(chalk.bold('\n⏰ TIME PATTERNS'));
        console.log(chalk.gray('─'.repeat(30)));
        
        const timePatterns = {};
        this.entries.forEach(entry => {
            const date = new Date(entry.timestamp);
            const hour = date.getHours();
            let timeOfDay;
            
            if (hour < 6) timeOfDay = 'Late Night (0-6)';
            else if (hour < 12) timeOfDay = 'Morning (6-12)';
            else if (hour < 18) timeOfDay = 'Afternoon (12-18)';
            else timeOfDay = 'Evening (18-24)';
            
            timePatterns[timeOfDay] = (timePatterns[timeOfDay] || 0) + 1;
        });

        Object.entries(timePatterns).forEach(([time, count]) => {
            const percentage = ((count / this.entries.length) * 100).toFixed(1);
            console.log(chalk.magenta(time.padEnd(20)) + chalk.white(`${count} (${percentage}%)`));
        });
    }

    exportData() {
        console.log(chalk.bold('\n📁 DATA EXPORT'));
        console.log(chalk.gray('─'.repeat(30)));
        
        // Export summary data for visualization tools
        const exportData = {
            summary: {
                totalEntries: this.entries.length,
                averageSentiment: this.getAverageSentiment(),
                dateRange: this.getDateRange(),
                mostCommonEmotion: this.getMostCommonEmotion(),
                mostCommonSourceEvent: this.getMostCommonSourceEvent()
            },
            emotionDistribution: this.getEmotionDistribution(),
            sourceEventDistribution: this.getSourceEventDistribution(),
            sentimentTrends: this.getSentimentTrends(),
            timePatterns: this.getTimePatterns(),
            rawEntries: this.entries
        };

        const exportFile = path.join(__dirname, 'journal-export.json');
        fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
        
        console.log(chalk.green('✅ Data exported to: ') + chalk.white('journal-export.json'));
        console.log(chalk.gray('This file can be used with data visualization tools like D3.js, Chart.js, or Python/Matplotlib'));
    }

    getDateRange() {
        if (this.entries.length === 0) return 'No entries';
        
        const dates = this.entries.map(entry => new Date(entry.timestamp));
        const earliest = new Date(Math.min(...dates));
        const latest = new Date(Math.max(...dates));
        
        return `${earliest.toDateString()} - ${latest.toDateString()}`;
    }

    getAverageSentiment() {
        if (this.entries.length === 0) return 0;
        
        const total = this.entries.reduce((sum, entry) => {
            const sentiment = entry.sentimentAnalysis?.sentimentScore || entry.sentimentScore || 0;
            return sum + sentiment;
        }, 0);
        return (total / this.entries.length).toFixed(1);
    }

    getMostCommonEmotion() {
        const emotions = {};
        this.entries.forEach(entry => {
            const emotion = entry.sentimentAnalysis?.emotionalCategory || entry.emotionalCategory || 'unknown';
            emotions[emotion] = (emotions[emotion] || 0) + 1;
        });
        
        return Object.keys(emotions).reduce((a, b) => emotions[a] > emotions[b] ? a : b, 'none');
    }

    getMostCommonSourceEvent() {
        const sourceEvents = {};
        this.entries.forEach(entry => {
            const category = entry.sourceEvent?.category || 'unknown';
            sourceEvents[category] = (sourceEvents[category] || 0) + 1;
        });
        
        return Object.keys(sourceEvents).reduce((a, b) => sourceEvents[a] > sourceEvents[b] ? a : b, 'none');
    }

    getSourceEventDistribution() {
        const sourceEvents = {};
        this.entries.forEach(entry => {
            const category = entry.sourceEvent?.category || 'unknown';
            sourceEvents[category] = (sourceEvents[category] || 0) + 1;
        });
        return sourceEvents;
    }

    getEmotionDistribution() {
        const emotions = {};
        this.entries.forEach(entry => {
            const emotion = entry.sentimentAnalysis?.emotionalCategory || entry.emotionalCategory || 'unknown';
            emotions[emotion] = (emotions[emotion] || 0) + 1;
        });
        return emotions;
    }

    getSentimentTrends() {
        return this.entries.map(entry => ({
            date: entry.timestamp,
            sentiment: entry.sentimentAnalysis?.sentimentScore || entry.sentimentScore || 0,
            emotion: entry.sentimentAnalysis?.emotionalCategory || entry.emotionalCategory || 'unknown'
        }));
    }

    getTimePatterns() {
        const patterns = {};
        this.entries.forEach(entry => {
            const hour = new Date(entry.timestamp).getHours();
            patterns[hour] = (patterns[hour] || 0) + 1;
        });
        return patterns;
    }
}

// Run the report if this file is executed directly
if (require.main === module) {
    const visualizer = new DataVisualizer();
    visualizer.generateReport();
}

module.exports = DataVisualizer;
