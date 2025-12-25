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
let gameOver = false;
let dropCounter = 0;
let dropInterval = 1000; // milliseconds
let lastTime = 0;

const canvas = document.getElementById('gameBoard');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');

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
    }
}

// Rotate piece
function rotatePiece() {
    if (!currentPiece) return;
    
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
            }
        }
    }
}

// Move piece
function movePiece(dx, dy) {
    if (!currentPiece || gameOver) return;
    
    if (!collide(currentPiece, board, dx, dy)) {
        currentPiece.x += dx;
        currentPiece.y += dy;
        return true;
    }
    return false;
}

// Drop piece
function dropPiece() {
    if (!currentPiece || gameOver) return;
    
    if (!movePiece(0, 1)) {
        mergePiece();
        clearLines();
        currentPiece = createPiece();
        
        // Check game over
        if (collide(currentPiece, board)) {
            gameOver = true;
            gameOverElement.classList.remove('hidden');
            finalScoreElement.textContent = score;
        }
    }
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    if (gameOver) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            e.preventDefault();
            movePiece(1, 0);
            break;
        case 'ArrowDown':
            e.preventDefault();
            movePiece(0, 1);
            break;
        case 'ArrowUp':
        case ' ':
            e.preventDefault();
            rotatePiece();
            break;
    }
});

// Restart game
restartBtn.addEventListener('click', () => {
    board = createBoard();
    currentPiece = createPiece();
    score = 0;
    gameOver = false;
    scoreElement.textContent = score;
    gameOverElement.classList.add('hidden');
    dropCounter = 0;
    lastTime = 0;
});

// Game loop
function gameLoop(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    
    dropCounter += deltaTime;
    
    if (dropCounter > dropInterval) {
        dropPiece();
        dropCounter = 0;
    }
    
    drawBoard();
    drawPiece();
    
    requestAnimationFrame(gameLoop);
}

// Initialize game
board = createBoard();
currentPiece = createPiece();
gameLoop();

