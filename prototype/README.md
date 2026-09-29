# Emotional Journal with Ollama Integration

An interactive command-line application that analyzes the emotional content of journal entries using a local Ollama language model and stores all data for future visualization.

## Features

- **Real-time Emotion Analysis**: Categorizes emotions into 16 primary categories
- **Sentiment Scoring**: Provides sentiment scores from 0-100
- **Interactive User Choices**: Select emojis and colors that match your emotions
- **Data Storage**: All entries saved to JSON for data visualization
- **Local AI Processing**: Uses Ollama for privacy-focused, offline analysis
- **Statistics & Insights**: View trends and patterns in your emotional data
- **Data Export**: Export data for external visualization tools

## Prerequisites

1. **Node.js** (version 14 or higher)
2. **Ollama** installed and running locally

### Installing Ollama

1. Download Ollama from [https://ollama.ai](https://ollama.ai)
2. Install and start the Ollama service:
   ```bash
   # Start Ollama service
   ollama serve
   ```
3. Pull a language model (e.g., llama2):
   ```bash
   ollama pull llama2
   ```

## Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Interactive Mode

Start the interactive journal:
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

### Data Visualization

Generate a comprehensive report of your journal data:
```bash
npm run visualize
```

This creates a detailed report and exports data for external visualization tools.

### Commands within the app:
- Enter journal text for analysis
- `view` - See your last 5 journal entries
- `stats` - View statistics about your emotional patterns
- `quit` - Exit the application

### Example Usage

```
Enter your journal entry: I had an amazing day at the park with my family. The weather was perfect and we laughed so much.

--- Emotional Analysis ---
Primary Emotion: joyful
Sentiment Score: 85/100

Choose an emoji that represents your feeling:
1. 😊  2. 😄  3. 🎉  4. 🌟  5. ✨
Enter number (1-5): 3

Choose a color that matches your mood:
1. yellow  2. orange  3. gold  4. sunshine
Enter number (1-4): 2

What type of event or situation is this about?
1. work  2. social  3. family  4. health  5. daily routine
Enter number (1-5): 1
Describe the work event (e.g., "industry tech fair", "team meeting"): networking event

When did this event happen?
Press Enter for current time, or enter a custom time
Examples: "11/22/2025, 2:30:00 PM" or "yesterday at 3pm"
Event time: 11/17/2025, 10:00:00 AM

Primary Emotion: joyful
Sentiment Score: 85/100
Event Time: 11/17/2025, 10:00:00 AM
Event Category: work
Event Description: networking event
Your Emoji: 🎉
Your Color: orange
✅ Entry saved to journal-data.json
```

### Data Storage Structure

Each journal entry is stored with:
```json
{
  "id": "1700000000000",
  "timestamp": "2025-11-17T21:00:00.000Z",
  "inputTime": "11/17/2025, 4:00:00 PM",
  "userInput": "Your journal text here",
  "sentimentAnalysis": {
    "sentimentScore": 85,
    "emotionalCategory": "joyful"
  },
  "sourceEvent": {
    "category": "work",
    "description": "industry tech fair",
    "eventTime": "11/17/2025, 2:00:00 PM"
  },
  "userCustomDesign": {
    "userEmoji": "🎉",
    "userColor": "orange"
  },
  "createdAt": 1700000000000
}
```

### Structured Data Groups

- **Core Info**: `id`, `timestamp`, `inputTime`, `userInput`, `createdAt`
- **AI Analysis**: `sentimentAnalysis` (score & emotion category)
- **Event Context**: `sourceEvent` (category, description, event time)  
- **User Customization**: `userCustomDesign` (emoji & color choices)

### Source Event Categories

The application categorizes the source of emotions into:
- **Work**: Job-related experiences and stress
- **Social**: Interactions with friends and social events  
- **Family**: Family relationships and activities
- **Health**: Physical and mental health matters
- **Daily Routine**: Regular activities and habits
- **Leisure**: Hobbies, entertainment, and relaxation
- **Education**: Learning and academic experiences
- **Relationships**: Romantic and close personal relationships
- **Travel**: Travel experiences and adventures
- **Personal Growth**: Self-improvement and development
- **Other**: Miscellaneous experiences

## Project Structure

```
├── index.js              # Main application file
├── emotionAnalyzer.js     # Emotion analysis utilities  
├── dataVisualizer.js      # Data visualization and export
├── journal-data.json      # Your journal entries (created automatically)
├── journal-export.json    # Processed data for visualization tools
├── package.json           # Project dependencies
└── README.md             # This file
```

## Emotion Categories

The application categorizes emotions into:
- Joyful, Sadness, Anger, Fear, Surprise, Trust
- Awe, Confusion, Love, Disgust, Anticipation, Calm  
- Confident, Gratitude, Compassionate, Annoyance

## Data Visualization Features

- **Overview Statistics**: Total entries, date ranges, average sentiment, most common emotion and source event
- **Emotion Distribution**: See which emotions appear most frequently
- **Source Event Analysis**: Understand what types of situations trigger different emotions
- **Sentiment Analysis**: Breakdown of positive/negative/neutral entries
- **Time Patterns**: Discover when you tend to journal and feel certain emotions
- **Data Export**: JSON export for use with external tools (D3.js, Chart.js, Python, etc.)

## Troubleshooting

### "Unable to connect to Ollama"
- Ensure Ollama is installed and running: `ollama serve`
- Check that Ollama is accessible at `http://localhost:11434`
- Verify you have downloaded a language model: `ollama list`

### "Model not found"
- Pull the required model: `ollama pull llama2`
- Or change the model name in `index.js` to one you have installed

## Privacy

This application processes all data locally using Ollama. No journal entries are sent to external servers, ensuring complete privacy of your personal thoughts and emotions.

## License

ISC
