const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

class EmotionalJournalServer {
    constructor() {
        this.emotionCategories = [
            'joyful', 'sadness', 'anger', 'fear', 'surprise', 'trust','awe','confusion','love',
            'disgust', 'anticipation', 'calm', 'confident', 'gratitude','compassionate','annoyance'
        ];
        this.dataFile = path.join(__dirname, 'journal-data.json');
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
            'joyful': ['#FFD700', '#FFA500', '#FFFF00', '#F0E68C'],
            'sadness': ['#4169E1', '#708090', '#191970', '#C0C0C0'],
            'anger': ['#FF0000', '#DC143C', '#B22222', '#8B0000'],
            'fear': ['#000000', '#2F4F4F', '#800080', '#4B0082'],
            'surprise': ['#FFFF00', '#00BFFF', '#FF00FF', '#FF1493'],
            'trust': ['#87CEEB', '#008080', '#98FB98', '#9ACD32'],
            'awe': ['#FFD700', '#CD853F', '#B8860B', '#DAA520'],
            'confusion': ['#F5F5DC', '#D2B48C', '#A0522D', '#8B4513'],
            'love': ['#FFC0CB', '#FF69B4', '#FF7F50', '#DC143C'],
            'disgust': ['#008000', '#808000', '#32CD32', '#228B22'],
            'anticipation': ['#FF8C00', '#32CD32', '#00FFFF', '#1E90FF'],
            'calm': ['#87CEEB', '#E6E6FA', '#98FB98', '#F0F8FF'],
            'confident': ['#4169E1', '#50C878', '#FFD700', '#E5E4E2'],
            'gratitude': ['#FFFF00', '#FFDAB9', '#FFC0CB', '#FFF8DC'],
            'compassionate': ['#DDA0DD', '#F5DEB3', '#BC8F8F', '#FFFFF0'],
            'annoyance': ['#FF8C00', '#B22222', '#800000', '#8B0000']
        };
    }

    async analyzeEmotion(text) {
        const prompt = `
Analyze the following journal entry and categorize the primary emotion. 
Choose from these emotions: ${this.emotionCategories.join(', ')}.

Also provide:
1. Primary emotion (one word from the list above)
2. Sentiment score (0-100, where 0 is very negative, 50 is neutral, 100 is very positive)

Journal entry: "${text}"

Respond in this exact format:
Emotion: [emotion]
Sentiment: [score]
`;

        try {
            // LM Studio API call
            const response = await fetch('http://localhost:1234/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: "local-model", // This will use whatever model is loaded in LM Studio
                    messages: [
                        {
                            role: "system",
                            content: "You are an expert emotional analyst. Analyze text and categorize emotions precisely."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 150
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;
            
            return this.parseResponse(content);
        } catch (error) {
            console.error('Error analyzing emotion:', error.message);
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
            }
        }

        return result;
    }

    loadEntries() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = fs.readFileSync(this.dataFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading entries:', error.message);
        }
        return [];
    }

    saveEntry(entry) {
        try {
            const entries = this.loadEntries();
            entries.push(entry);
            fs.writeFileSync(this.dataFile, JSON.stringify(entries, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving entry:', error.message);
            return false;
        }
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
}

const journal = new EmotionalJournalServer();

// API Routes
app.post('/api/analyze', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text || text.trim() === '') {
            return res.status(400).json({ error: 'Text is required' });
        }

        const analysis = await journal.analyzeEmotion(text);
        
        if (!analysis) {
            return res.status(500).json({ error: 'Failed to analyze emotion' });
        }

        // Get available emojis and colors for this emotion
        const availableEmojis = journal.emotionEmojis[analysis.emotion] || ['😐'];
        const availableColors = journal.emotionColors[analysis.emotion] || ['#808080'];
        const suggestedColor = availableColors[0]; // Use the first color as the suggestion

        res.json({
            analysis,
            availableEmojis,
            availableColors,
            suggestedColor
        });
    } catch (error) {
        console.error('Error in analyze endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// New endpoint for generating mood-based writing prompts
app.post('/api/generate-prompt', async (req, res) => {
    try {
        const { moodZone, pleasure, energy } = req.body;
        console.log('\n=== PROMPT GENERATION REQUEST ===');
        console.log('Mood Zone:', moodZone);
        console.log('Pleasure:', pleasure, 'Energy:', energy);
        
        // Create a contextual prompt request for LM Studio
        const promptRequest = `Create a complete journaling prompt for someone feeling ${moodZone.toLowerCase()} (pleasure: ${pleasure}%, energy: ${energy}%). Keep it under 20 words. Be empathetic and encouraging. Tailor the prompt specifically to this mood state. Return ONLY the complete prompt as a full sentence with proper punctuation.`;
        console.log('Prompt Request:', promptRequest);
        
        const response = await fetch('http://localhost:1234/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "llama-3.2-3b-instruct",
                messages: [
                    {
                        role: "system",
                        content: "You are a compassionate journal assistant. Generate complete journaling prompts (full sentences with proper punctuation) under 20 words that are specifically tailored to the user's current mood state (considering both their pleasure and energy levels). Output ONLY the prompt text, nothing else."
                    },
                    {
                        role: "user",
                        content: promptRequest
                    }
                ],
                temperature: 0.7,
                max_tokens: 60
            })
        });
        
        if (!response.ok) {
            throw new Error('LM Studio API error');
        }
        
        const data = await response.json();
        console.log('Raw LM Studio Response:', JSON.stringify(data, null, 2));
        
        let generatedPrompt = data.choices[0].message.content.trim();
        console.log('Extracted Prompt (before cleanup):', generatedPrompt);
        console.log('Prompt length:', generatedPrompt.length, 'characters');
        
        // Remove quotes if present
        generatedPrompt = generatedPrompt.replace(/^["']|["']$/g, '');
        console.log('After quote removal:', generatedPrompt);
        
        // Validate word count - allow up to 20 words
        const words = generatedPrompt.split(/\s+/);
        console.log('Word count:', words.length);
        if (words.length > 20) {
            // Find the last complete sentence within 20 words
            generatedPrompt = words.slice(0, 20).join(' ');
            if (!generatedPrompt.match(/[.!?]$/)) {
                generatedPrompt += '...';
            }
            console.log('Truncated to 20 words:', generatedPrompt);
        }
        
        console.log('Final prompt sent to client:', generatedPrompt);
        console.log('=== END PROMPT GENERATION ===\n');
        res.json({ prompt: generatedPrompt });
    } catch (error) {
        console.error('Error generating prompt:', error);
        console.log('Using fallback prompt for mood:', req.body.moodZone);
        // Return fallback prompts if API fails
        const fallbackPrompts = {
            'Excited/Happy': 'What made you feel energized and joyful today?',
            'Tense/Angry': 'What is causing you stress or frustration right now?',
            'Calm/Peaceful': 'What peaceful moments did you experience today?',
            'Sad/Down': 'What\'s weighing on your mind? Share your thoughts...'
        };
        const fallbackPrompt = fallbackPrompts[req.body.moodZone] || 'Share what\'s on your mind...';
        console.log('Fallback prompt:', fallbackPrompt);
        res.json({ prompt: fallbackPrompt });
    }
});

// Generate caring AI response after mood analysis
app.post('/api/generate-caring-response', async (req, res) => {
    try {
        const { emotion, sentiment, text } = req.body;
        
        console.log('\n🤖 Generating caring AI response...');
        console.log(`   Emotion: ${emotion}`);
        console.log(`   Sentiment: ${sentiment}/100`);
        console.log(`   User text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`); 
        
        const responsePrompt = `Someone is feeling ${emotion} (sentiment: ${sentiment}/100). They wrote: "${text}". Generate a warm, caring, and empathetic response in 1-2 sentences (under 30 words). Be supportive and validating. Focus ONLY on emotional support and comfort—do NOT offer actionable help or solutions.`;
        
        const response = await fetch('http://localhost:1234/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "openai/gpt-oss-20b",
                messages: [
                    {
                        role: "system",
                        content: "You are a compassionate journal companion. Generate warm, caring responses under 30 words that validate emotions and offer gentle emotional support. Do NOT suggest actions or solutions. Focus only on acknowledging feelings and providing comfort. Output ONLY the response text. Complete all sentences."
                    },
                    {
                        role: "user",
                        content: responsePrompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 100,
                stop: null
            })
        });

        if (!response.ok) {
            console.log(`   ❌ API response failed: ${response.status}`);
            throw new Error('Failed to generate response');
        }

        const data = await response.json();
        let caringResponse = data.choices[0].message.content.trim();
        
        console.log(`   📝 Raw AI response: "${caringResponse}"`);
        
        // Clean up the response
        caringResponse = caringResponse.replace(/^["']|["']$/g, '');
        
        // Validate word count (under 30 words)
        const words = caringResponse.split(/\s+/);
        console.log(`   📊 Word count: ${words.length} words`);
        
        if (words.length > 30) {
            caringResponse = words.slice(0, 30).join(' ') + '...';
            console.log(`   ✂️  Truncated to 30 words`);
        }
        
        console.log(`   ✅ Final response: "${caringResponse}"\n`);
        res.json({ response: caringResponse });
    } catch (error) {
        console.error('   ❌ Error generating caring response:', error.message);
        // Return fallback caring responses
        const fallbackResponses = [
            "Thank you for sharing your feelings. Your emotions are valid and important.",
            "I hear you. It's okay to feel this way, and you're not alone.",
            "Your feelings matter. Take all the time you need to process them."
        ];
        const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        console.log(`   🔄 Using fallback response: "${randomResponse}"\n`);
        res.json({ response: randomResponse });
    }
});

app.post('/api/save-entry', async (req, res) => {
    try {
        const { text, analysis, emoji, color, sourceEvent, eventTime } = req.body;
        
        const entry = journal.createJournalEntry(text, analysis, emoji, color, sourceEvent, eventTime);
        const saved = journal.saveEntry(entry);
        
        if (saved) {
            res.json({ success: true, entry });
        } else {
            res.status(500).json({ error: 'Failed to save entry' });
        }
    } catch (error) {
        console.error('Error saving entry:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/entries', (req, res) => {
    try {
        const entries = journal.loadEntries();
        res.json(entries);
    } catch (error) {
        console.error('Error fetching entries:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single entry by ID
app.get('/api/entry/:id', (req, res) => {
    try {
        const entries = journal.loadEntries();
        const entry = entries.find(e => e.id === req.params.id);
        
        if (entry) {
            res.json(entry);
        } else {
            res.status(404).json({ error: 'Entry not found' });
        }
    } catch (error) {
        console.error('Error fetching entry:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update entry
app.put('/api/entry/:id', (req, res) => {
    try {
        const entries = journal.loadEntries();
        const entryIndex = entries.findIndex(e => e.id === req.params.id);
        
        if (entryIndex === -1) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        // Check if this is a reflection update (only addedReflection in body)
        if (req.body.addedReflection && Object.keys(req.body).length === 1) {
            // Only update the reflection data
            entries[entryIndex].addedReflection = req.body.addedReflection;
            console.log('Updated reflection for entry:', req.params.id, req.body.addedReflection);
        } else {
            // Full entry update
            const { userInput, sentimentAnalysis, userCustomDesign, sourceEvent } = req.body;
            
            // Update the entry while preserving original timestamp and id
            entries[entryIndex] = {
                ...entries[entryIndex],
                userInput,
                sentimentAnalysis,
                userCustomDesign,
                sourceEvent,
                updatedAt: new Date().toISOString()
            };
        }

        // Save updated entries
        fs.writeFileSync(journal.dataFile, JSON.stringify(entries, null, 2));
        
        res.json({ success: true, entry: entries[entryIndex] });
    } catch (error) {
        console.error('Error updating entry:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete entry
app.delete('/api/entry/:id', (req, res) => {
    try {
        const entries = journal.loadEntries();
        const filteredEntries = entries.filter(e => e.id !== req.params.id);
        
        if (filteredEntries.length === entries.length) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        // Save filtered entries
        fs.writeFileSync(journal.dataFile, JSON.stringify(filteredEntries, null, 2));
        
        res.json({ success: true, message: 'Entry deleted' });
    } catch (error) {
        console.error('Error deleting entry:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/config', (req, res) => {
    res.json({
        emotionCategories: journal.emotionCategories,
        sourceEventCategories: journal.sourceEventCategories
    });
});

app.listen(PORT, () => {
    console.log(`Emotional Journal server running on http://localhost:${PORT}`);
    console.log(`Make sure LM Studio is running on http://localhost:1234`);
});
