const EmotionalJournal = require('./index');

class EmotionAnalyzer {
    constructor() {
        this.journal = new EmotionalJournal();
    }

    async analyzeBatch(entries) {
        const results = [];
        
        for (const entry of entries) {
            const analysis = await this.journal.analyzeEmotion(entry);
            results.push({
                text: entry,
                analysis: analysis
            });
        }
        
        return results;
    }

    generateEmotionReport(analyses) {
        const emotionCounts = {};
        let totalSentiment = 0;
        let validAnalyses = 0;

        analyses.forEach(({ analysis }) => {
            if (analysis && analysis.emotion) {
                emotionCounts[analysis.emotion] = (emotionCounts[analysis.emotion] || 0) + 1;
                if (typeof analysis.sentiment === 'number') {
                    totalSentiment += analysis.sentiment;
                    validAnalyses++;
                }
            }
        });

        const averageSentiment = validAnalyses > 0 ? (totalSentiment / validAnalyses).toFixed(1) : 'N/A';
        const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) => 
            emotionCounts[a] > emotionCounts[b] ? a : b, Object.keys(emotionCounts)[0]);

        return {
            totalEntries: analyses.length,
            emotionCounts,
            dominantEmotion,
            averageSentiment
        };
    }
}

module.exports = EmotionAnalyzer;
