// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
    null,
    '#00f0f0', // I - Cyan
    '#f0f000', // O - Yellow
    '#a000f0', // T - Purple
    '#00f000', // S - Green
    '#f00000', // Z - Red
    '#0000f0', // J - Blue
    '#f0a000'  // L - Orange
];

// Tetromino shapes (each shape is defined by its rotations)
const SHAPES = [
    // I shape
    [
        [[0,0,0,0],
         [1,1,1,1],
         [0,0,0,0],
         [0,0,0,0]],
        [[0,0,1,0],
         [0,0,1,0],
         [0,0,1,0],
         [0,0,1,0]]
    ],
    // O shape
    [
        [[0,2,2,0],
         [0,2,2,0],
         [0,0,0,0],
         [0,0,0,0]]
    ],
    // T shape
    [
        [[0,3,0,0],
         [3,3,3,0],
         [0,0,0,0],
         [0,0,0,0]],
        [[0,3,0,0],
         [0,3,3,0],
         [0,3,0,0],
         [0,0,0,0]],
        [[0,0,0,0],
         [3,3,3,0],
         [0,3,0,0],
         [0,0,0,0]],
        [[0,3,0,0],
         [3,3,0,0],
         [0,3,0,0],
         [0,0,0,0]]
    ],
    // S shape
    [
        [[0,4,4,0],
         [4,4,0,0],
         [0,0,0,0],
         [0,0,0,0]],
        [[0,4,0,0],
         [0,4,4,0],
         [0,0,4,0],
         [0,0,0,0]]
    ],
    // Z shape
    [
        [[5,5,0,0],
         [0,5,5,0],
         [0,0,0,0],
         [0,0,0,0]],
        [[0,0,5,0],
         [0,5,5,0],
         [0,5,0,0],
         [0,0,0,0]]
    ],
    // J shape
    [
        [[6,0,0,0],
         [6,6,6,0],
         [0,0,0,0],
         [0,0,0,0]],
        [[0,6,6,0],
         [0,6,0,0],
         [0,6,0,0],
         [0,0,0,0]],
        [[0,0,0,0],
         [6,6,6,0],
         [0,0,6,0],
         [0,0,0,0]],
        [[0,6,0,0],
         [0,6,0,0],
         [6,6,0,0],
         [0,0,0,0]]
    ],
    // L shape
    [
        [[0,0,7,0],
         [7,7,7,0],
         [0,0,0,0],
         [0,0,0,0]],
        [[0,7,0,0],
         [0,7,0,0],
         [0,7,7,0],
         [0,0,0,0]],
        [[0,0,0,0],
         [7,7,7,0],
         [7,0,0,0],
         [0,0,0,0]],
        [[7,7,0,0],
         [0,7,0,0],
         [0,7,0,0],
         [0,0,0,0]]
    ]
];

// Game state
let board = [];
let currentPiece = null;
let score = 0;
let highScore = 0;
let gameOver = false;
let isPaused = false;
let dropCounter = 0;
let dropInterval = 1000; // milliseconds
let lastTime = 0;
let difficulty = 'medium';

// Difficulty settings
const DIFFICULTY_SETTINGS = {
    easy: { interval: 1500, name: 'Easy' },
    medium: { interval: 1000, name: 'Medium' },
    hard: { interval: 600, name: 'Hard' },
    expert: { interval: 300, name: 'Expert' }
};

// Load high score from localStorage
function loadHighScore() {
    const saved = localStorage.getItem('tetrisHighScore');
    if (saved) {
        highScore = parseInt(saved, 10);
    }
}

// Save high score to localStorage
function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('tetrisHighScore', highScore.toString());
        if (highScoreElement) {
            highScoreElement.textContent = highScore;
        }
    }
}

// Get difficulty from URL parameter
function getDifficultyFromURL() {
    const params = new URLSearchParams(window.location.search);
    const diff = params.get('difficulty') || 'medium';
    return DIFFICULTY_SETTINGS[diff] ? diff : 'medium';
}

// Initialize difficulty
difficulty = getDifficultyFromURL();
dropInterval = DIFFICULTY_SETTINGS[difficulty].interval;

