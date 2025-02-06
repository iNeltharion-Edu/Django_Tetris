const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextPieceCanvas = document.getElementById('next-piece');
const nextPieceContext = nextPieceCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const volumeElement = document.getElementById('volume');
const pauseElement = document.getElementById('pause');
const music = document.getElementById('music');
const startButton = document.getElementById('startButton');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;
const SCORE_PER_LINE = 10;

const COLORS = [
    '#67BFFA', '#FF9638', '#FFDD33', '#74C259', '#D13A3A', '#974AB4'
];

const SHAPES = [
    [[0, 1, 0], [1, 1, 1]],  // T
    [[1, 1, 1, 1]],          // I
    [[1, 1], [1, 1]],        // O
    [[1, 0, 0], [1, 1, 1]],  // L
    [[0, 0, 1], [1, 1, 1]],  // J
    [[1, 1, 0], [0, 1, 1]],  // Z
    [[0, 1, 1], [1, 1, 0]]   // S
];

let board;
let previousPieceType = null;
let currentPiece;
let nextPiece;
let currentPosition;
let score;
let isPaused;
let isGameOver;
let fallSpeed;
let volume;
let isGameStarted = false;
let gameLoop;
let timeAccumulator;
let lastTime;

function initGame() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    score = 0;
    isPaused = false;
    isGameOver = false;
    fallSpeed = 500;
    volume = 0.4;
    timeAccumulator = 0;
    lastTime = performance.now();
    scoreElement.textContent = `Score: ${score}`;
    pauseElement.textContent = `Paused: No`;
    music.volume = volume;
    updateVolumeDisplay();
    spawnPiece();
}

function updateVolumeDisplay() {
    const bars = '■■■■■'.slice(0, Math.floor(volume * 5)) + '□□□□□'.slice(0, 5 - Math.floor(volume * 5));
    volumeElement.textContent = bars;
}


function createPiece() {
    let piece;
    do {
        piece = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    } while (previousPieceType && piece === previousPieceType);

    previousPieceType = piece; // Запоминаем последний тип фигуры
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    return { shape: piece, color };
}


function drawBlock(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function drawBoard() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                drawBlock(context, x, y, board[y][x]);
            }
        }
    }
    if (currentPiece) {
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawBlock(context, currentPosition.x + x, currentPosition.y + y, currentPiece.color);
                }
            });
        });
    }
}

function drawNextPiece() {
    nextPieceContext.clearRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
    if (nextPiece) {
        nextPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawBlock(nextPieceContext, x, y, nextPiece.color);
                }
            });
        });
    }
}

function movePiece(dx, dy) {
    if (!isGameStarted || isPaused || isGameOver) return;

    currentPosition.x += dx;
    currentPosition.y += dy;
    if (collide()) {
        currentPosition.x -= dx;
        currentPosition.y -= dy;
        if (dy > 0) {
            fixPiece();
        }
    }
}

function rotatePiece() {
    if (!isGameStarted || isPaused || isGameOver) return;

    const rotated = currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[i])
    ).reverse();
    const prevShape = currentPiece.shape;
    currentPiece.shape = rotated;
    if (collide()) {
        currentPiece.shape = prevShape;
    }
}

function collide() {
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x]) {
                const nx = currentPosition.x + x;
                const ny = currentPosition.y + y;
                if (nx < 0 || nx >= COLS || ny >= ROWS || board[ny][nx]) {
                    return true;
                }
            }
        }
    }
    return false;
}

function fixPiece() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[currentPosition.y + y][currentPosition.x + x] = currentPiece.color;
            }
        });
    });
    clearLines();
    spawnPiece();
}

function clearLines() {
    let linesCleared = 0;
    const rowsToRemove = [];

    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell)) {
            rowsToRemove.push(y);
        }
    }

    rowsToRemove.forEach(y => {
        board.splice(y, 1);
    });

    for (let i = 0; i < rowsToRemove.length; i++) {
        board.unshift(Array(COLS).fill(0));
    }

    linesCleared = rowsToRemove.length;

    if (linesCleared > 0) {
        score += linesCleared * SCORE_PER_LINE;
        scoreElement.textContent = `Score: ${score}`;

        // Ускоряем падение фигур каждые 100 очков
        if (score % 100 === 0) {
            fallSpeed = Math.max(50, fallSpeed - 50); // Минимальная скорость - 50мс
        }
    }
}

function spawnPiece() {
    currentPiece = nextPiece || createPiece();
    nextPiece = createPiece();
    currentPosition = {
        x: Math.floor(COLS / 2) - Math.floor(currentPiece.shape[0].length / 2),
        y: 0
    };

    if (collide()) {
        isGameOver = true;
        startButton.style.display = 'block';
        pauseElement.textContent = 'GAME OVER';
        isGameStarted = false;
    }
    drawNextPiece();
}

function update(time = 0) {
    if (!isGameStarted) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    if (!isPaused && !isGameOver) {
        timeAccumulator += deltaTime;
        while (timeAccumulator > fallSpeed) {
            movePiece(0, 1);
            timeAccumulator -= fallSpeed;
        }
    }

    drawBoard();
    gameLoop = requestAnimationFrame(update);
}

document.addEventListener('keydown', (event) => {
    if (!isGameStarted) return;

    switch(event.key) {
        case 'ArrowLeft':
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            movePiece(1, 0);
            break;
        case 'ArrowDown':
            movePiece(0, 1);
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
        case ' ':
            isPaused = !isPaused;
            pauseElement.textContent = isPaused ? 'PAUSED' : 'PLAYING';
            break;
        case '+':
            volume = Math.min(1, volume + 0.2);
            music.volume = volume;
            updateVolumeDisplay();
            break;
        case '-':
            volume = Math.max(0, volume - 0.2);
            music.volume = volume;
            updateVolumeDisplay();
            break;
    }
});


startButton.addEventListener('click', () => {
    if (!isGameStarted) {
        music.play()
            .then(() => {
                isGameStarted = true;
                startButton.style.display = 'none';
                initGame();
                gameLoop = requestAnimationFrame(update);
            })
            .catch(error => console.error('Ошибка воспроизведения:', error));
    }
});