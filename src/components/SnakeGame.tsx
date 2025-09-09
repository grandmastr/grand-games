import React, { useEffect, useState, useRef } from 'react';
import './SnakeGame.css';

interface Coordinate {
  x: number;
  y: number;
}

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [{ x: 8, y: 8 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };

function getRandomCoordinate() {
  return {
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE),
  };
}

export default function SnakeGame() {
  const [snake, setSnake] = useState<Coordinate[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Coordinate>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Coordinate>(getRandomCoordinate);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);

  // Handle key presses for direction
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 1) return;
          setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (direction.y === -1) return;
          setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (direction.x === 1) return;
          setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (direction.x === -1) return;
          setDirection({ x: 1, y: 0 });
          break;
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [direction]);

  // Game loop
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setSnake((prevSnake) => {
        const newHead = {
          x: (prevSnake[0].x + direction.x + GRID_SIZE) % GRID_SIZE,
          y: (prevSnake[0].y + direction.y + GRID_SIZE) % GRID_SIZE,
        };

        // Check if the snake hits itself
        for (let i = 0; i < prevSnake.length; i++) {
          if (prevSnake[i].x === newHead.x && prevSnake[i].y === newHead.y) {
            setGameOver(true);
            return prevSnake;
          }
        }

        // Move snake
        const newSnake = [newHead, ...prevSnake];

        // Check if we eat the food
        if (newHead.x === food.x && newHead.y === food.y) {
          setFood(getRandomCoordinate());
          setScore(prevScore => prevScore + 10);
        } else {
          newSnake.pop(); // remove tail
        }
        return newSnake;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [direction, food, gameOver]);

  // Render board cells
  const cells: React.ReactElement[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      let className = 'cell';
      if (snake.some((segment) => segment.x === x && segment.y === y)) {
        className = 'cell snake';
      } else if (food.x === x && food.y === y) {
        className = 'cell food';
      }
      cells.push(
        <div
          key={`${x}-${y}`}
          className={className}
          style={{ width: CELL_SIZE, height: CELL_SIZE }}
        />
      );
    }
  }

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(getRandomCoordinate());
    setGameOver(false);
    setScore(0);
  };

  return (
    <div className="snake-game-container">
      <h2>Snake Game</h2>
      
      <div className="score-display">
        Score: {score} | Length: {snake.length}
      </div>
      
      <div
        ref={boardRef}
        className="snake-game-board"
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
          backgroundColor: '#2c3e50',
          display: 'flex',
          flexWrap: 'wrap',
        }}
      >
        {cells}
      </div>
      
      {gameOver && (
        <div>
          <h3 className="game-over">Game Over!</h3>
          <p>Final Score: {score}</p>
          <button
            onClick={resetGame}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Play Again
          </button>
        </div>
      )}
      
      <div className="snake-controls">
        <h3>Controls</h3>
        <p>↑ ↓ ← → Arrow keys to move</p>
        <p>Eat the red food to grow and score points!</p>
      </div>
    </div>
  );
}
