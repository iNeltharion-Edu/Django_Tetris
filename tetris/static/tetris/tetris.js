const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

context.scale(BLOCK_SIZE, BLOCK_SIZE);

const board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

const shapes = [
    [[0, 1, 0], [1, 1, 1]],  // T
    [[1, 1, 1, 1]],          // I
    [[1, 1], [1, 1]],        // O
    [[1, 0, 0], [1, 1, 1]],  // L
    [[0, 0, 1], [1, 1, 1]],  // J
    [[1, 1, 0], [0, 1, 1]],  // Z
    [[0, 1, 1], [1, 1, 0]]   // S
];

let currentPiece = shapes[Math.floor(Math.random() * shapes.length)];
let currentPosition = { x: COLS / 2 - 1, y: 0 };

function drawPiece(piece, offset) {
    piece.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                context.fillStyle = 'blue';
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function drawBoard() {
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                context.fillStyle = 'red';
                context.fillRect(x, y, 1, 1);
            }
        });
    });
}

function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawPiece(currentPiece, currentPosition);
}

function movePiece(dir) {
    currentPosition.x += dir;
    if (collide()) {
        currentPosition.x -= dir;
    }
}

function rotatePiece() {
    const rotated = currentPiece[0].map((_, i) => currentPiece.map(row => row[i])).reverse();
    const prevPiece = currentPiece;
    currentPiece = rotated;
    if (collide()) {
        currentPiece = prevPiece;
    }
}

function collide() {
    for (let y = 0; y < currentPiece.length; y++) {
        for (let x = 0; x < currentPiece[y].length; x++) {
            if (currentPiece[y][x] && (board[y + currentPosition.y] && board[y + currentPosition.y][x + currentPosition.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function dropPiece() {
    currentPosition.y++;
    if (collide()) {
        currentPosition.y--;
        mergePiece();
        clearLines();
        currentPiece = shapes[Math.floor(Math.random() * shapes.length)];
        currentPosition = { x: COLS / 2 - 1, y: 0 };
        if (collide()) {
            alert('Game Over!');
            board.forEach(row => row.fill(0));
        }
    }
}

function mergePiece() {
    currentPiece.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[y + currentPosition.y][x + currentPosition.x] = value;
            }
        });
    });
}

function clearLines() {
    for (let y = board.length - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
        }
    }
}

document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
        movePiece(-1);
    } else if (event.key === 'ArrowRight') {
        movePiece(1);
    } else if (event.key === 'ArrowDown') {
        dropPiece();
    } else if (event.key === 'ArrowUp') {
        rotatePiece();
    }
    draw();
});

setInterval(dropPiece, 1000);
setInterval(draw, 50);