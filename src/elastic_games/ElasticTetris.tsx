import React, { useEffect, useState, useRef, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface Tetromino {
  shape: number[][];
  color: string;
  position: Position;
}

// Tetromino shapes
const TETROMINOES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: '#00f0f0'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#f0f000'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#a000f0'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: '#00f000'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: '#f00000'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#0000f0'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#f0a000'
  }
};

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 30;

const createEmptyBoard = (): (string | null)[][] => {
  return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
};

const getRandomTetromino = (): Tetromino => {
  const tetrominoKeys = Object.keys(TETROMINOES) as (keyof typeof TETROMINOES)[];
  const randomKey = tetrominoKeys[Math.floor(Math.random() * tetrominoKeys.length)];
  const tetromino = TETROMINOES[randomKey];
  
  return {
    shape: tetromino.shape,
    color: tetromino.color,
    position: { x: Math.floor(BOARD_WIDTH / 2) - Math.floor(tetromino.shape[0].length / 2), y: 0 }
  };
};

const rotateTetromino = (shape: number[][]): number[][] => {
  const rotated = shape[0].map((_, index) =>
    shape.map(row => row[index]).reverse()
  );
  return rotated;
};

export default function ElasticTetris() {
  const [board, setBoard] = useState<(string | null)[][]>(createEmptyBoard);
  const [currentTetromino, setCurrentTetromino] = useState<Tetromino>(getRandomTetromino);
  const [nextTetromino, setNextTetromino] = useState<Tetromino>(getRandomTetromino);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const isValidPosition = useCallback((tetromino: Tetromino, board: (string | null)[][]): boolean => {
    for (let y = 0; y < tetromino.shape.length; y++) {
      for (let x = 0; x < tetromino.shape[y].length; x++) {
        if (tetromino.shape[y][x]) {
          const newX = tetromino.position.x + x;
          const newY = tetromino.position.y + y;
          
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return false;
          }
          
          if (newY >= 0 && board[newY][newX]) {
            return false;
          }
        }
      }
    }
    return true;
  }, []);

  const placeTetromino = useCallback((tetromino: Tetromino, board: (string | null)[][]): (string | null)[][] => {
    const newBoard = board.map(row => [...row]);
    
    for (let y = 0; y < tetromino.shape.length; y++) {
      for (let x = 0; x < tetromino.shape[y].length; x++) {
        if (tetromino.shape[y][x]) {
          const boardY = tetromino.position.y + y;
          const boardX = tetromino.position.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = tetromino.color;
          }
        }
      }
    }
    
    return newBoard;
  }, []);

  const clearLines = useCallback((board: (string | null)[][]): { newBoard: (string | null)[][], linesCleared: number } => {
    const linesToClear: number[] = [];
    
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      if (board[y].every(cell => cell !== null)) {
        linesToClear.push(y);
      }
    }
    
    if (linesToClear.length === 0) {
      return { newBoard: board, linesCleared: 0 };
    }
    
    const newBoard = board.filter((_, index) => !linesToClear.includes(index));
    
    // Add empty lines at the top
    for (let i = 0; i < linesToClear.length; i++) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(null));
    }
    
    return { newBoard, linesCleared: linesToClear.length };
  }, []);

  const moveTetromino = useCallback((direction: 'left' | 'right' | 'down'): boolean => {
    if (gameOver || isPaused) return false;
    
    const newPosition = { ...currentTetromino.position };
    
    switch (direction) {
      case 'left':
        newPosition.x -= 1;
        break;
      case 'right':
        newPosition.x += 1;
        break;
      case 'down':
        newPosition.y += 1;
        break;
    }
    
    const newTetromino = { ...currentTetromino, position: newPosition };
    
    if (isValidPosition(newTetromino, board)) {
      setCurrentTetromino(newTetromino);
      return true;
    }
    
    return false;
  }, [currentTetromino, board, isValidPosition, gameOver, isPaused]);

  const rotatePiece = useCallback(() => {
    if (gameOver || isPaused) return;
    
    const rotatedShape = rotateTetromino(currentTetromino.shape);
    const rotatedTetromino = { ...currentTetromino, shape: rotatedShape };
    
    if (isValidPosition(rotatedTetromino, board)) {
      setCurrentTetromino(rotatedTetromino);
    }
  }, [currentTetromino, board, isValidPosition, gameOver, isPaused]);

  const dropTetromino = useCallback(() => {
    if (gameOver || isPaused) return;
    
    let newTetromino = { ...currentTetromino };
    
    while (isValidPosition({ ...newTetromino, position: { ...newTetromino.position, y: newTetromino.position.y + 1 } }, board)) {
      newTetromino.position.y += 1;
    }
    
    setCurrentTetromino(newTetromino);
  }, [currentTetromino, board, isValidPosition, gameOver, isPaused]);

  const gameLoop = useCallback(() => {
    if (gameOver || isPaused) return;
    
    const canMoveDown = moveTetromino('down');
    
    if (!canMoveDown) {
      // Place the tetromino on the board
      const newBoard = placeTetromino(currentTetromino, board);
      
      // Check for game over
      if (currentTetromino.position.y <= 0) {
        setGameOver(true);
        return;
      }
      
      // Clear completed lines
      const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);
      setBoard(clearedBoard);
      
      // Update score and lines
      if (linesCleared > 0) {
        const points = [0, 40, 100, 300, 1200][linesCleared] * level;
        setScore(prev => prev + points);
        setLines(prev => prev + linesCleared);
        setLevel(Math.floor(lines / 10) + 1);
      }
      
      // Spawn new tetromino
      setCurrentTetromino(nextTetromino);
      setNextTetromino(getRandomTetromino());
    }
  }, [currentTetromino, board, nextTetromino, level, lines, moveTetromino, placeTetromino, clearLines, gameOver, isPaused]);

  // Game loop effect
  useEffect(() => {
    if (gameOver || isPaused) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      return;
    }
    
    const speed = Math.max(50, 1000 - (level - 1) * 100);
    gameLoopRef.current = setInterval(gameLoop, speed);
    
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameLoop, level, gameOver, isPaused]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          moveTetromino('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveTetromino('right');
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveTetromino('down');
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotatePiece();
          break;
        case ' ':
          e.preventDefault();
          dropTetromino();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          setIsPaused(prev => !prev);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [moveTetromino, rotatePiece, dropTetromino, gameOver]);

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setCurrentTetromino(getRandomTetromino());
    setNextTetromino(getRandomTetromino());
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
  };

  // Render the board with current tetromino
  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    
    // Add current tetromino to display board
    if (!gameOver) {
      for (let y = 0; y < currentTetromino.shape.length; y++) {
        for (let x = 0; x < currentTetromino.shape[y].length; x++) {
          if (currentTetromino.shape[y][x]) {
            const boardY = currentTetromino.position.y + y;
            const boardX = currentTetromino.position.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentTetromino.color;
            }
          }
        }
      }
    }
    
    return displayBoard.map((row, y) =>
      row.map((cell, x) => (
        <div
          key={`${x}-${y}`}
          style={{
            width: CELL_SIZE,
            height: CELL_SIZE,
            backgroundColor: cell || '#000',
            border: '1px solid #333',
            boxSizing: 'border-box'
          }}
        />
      ))
    );
  };

  const renderNextTetromino = () => {
    return nextTetromino.shape.map((row, y) =>
      row.map((cell, x) => (
        <div
          key={`next-${x}-${y}`}
          style={{
            width: 20,
            height: 20,
            backgroundColor: cell ? nextTetromino.color : 'transparent',
            border: cell ? '1px solid #333' : 'none',
            boxSizing: 'border-box'
          }}
        />
      ))
    );
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'flex-start', 
      gap: '20px',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div>
        <h2 style={{ textAlign: 'center', margin: '0 0 20px 0' }}>Elastic Tetris</h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)`,
          gap: '0',
          border: '2px solid #fff',
          backgroundColor: '#000'
        }}>
          {renderBoard()}
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>Controls:</strong><br />
            ← → ↓ Move | ↑ Rotate | Space Drop | P Pause
          </div>
          
          {gameOver && (
            <div>
              <h3 style={{ color: 'red', margin: '10px 0' }}>Game Over!</h3>
              <button 
                onClick={resetGame}
                style={{
                  padding: '10px 20px',
                  fontSize: '16px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Play Again
              </button>
            </div>
          )}
          
          {isPaused && !gameOver && (
            <h3 style={{ color: 'orange', margin: '10px 0' }}>Paused</h3>
          )}
        </div>
      </div>
      
      <div style={{ 
        backgroundColor: '#f0f0f0', 
        padding: '20px', 
        borderRadius: '8px',
        minWidth: '150px'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Score</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{score}</div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Lines</h3>
          <div style={{ fontSize: '18px' }}>{lines}</div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Level</h3>
          <div style={{ fontSize: '18px' }}>{level}</div>
        </div>
        
        <div>
          <h3 style={{ margin: '0 0 10px 0' }}>Next</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 20px)',
            gap: '0',
            justifyContent: 'center'
          }}>
            {renderNextTetromino()}
          </div>
        </div>
      </div>
    </div>
  );
}
