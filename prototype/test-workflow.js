const EmotionalJournal = require('./index');

async function testWorkflow() {
    console.log('Testing the new workflow...');
    
    // Create a test instance
    const journal = new EmotionalJournal();
    
    // Test emotion analysis
    const testText = "I'm so excited about my new project! It's going to be amazing.";
    console.log(`\nTesting with: "${testText}"`);
    
    const analysis = await journal.analyzeEmotion(testText);
    console.log('\nAnalysis result:', analysis);
    
    if (analysis && analysis.emotion) {
        // Test emoji selection (simulate user choosing first option)
        const emojis = journal.emotionEmojis[analysis.emotion] || ['😐'];
        const userEmoji = emojis[0]; // Choose first emoji
        
        // Test color selection (simulate user choosing first option)
        const colors = journal.emotionColors[analysis.emotion] || ['neutral'];
        const userColor = colors[0]; // Choose first color
        
        // Test source event selection (simulate user choosing 'work' and description)
        const userSourceEvent = {
            category: 'work',
            description: 'project planning meeting'
        };
        
        // Test event time (simulate current time)
        const userEventTime = new Date().toLocaleString();
        
        console.log('\nSelected emoji:', userEmoji);
        console.log('Selected color:', userColor);
        console.log('Selected source event:', userSourceEvent);
        console.log('Selected event time:', userEventTime);
        
        // Create journal entry
        const entry = journal.createJournalEntry(testText, analysis, userEmoji, userColor, userSourceEvent, userEventTime);
        console.log('\nCreated entry structure:');
        console.log(JSON.stringify(entry, null, 2));
        
        console.log('\n✅ Test completed successfully!');
    } else {
        console.log('❌ Analysis failed');
    }
}

testWorkflow().catch(console.error);