const canvas = document.getElementById('gameBoard');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const difficultyDisplay = document.getElementById('difficultyDisplay');
const gameOverElement = document.getElementById('gameOver');
const pauseOverlay = document.getElementById('pauseOverlay');
const finalScoreElement = document.getElementById('finalScore');
const highScoreFinalElement = document.getElementById('highScoreFinal');
const restartBtn = document.getElementById('restartBtn');
const resumeBtn = document.getElementById('resumeBtn');
const muteBtn = document.getElementById('muteBtn');

// Mobile control buttons
const mobileLeft = document.getElementById('mobileLeft');
const mobileRight = document.getElementById('mobileRight');
const mobileRotate = document.getElementById('mobileRotate');
const mobileDrop = document.getElementById('mobileDrop');
const mobilePause = document.getElementById('mobilePause');

// Load high score on page load
loadHighScore();
if (highScoreElement) {
    highScoreElement.textContent = highScore;
}
if (difficultyDisplay) {
    difficultyDisplay.textContent = DIFFICULTY_SETTINGS[difficulty].name;
}

// Initialize board
function createBoard() {
    return Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
}

// Create a new piece
function createPiece() {
    const typeId = Math.floor(Math.random() * SHAPES.length);
    const piece = {
        typeId: typeId,
        shape: SHAPES[typeId][0],
        x: Math.floor(COLS / 2) - 2,
        y: 0,
        rotation: 0
    };
    return piece;
}

// Draw a single block
function drawBlock(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = '#333';
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

// Draw the board
function drawBoard() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                drawBlock(x, y, COLORS[board[y][x]]);
            }
        }
    }
}

// Draw the current piece
function drawPiece() {
    if (!currentPiece) return;
    
    const shape = currentPiece.shape;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const boardX = currentPiece.x + x;
                const boardY = currentPiece.y + y;
                if (boardY >= 0) {
                    drawBlock(boardX, boardY, COLORS[shape[y][x]]);
                }
            }
        }
    }
}

// Check collision
function collide(piece, board, dx = 0, dy = 0) {
    const shape = piece.shape;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const newX = piece.x + x + dx;
                const newY = piece.y + y + dy;
                
                // Check boundaries
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return true;
                }
                
                // Check collision with existing blocks
                if (newY >= 0 && board[newY][newX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Merge piece into board
function mergePiece() {
    const shape = currentPiece.shape;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const boardX = currentPiece.x + x;
                const boardY = currentPiece.y + y;
                if (boardY >= 0) {
                    board[boardY][boardX] = shape[y][x];
                }
            }
        }
    }
}

// Clear completed lines
function clearLines() {
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            y++; // Check the same row again
        }
    }
    if (linesCleared > 0) {
        score += linesCleared * 100;
        scoreElement.textContent = score;
        soundManager.playLineClear();
    }
}

// Rotate piece
function rotatePiece() {
    if (!currentPiece || isPaused) return;
    
    const typeId = currentPiece.typeId;
    const rotations = SHAPES[typeId];
    const nextRotation = (currentPiece.rotation + 1) % rotations.length;
    const nextShape = rotations[nextRotation];
    
    const originalShape = currentPiece.shape;
    const originalRotation = currentPiece.rotation;
    
    currentPiece.shape = nextShape;
    currentPiece.rotation = nextRotation;
    
    // Check if rotation causes collision, if so, try wall kicks
    if (collide(currentPiece, board)) {
        // Try moving left
        currentPiece.x--;
        if (collide(currentPiece, board)) {
            // Try moving right
            currentPiece.x += 2;
            if (collide(currentPiece, board)) {
                // Revert rotation
                currentPiece.x--;
                currentPiece.shape = originalShape;
                currentPiece.rotation = originalRotation;
                return;
            }
        }
    }
    soundManager.playRotate();
}

// Move piece
function movePiece(dx, dy) {
    if (!currentPiece || gameOver || isPaused) return false;
    
    if (!collide(currentPiece, board, dx, dy)) {
        currentPiece.x += dx;
        currentPiece.y += dy;
        if (dx !== 0) {
            soundManager.playMove();
        }
        return true;
    }
    return false;
}

// Drop piece
function dropPiece() {
    if (!currentPiece || gameOver || isPaused) return;
    
    if (!movePiece(0, 1)) {
        mergePiece();
        clearLines();
        currentPiece = createPiece();
        
        // Check game over
        if (collide(currentPiece, board)) {
            gameOver = true;
            saveHighScore();
            gameOverElement.classList.remove('hidden');
            finalScoreElement.textContent = score;
            if (highScoreFinalElement) {
                highScoreFinalElement.textContent = highScore;
            }
            soundManager.playGameOver();
        }
    }
}

