import React, { useEffect, useState, useCallback, useRef } from 'react';
import './CopilotTetris.css';

interface Position {
  x: number;
  y: number;
}

interface TetrominoShape {
  shape: number[][];
  color: string;
}

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 30;

// Tetromino shapes
const TETROMINOES: TetrominoShape[] = [
  {
    // I-piece
    shape: [
      [1, 1, 1, 1]
    ],
    color: '#00f0f0'
  },
  {
    // O-piece
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#f0f000'
  },
  {
    // T-piece
    shape: [
      [0, 1, 0],
      [1, 1, 1]
    ],
    color: '#a000f0'
  },
  {
    // S-piece
    shape: [
      [0, 1, 1],
      [1, 1, 0]
    ],
    color: '#00f000'
  },
  {
    // Z-piece
    shape: [
      [1, 1, 0],
      [0, 1, 1]
    ],
    color: '#f00000'
  },
  {
    // J-piece
    shape: [
      [1, 0, 0],
      [1, 1, 1]
    ],
    color: '#0000f0'
  },
  {
    // L-piece
    shape: [
      [0, 0, 1],
      [1, 1, 1]
    ],
    color: '#f0a000'
  }
];

interface Tetromino {
  shape: number[][];
  position: Position;
  color: string;
}

type Board = (string | null)[][];

const createEmptyBoard = (): Board => {
  return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
};

const getRandomTetromino = (): Tetromino => {
  const randomIndex = Math.floor(Math.random() * TETROMINOES.length);
  const tetromino = TETROMINOES[randomIndex];
  return {
    shape: tetromino.shape,
    position: { x: Math.floor(BOARD_WIDTH / 2) - Math.floor(tetromino.shape[0].length / 2), y: 0 },
    color: tetromino.color
  };
};

const rotateTetromino = (shape: number[][]): number[][] => {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      rotated[col][rows - 1 - row] = shape[row][col];
    }
  }
  
  return rotated;
};

const isValidPosition = (board: Board, tetromino: Tetromino): boolean => {
  for (let row = 0; row < tetromino.shape.length; row++) {
    for (let col = 0; col < tetromino.shape[row].length; col++) {
      if (tetromino.shape[row][col]) {
        const newX = tetromino.position.x + col;
        const newY = tetromino.position.y + row;
        
        if (
          newX < 0 || 
          newX >= BOARD_WIDTH || 
          newY >= BOARD_HEIGHT ||
          (newY >= 0 && board[newY][newX] !== null)
        ) {
          return false;
        }
      }
    }
  }
  return true;
};

const placeTetromino = (board: Board, tetromino: Tetromino): Board => {
  const newBoard = board.map(row => [...row]);
  
  for (let row = 0; row < tetromino.shape.length; row++) {
    for (let col = 0; col < tetromino.shape[row].length; col++) {
      if (tetromino.shape[row][col]) {
        const x = tetromino.position.x + col;
        const y = tetromino.position.y + row;
        if (y >= 0) {
          newBoard[y][x] = tetromino.color;
        }
      }
    }
  }
  
  return newBoard;
};

const clearLines = (board: Board): { newBoard: Board; linesCleared: number } => {
  const newBoard = board.filter(row => row.some(cell => cell === null));
  const linesCleared = BOARD_HEIGHT - newBoard.length;
  
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(null));
  }
  
  return { newBoard, linesCleared };
};

