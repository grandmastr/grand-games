import React, { useEffect, useState, useRef, useCallback } from 'react';
import './PongGame.css';

interface Position {
  x: number;
  y: number;
}

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 12;
const PADDLE_SPEED = 8;
const INITIAL_BALL_SPEED = 5;

export default function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [winner, setWinner] = useState<string>('');
  
  // Game state
  const [ball, setBall] = useState<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    dx: INITIAL_BALL_SPEED,
    dy: INITIAL_BALL_SPEED
  });
  
  const [playerPaddle, setPlayerPaddle] = useState<Paddle>({
    x: 20,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT
  });
  
  const [aiPaddle, setAiPaddle] = useState<Paddle>({
    x: CANVAS_WIDTH - 35,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT
  });

  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key]: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Move player paddle
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const movePlayer = () => {
      setPlayerPaddle(prev => {
        let newY = prev.y;
        
        if (keys['ArrowUp'] && newY > 0) {
          newY -= PADDLE_SPEED;
        }
        if (keys['ArrowDown'] && newY < CANVAS_HEIGHT - PADDLE_HEIGHT) {
          newY += PADDLE_SPEED;
        }
        
        return { ...prev, y: Math.max(0, Math.min(newY, CANVAS_HEIGHT - PADDLE_HEIGHT)) };
      });
    };

    const interval = setInterval(movePlayer, 16);
    return () => clearInterval(interval);
  }, [keys, gameStarted, gameOver]);

  // AI paddle movement
  const moveAI = useCallback(() => {
    setAiPaddle(prev => {
      const paddleCenter = prev.y + PADDLE_HEIGHT / 2;
      const ballY = ball.y;
      
      let newY = prev.y;
      const aiSpeed = PADDLE_SPEED * 0.85; // Make AI slightly slower
      
      if (paddleCenter < ballY - 10) {
        newY += aiSpeed;
      } else if (paddleCenter > ballY + 10) {
        newY -= aiSpeed;
      }
      
      return { ...prev, y: Math.max(0, Math.min(newY, CANVAS_HEIGHT - PADDLE_HEIGHT)) };
    });
  }, [ball.y]);

  // Ball physics and collision detection
  const updateBall = useCallback(() => {
    setBall(prevBall => {
      let newBall = { ...prevBall };
      
      // Move ball
      newBall.x += newBall.dx;
      newBall.y += newBall.dy;
      
      // Bounce off top and bottom walls
      if (newBall.y <= 0 || newBall.y >= CANVAS_HEIGHT - BALL_SIZE) {
        newBall.dy = -newBall.dy;
        newBall.y = Math.max(0, Math.min(newBall.y, CANVAS_HEIGHT - BALL_SIZE));
      }
      
      // Check paddle collisions
      // Player paddle collision
      if (
        newBall.x <= playerPaddle.x + playerPaddle.width &&
        newBall.x + BALL_SIZE >= playerPaddle.x &&
        newBall.y <= playerPaddle.y + playerPaddle.height &&
        newBall.y + BALL_SIZE >= playerPaddle.y &&
        newBall.dx < 0
      ) {
        newBall.dx = -newBall.dx;
        // Add some angle based on where ball hits paddle
        const hitPos = (newBall.y - playerPaddle.y) / playerPaddle.height;
        newBall.dy = (hitPos - 0.5) * 8;
        newBall.x = playerPaddle.x + playerPaddle.width;
      }
      
      // AI paddle collision
      if (
        newBall.x + BALL_SIZE >= aiPaddle.x &&
        newBall.x <= aiPaddle.x + aiPaddle.width &&
        newBall.y <= aiPaddle.y + aiPaddle.height &&
        newBall.y + BALL_SIZE >= aiPaddle.y &&
        newBall.dx > 0
      ) {
        newBall.dx = -newBall.dx;
        const hitPos = (newBall.y - aiPaddle.y) / aiPaddle.height;
        newBall.dy = (hitPos - 0.5) * 8;
        newBall.x = aiPaddle.x - BALL_SIZE;
      }
      
      // Check for scoring
      if (newBall.x < 0) {
        // AI scores
        setAiScore(prev => prev + 1);
        return {
          x: CANVAS_WIDTH / 2,
          y: CANVAS_HEIGHT / 2,
          dx: INITIAL_BALL_SPEED,
          dy: Math.random() > 0.5 ? INITIAL_BALL_SPEED : -INITIAL_BALL_SPEED
        };
      } else if (newBall.x > CANVAS_WIDTH) {
        // Player scores
        setPlayerScore(prev => prev + 1);
        return {
          x: CANVAS_WIDTH / 2,
          y: CANVAS_HEIGHT / 2,
          dx: -INITIAL_BALL_SPEED,
          dy: Math.random() > 0.5 ? INITIAL_BALL_SPEED : -INITIAL_BALL_SPEED
        };
      }
      
      return newBall;
    });
  }, [playerPaddle, aiPaddle]);

  // Main game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = () => {
      updateBall();
      moveAI();
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameStarted, gameOver, updateBall, moveAI]);

  // Check for game end
  useEffect(() => {
    if (playerScore >= 5) {
      setWinner('Player');
      setGameOver(true);
    } else if (aiScore >= 5) {
      setWinner('AI');
      setGameOver(true);
    }
  }, [playerScore, aiScore]);

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw center line
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    if (gameStarted) {
      // Draw paddles
      ctx.fillStyle = '#fff';
      ctx.fillRect(playerPaddle.x, playerPaddle.y, playerPaddle.width, playerPaddle.height);
      ctx.fillRect(aiPaddle.x, aiPaddle.y, aiPaddle.width, aiPaddle.height);

      // Draw ball
      ctx.fillStyle = '#fff';
      ctx.fillRect(ball.x, ball.y, BALL_SIZE, BALL_SIZE);
    }

    // Draw scores
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(playerScore.toString(), CANVAS_WIDTH / 4, 60);
    ctx.fillText(aiScore.toString(), (3 * CANVAS_WIDTH) / 4, 60);

    if (!gameStarted) {
      ctx.fillStyle = '#fff';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Press SPACE to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.font = '16px Arial';
      ctx.fillText('Use ↑ ↓ arrow keys to move', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    }

    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = winner === 'Player' ? '#4CAF50' : '#f44336';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${winner} Wins!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.fillStyle = '#fff';
      ctx.font = '24px Arial';
      ctx.fillText('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    }
  }, [gameStarted, gameOver, ball, playerPaddle, aiPaddle, playerScore, aiScore, winner]);

  // Handle game controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ' && !gameStarted && !gameOver) {
        setGameStarted(true);
      } else if (e.key.toLowerCase() === 'r' && gameOver) {
        resetGame();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, gameOver]);

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setPlayerScore(0);
    setAiScore(0);
    setWinner('');
    setBall({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      dx: INITIAL_BALL_SPEED,
      dy: INITIAL_BALL_SPEED
    });
    setPlayerPaddle({
      x: 20,
      y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT
    });
    setAiPaddle({
      x: CANVAS_WIDTH - 35,
      y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT
    });
  };

  return (
    <div className="pong-game-container">
      <h2>Pong Game</h2>
      
      <div className="pong-info">
        <div className="score-info">
          <div>Player: {playerScore}</div>
          <div>AI: {aiScore}</div>
        </div>
        <div className="game-info">
          First to 5 points wins!
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="pong-canvas"
      />

      <div className="pong-controls">
        <h3>Controls:</h3>
        <p>↑ ↓ Arrow keys to move your paddle</p>
        <p>SPACE to start game</p>
        <p>R to restart after game over</p>
      </div>

      {!gameStarted && !gameOver && (
        <button 
          onClick={() => setGameStarted(true)}
          className="start-button"
        >
          Start Game
        </button>
      )}

      {gameOver && (
        <button 
          onClick={resetGame}
          className="restart-button"
        >
          Play Again
        </button>
      )}
    </div>
  );
}