// Pause/Resume functions
function pauseGame() {
    if (gameOver) return;
    isPaused = true;
    pauseOverlay.classList.remove('hidden');
    soundManager.playPause();
}

function resumeGame() {
    isPaused = false;
    pauseOverlay.classList.add('hidden');
    lastTime = performance.now();
}

function togglePause() {
    if (isPaused) {
        resumeGame();
    } else {
        pauseGame();
    }
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    if (gameOver) return;
    
    switch(e.key) {
        case 'p':
        case 'P':
            e.preventDefault();
            togglePause();
            break;
        case 'ArrowLeft':
            if (!isPaused) {
                e.preventDefault();
                movePiece(-1, 0);
            }
            break;
        case 'ArrowRight':
            if (!isPaused) {
                e.preventDefault();
                movePiece(1, 0);
            }
            break;
        case 'ArrowDown':
            if (!isPaused) {
                e.preventDefault();
                movePiece(0, 1);
            }
            break;
        case 'ArrowUp':
        case ' ':
            if (!isPaused) {
                e.preventDefault();
                rotatePiece();
            }
            break;
    }
});

// Restart game
restartBtn.addEventListener('click', () => {
    board = createBoard();
    currentPiece = createPiece();
    score = 0;
    gameOver = false;
    isPaused = false;
    scoreElement.textContent = score;
    gameOverElement.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    dropCounter = 0;
    lastTime = 0;
    loadHighScore();
    if (highScoreElement) {
        highScoreElement.textContent = highScore;
    }
});

// Resume button
if (resumeBtn) {
    resumeBtn.addEventListener('click', resumeGame);
}

// Mute button
if (muteBtn) {
    muteBtn.addEventListener('click', () => {
        const muted = soundManager.toggleMute();
        muteBtn.textContent = muted ? '🔇 Sound' : '🔊 Sound';
    });
}

// Mobile controls
if (mobileLeft) {
    mobileLeft.addEventListener('click', () => movePiece(-1, 0));
}
if (mobileRight) {
    mobileRight.addEventListener('click', () => movePiece(1, 0));
}
if (mobileRotate) {
    mobileRotate.addEventListener('click', rotatePiece);
}
if (mobileDrop) {
    mobileDrop.addEventListener('click', () => {
        while (movePiece(0, 1)) {}
    });
}
if (mobilePause) {
    mobilePause.addEventListener('click', togglePause);
}

// Touch controls for swipe gestures
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let tapTimeout = null;

canvas.addEventListener('touchstart', (e) => {
    if (isPaused || gameOver) return;
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    
    // Set timeout for tap (if no swipe detected)
    tapTimeout = setTimeout(() => {
        rotatePiece();
    }, 300);
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    if (isPaused || gameOver) return;
    e.preventDefault();
    touchEndX = e.changedTouches[0].clientX;
    touchEndY = e.changedTouches[0].clientY;
    
    // Clear tap timeout
    if (tapTimeout) {
        clearTimeout(tapTimeout);
        tapTimeout = null;
    }
    
    handleSwipe();
}, { passive: false });

function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const minSwipeDistance = 30;

    // If swipe detected, cancel tap
    if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
        if (tapTimeout) {
            clearTimeout(tapTimeout);
            tapTimeout = null;
        }
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (deltaX > 0) {
                movePiece(1, 0);
            } else {
                movePiece(-1, 0);
            }
        } else {
            // Vertical swipe
            if (deltaY > 0) {
                // Swipe down - soft drop
                movePiece(0, 1);
            } else {
                // Swipe up - rotate
                rotatePiece();
            }
        }
    }
}

// Game loop
function gameLoop(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    
    if (!isPaused && !gameOver) {
        dropCounter += deltaTime;
        
        if (dropCounter > dropInterval) {
            dropPiece();
            dropCounter = 0;
        }
    }
    
    drawBoard();
    drawPiece();
    
    requestAnimationFrame(gameLoop);
}

// Initialize game
board = createBoard();
currentPiece = createPiece();
loadHighScore();
if (highScoreElement) {
    highScoreElement.textContent = highScore;
}
gameLoop();

