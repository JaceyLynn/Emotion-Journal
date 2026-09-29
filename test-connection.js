const { Ollama } = require('ollama');

async function testConnection() {
    console.log('Testing Ollama connection...');
    
    const ollama = new Ollama({ host: 'http://localhost:11434' });
    
    try {
        // Test connection
        const models = await ollama.list();
        console.log('✅ Connected to Ollama successfully!');
        console.log('Available models:');
        models.models.forEach(model => {
            console.log(`  - ${model.name}`);
        });
        
        // Test emotion analysis
        console.log('\n🧪 Testing emotion analysis...');
        const testPrompt = `
Analyze the following journal entry and categorize the primary emotion. 
Choose from these emotions: joy, sadness, anger, fear, surprise, disgust, anticipation, trust, love, gratitude.

Also provide:
1. Primary emotion (one word from the list above)
2. Sentiment score (0-100, where 0 is very negative, 50 is neutral, 100 is very positive)
3. Brief explanation (1-2 sentences)

Journal entry: "I had an amazing day at the park with my family. The weather was perfect and we laughed so much."

Respond in this exact format:
Emotion: [emotion]
Sentiment: [score]
Explanation: [explanation]
`;

        const response = await ollama.generate({
            model: 'deepseek-r1:8b',
            prompt: testPrompt,
            stream: false
        });

        console.log('📊 Analysis result:');
        console.log(response.response);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testConnection();