export default function CopilotTetris() {
  const [board, setBoard] = useState<Board>(createEmptyBoard);
  const [currentTetromino, setCurrentTetromino] = useState<Tetromino>(getRandomTetromino);
  const [nextTetromino, setNextTetromino] = useState<Tetromino>(getRandomTetromino);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const getDropInterval = useCallback(() => {
    return Math.max(100, 1000 - (level - 1) * 100);
  }, [level]);

  const moveTetromino = useCallback((dx: number, dy: number) => {
    if (gameOver || isPaused) return;
    
    const newTetromino = {
      ...currentTetromino,
      position: {
        x: currentTetromino.position.x + dx,
        y: currentTetromino.position.y + dy
      }
    };
    
    if (isValidPosition(board, newTetromino)) {
      setCurrentTetromino(newTetromino);
      return true;
    }
    return false;
  }, [board, currentTetromino, gameOver, isPaused]);

  const rotatePiece = useCallback(() => {
    if (gameOver || isPaused) return;
    
    const rotatedTetromino = {
      ...currentTetromino,
      shape: rotateTetromino(currentTetromino.shape)
    };
    
    if (isValidPosition(board, rotatedTetromino)) {
      setCurrentTetromino(rotatedTetromino);
    }
  }, [board, currentTetromino, gameOver, isPaused]);

  const dropTetromino = useCallback(() => {
    if (gameOver || isPaused) return;
    
    if (!moveTetromino(0, 1)) {
      // Can't move down, place the piece
      const newBoard = placeTetromino(board, currentTetromino);
      const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);
      
      setBoard(clearedBoard);
      setLines(prev => prev + linesCleared);
      setScore(prev => prev + linesCleared * 100 * level + 10);
      setLevel(Math.floor(lines / 10) + 1);
      
      // Check for game over
      const newTetromino = nextTetromino;
      if (!isValidPosition(clearedBoard, newTetromino)) {
        setGameOver(true);
        return;
      }
      
      setCurrentTetromino(newTetromino);
      setNextTetromino(getRandomTetromino());
    }
  }, [board, currentTetromino, nextTetromino, moveTetromino, gameOver, isPaused, level, lines]);

  const hardDrop = useCallback(() => {
    if (gameOver || isPaused) return;
    
    let newTetromino = { ...currentTetromino };
    while (isValidPosition(board, { ...newTetromino, position: { ...newTetromino.position, y: newTetromino.position.y + 1 } })) {
      newTetromino.position.y++;
    }
    setCurrentTetromino(newTetromino);
    dropTetromino();
  }, [board, currentTetromino, dropTetromino, gameOver, isPaused]);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          moveTetromino(-1, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveTetromino(1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          dropTetromino();
          break;
        case 'ArrowUp':
        case ' ':
          e.preventDefault();
          rotatePiece();
          break;
        case 'Enter':
          e.preventDefault();
          hardDrop();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          setIsPaused(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveTetromino, dropTetromino, rotatePiece, hardDrop, gameOver]);

  // Game loop
  useEffect(() => {
    if (gameOver || isPaused) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      return;
    }

    gameLoopRef.current = setInterval(() => {
      dropTetromino();
    }, getDropInterval());

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [dropTetromino, getDropInterval, gameOver, isPaused]);

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setCurrentTetromino(getRandomTetromino());
    setNextTetromino(getRandomTetromino());
    setScore(0);
    setLevel(1);
    setLines(0);
    setGameOver(false);
    setIsPaused(false);
  };

  // Create the display board with current tetromino
  const displayBoard = board.map(row => [...row]);
  for (let row = 0; row < currentTetromino.shape.length; row++) {
    for (let col = 0; col < currentTetromino.shape[row].length; col++) {
      if (currentTetromino.shape[row][col]) {
        const x = currentTetromino.position.x + col;
        const y = currentTetromino.position.y + row;
        if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
          displayBoard[y][x] = currentTetromino.color;
        }
      }
    }
  }

  return (
    <div className="tetris-container">
      <h2>Copilot Tetris</h2>
      
      <div className="tetris-game">
        <div className="game-info">
          <div className="info-panel">
            <div className="score-info">
              <p>Score: {score}</p>
              <p>Level: {level}</p>
              <p>Lines: {lines}</p>
            </div>
            
            <div className="next-piece">
              <h4>Next:</h4>
              <div className="next-tetromino">
                {nextTetromino.shape.map((row, rowIndex) => (
                  <div key={rowIndex} className="next-row">
                    {row.map((cell, colIndex) => (
                      <div
                        key={colIndex}
                        className={`next-cell ${cell ? 'filled' : ''}`}
                        style={{
                          backgroundColor: cell ? nextTetromino.color : 'transparent'
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="controls">
              <h4>Controls:</h4>
              <p>← → Move</p>
              <p>↓ Soft Drop</p>
              <p>↑ / Space: Rotate</p>
              <p>Enter: Hard Drop</p>
              <p>P: Pause</p>
            </div>
            
            <button onClick={resetGame} className="reset-button">
              New Game
            </button>
          </div>
        </div>

        <div className="game-board-container">
          <div 
            className="game-board"
            style={{
              width: BOARD_WIDTH * CELL_SIZE,
              height: BOARD_HEIGHT * CELL_SIZE
            }}
          >
            {displayBoard.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`tetris-cell ${cell ? 'filled' : ''}`}
                  style={{
                    backgroundColor: cell || '#1a1a1a',
                    border: cell ? 'none' : '1px solid #333'
                  }}
                />
              ))
            )}
          </div>
          
          {gameOver && (
            <div className="game-over">
              <h3>Game Over!</h3>
              <p>Final Score: {score}</p>
            </div>
          )}
          
          {isPaused && !gameOver && (
            <div className="paused">
              <h3>Paused</h3>
              <p>Press P to continue</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
