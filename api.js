// API Service for Tetris Leaderboard
// This service handles both localStorage (fallback) and backend API calls

const API_CONFIG = {
    // Set to your backend API URL, or null to use localStorage only
    API_URL: null, // e.g., 'https://your-api.com/api'
    USE_LOCAL_STORAGE: true, // Set to false when backend is ready
    TIMEOUT: 5000 // Request timeout in milliseconds
};

// Get top scores from API or localStorage
async function getTopScores() {
    if (API_CONFIG.USE_LOCAL_STORAGE || !API_CONFIG.API_URL) {
        return getTopScoresLocal();
    }
    
    try {
        const response = await fetch(`${API_CONFIG.API_URL}/scores`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.scores || [];
    } catch (error) {
        console.warn('Failed to fetch scores from API, using local storage:', error);
        return getTopScoresLocal();
    }
}

// Get top scores from localStorage
function getTopScoresLocal() {
    const saved = localStorage.getItem('tetrisTopScores');
    if (saved) {
        try {
            const scores = JSON.parse(saved);
            return Array.isArray(scores) ? scores : [];
        } catch (e) {
            return [];
        }
    }
    return [];
}

// Save score to API or localStorage
async function saveScore(name, score, difficulty = 'medium') {
    const scoreData = {
        name: name.trim() || 'Player',
        score: score,
        difficulty: difficulty,
        timestamp: Date.now()
    };
    
    if (API_CONFIG.USE_LOCAL_STORAGE || !API_CONFIG.API_URL) {
        return saveScoreLocal(scoreData);
    }
    
    try {
        const response = await fetch(`${API_CONFIG.API_URL}/scores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scoreData),
            signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.success || false;
    } catch (error) {
        console.warn('Failed to save score to API, using local storage:', error);
        return saveScoreLocal(scoreData);
    }
}

// Save score to localStorage
function saveScoreLocal(scoreData) {
    let topScores = getTopScoresLocal();
    
    // Add new score
    topScores.push(scoreData);
    
    // Sort by score descending
    topScores.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        // If scores are equal, sort by timestamp (newer first)
        return (b.timestamp || 0) - (a.timestamp || 0);
    });
    
    // Keep only top 10
    topScores = topScores.slice(0, 10);
    
    // Save to localStorage
    localStorage.setItem('tetrisTopScores', JSON.stringify(topScores));
    
    return true;
}

// Initialize API configuration
function initAPI(apiUrl = null, useLocalStorage = true) {
    if (apiUrl) {
        API_CONFIG.API_URL = apiUrl;
    }
    API_CONFIG.USE_LOCAL_STORAGE = useLocalStorage;
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getTopScores,
        saveScore,
        initAPI,
        API_CONFIG
    };
}

