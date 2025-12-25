# Backend Setup Guide for Shared Leaderboard

This guide explains how to set up a backend API for the shared leaderboard feature.

## Current Status

The game currently uses **localStorage** for storing scores, which means scores are only visible on the same device/browser. To enable a shared leaderboard across all players, you need to set up a backend API.

## Quick Setup Options

### Option 1: Firebase Realtime Database (Recommended for Quick Setup)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Realtime Database
4. Get your database URL
5. Update `api.js`:
   ```javascript
   API_CONFIG.API_URL = 'https://your-project.firebaseio.com';
   API_CONFIG.USE_LOCAL_STORAGE = false;
   ```

### Option 2: Supabase (PostgreSQL)

1. Go to [Supabase](https://supabase.com/)
2. Create a new project
3. Create a `scores` table:
   ```sql
   CREATE TABLE scores (
     id SERIAL PRIMARY KEY,
     name VARCHAR(50) NOT NULL,
     score INTEGER NOT NULL,
     difficulty VARCHAR(20),
     timestamp BIGINT NOT NULL
   );
   ```
4. Create API endpoints or use Supabase client
5. Update `api.js` with your Supabase URL

### Option 3: Simple Node.js/Express Server

Create a simple server:

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let scores = [];

// GET top 10 scores
app.get('/api/scores', (req, res) => {
  const top10 = scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  res.json({ scores: top10 });
});

// POST new score
app.post('/api/scores', (req, res) => {
  const { name, score, difficulty, timestamp } = req.body;
  scores.push({ name, score, difficulty, timestamp: timestamp || Date.now() });
  scores.sort((a, b) => b.score - a.score);
  scores = scores.slice(0, 10); // Keep only top 10
  res.json({ success: true });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Updating the Frontend

Once your backend is set up:

1. Open `api.js`
2. Update the configuration:
   ```javascript
   const API_CONFIG = {
       API_URL: 'https://your-api-url.com/api', // Your backend URL
       USE_LOCAL_STORAGE: false, // Set to false to use API
       TIMEOUT: 5000
   };
   ```

3. Or call `initAPI()` in your code:
   ```javascript
   initAPI('https://your-api-url.com/api', false);
   ```

## API Endpoints Required

Your backend needs to provide:

### GET /api/scores
Returns top 10 scores:
```json
{
  "scores": [
    { "name": "Player1", "score": 1000, "difficulty": "medium", "timestamp": 1234567890 },
    { "name": "Player2", "score": 800, "difficulty": "hard", "timestamp": 1234567891 }
  ]
}
```

### POST /api/scores
Accepts new score:
```json
{
  "name": "Player1",
  "score": 1000,
  "difficulty": "medium",
  "timestamp": 1234567890
}
```

Returns:
```json
{
  "success": true
}
```

## CORS Configuration

Make sure your backend allows CORS requests from your frontend domain:

```javascript
// Express example
app.use(cors({
  origin: 'https://your-frontend-domain.com'
}));
```

## Testing

1. Start with `USE_LOCAL_STORAGE: true` to test locally
2. Set up your backend
3. Change to `USE_LOCAL_STORAGE: false` and update `API_URL`
4. Test score submission and retrieval
5. Verify scores appear across different devices/browsers

## Fallback Behavior

The system automatically falls back to localStorage if:
- API is not configured
- API request fails
- Network error occurs

This ensures the game always works, even without a backend.

