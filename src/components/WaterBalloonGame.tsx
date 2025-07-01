import React, { useEffect, useState, useRef, useCallback } from 'react';
import './WaterBalloonGame.css';

interface WaterBalloon {
  x: number;
  y: number;
}

interface Target {
  x: number;
  y: number;
  hit: boolean;
}

interface GameRecord {
  id: string;
  score: number;
  targetsHit: number;
  totalTargets: number;
  date: string;
  duration: number; // in seconds
}

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_PLAYER_POSITION = { x: GRID_SIZE / 2, y: GRID_SIZE - 1 };

export default function WaterBalloonGame() {
  const [balloons, setBalloons] = useState<WaterBalloon[]>([]);
  const [playerPosition, setPlayerPosition] = useState<{ x: number; y: number }>(
    INITIAL_PLAYER_POSITION
  );
  const [targets, setTargets] = useState<Target[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [gameDuration, setGameDuration] = useState<number>(0);
  const [gameRecords, setGameRecords] = useState<GameRecord[]>([]);
  const [showMemoryBank, setShowMemoryBank] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  // Load saved records from localStorage on component mount
  useEffect(() => {
    const savedRecords = localStorage.getItem('waterBalloonGameRecords');
    if (savedRecords) {
      setGameRecords(JSON.parse(savedRecords));
    }
  }, []);

  // Generate targets at the top and start game timer
  useEffect(() => {
    const initialTargets: Target[] = [];
    for (let i = 0; i < 5; i++) {
      initialTargets.push({
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * 5),
        hit: false,
      });
    }
    setTargets(initialTargets);
    setGameStartTime(Date.now());
  }, []);

  // Move balloons upwards
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setBalloons((prevBalloons) =>
        prevBalloons
          .map((balloon) => ({ x: balloon.x, y: balloon.y - 1 }))
          .filter((balloon) => balloon.y >= 0)
      );
    }, 100);
    return () => clearInterval(interval);
  }, [gameOver]);

  // Check for collisions and game completion
  useEffect(() => {
    setTargets((prevTargets) => {
      const updatedTargets = prevTargets.map((target) => {
        if (target.hit) return target;
        const hitBalloon = balloons.find(
          (balloon) => balloon.x === target.x && balloon.y === target.y
        );
        if (hitBalloon) {
          setScore((prevScore) => prevScore + 1);
          return { ...target, hit: true };
        }
        return target;
      });
      
      // Check if all targets are hit
      if (updatedTargets.every(target => target.hit) && !gameOver) {
        const endTime = Date.now();
        const duration = Math.floor((endTime - gameStartTime) / 1000);
        setGameDuration(duration);
        setGameOver(true);
        
        // Save game record
        const newRecord: GameRecord = {
          id: Date.now().toString(),
          score: score + 1, // +1 because we just incremented the score
          targetsHit: updatedTargets.length,
          totalTargets: updatedTargets.length,
          date: new Date().toLocaleDateString(),
          duration: duration
        };
        
        const updatedRecords = [...gameRecords, newRecord];
        setGameRecords(updatedRecords);
        localStorage.setItem('waterBalloonGameRecords', JSON.stringify(updatedRecords));
      }
      
      return updatedTargets;
    });
  }, [balloons, gameOver, gameRecords, gameStartTime, score]);

  // Handle key presses for player movement and shooting
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'ArrowLeft':
          setPlayerPosition((prev) => ({
            x: Math.max(prev.x - 1, 0),
            y: prev.y,
          }));
          break;
        case 'ArrowRight':
          setPlayerPosition((prev) => ({
            x: Math.min(prev.x + 1, GRID_SIZE - 1),
            y: prev.y,
          }));
          break;
        case ' ':
          // Shoot a balloon
          setBalloons((prev) => [
            ...prev,
            { x: playerPosition.x, y: playerPosition.y - 1 },
          ]);
          break;
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPosition]);

  // Render board cells
  const cells = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      let className = 'cell';
      if (playerPosition.x === x && playerPosition.y === y) {
        className = 'cell player';
      } else if (balloons.some((balloon) => balloon.x === x && balloon.y === y)) {
        className = 'cell balloon';
      } else if (
        targets.some((target) => target.x === x && target.y === y && !target.hit)
      ) {
        className = 'cell target';
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

  // Calculate stats for memory bank
  const calculateStats = useCallback(() => {
    if (gameRecords.length === 0) {
      return { bestScore: 0, bestTime: 0, totalGames: 0 };
    }
    
    const bestScore = Math.max(...gameRecords.map(record => record.score));
    const bestTime = Math.min(...gameRecords.map(record => record.duration));
    
    return {
      bestScore,
      bestTime,
      totalGames: gameRecords.length
    };
  }, [gameRecords]);
  
  // Clear all records
  const clearRecords = () => {
    setGameRecords([]);
    localStorage.removeItem('waterBalloonGameRecords');
  };

  // Reset game function
  const resetGame = () => {
    setBalloons([]);
    setPlayerPosition(INITIAL_PLAYER_POSITION);
    setScore(0);
    setGameOver(false);
    
    // Generate new targets
    const initialTargets: Target[] = [];
    for (let i = 0; i < 5; i++) {
      initialTargets.push({
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * 5),
        hit: false,
      });
    }
    setTargets(initialTargets);
    setGameStartTime(Date.now());
  };

  // Format time function (converts seconds to mm:ss format)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Water Balloon Game</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: GRID_SIZE * CELL_SIZE, margin: '0 auto' }}>
        <p>Score: {score}</p>
        <button 
          className="memory-bank-button" 
          onClick={() => setShowMemoryBank(!showMemoryBank)}
        >
          {showMemoryBank ? 'Hide Memory Bank' : 'Show Memory Bank'}
        </button>
      </div>
      
      <div
        ref={boardRef}
        style={{
          position: 'relative',
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
          margin: '0 auto',
          backgroundColor: '#87CEEB',
          display: 'flex',
          flexWrap: 'wrap',
        }}
      >
        {cells}
      </div>
      
      {gameOver && (
        <div className="game-over-container">
          <h3 style={{ color: 'green' }}>You Win!</h3>
          <p>Time: {formatTime(gameDuration)}</p>
          <button onClick={resetGame} className="reset-button">Play Again</button>
        </div>
      )}
      
      {showMemoryBank && (
        <div className="memory-bank">
          <h3>Memory Bank</h3>
          
          <div className="memory-stats">
            <div>Best Score: {calculateStats().bestScore}</div>
            <div>Best Time: {formatTime(calculateStats().bestTime)}</div>
            <div>Total Games: {calculateStats().totalGames}</div>
          </div>
          
          <div className="game-records">
            <table className="records-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Targets</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {gameRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{record.date}</td>
                    <td>{record.score}</td>
                    <td>{record.targetsHit}/{record.totalTargets}</td>
                    <td>{formatTime(record.duration)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {gameRecords.length > 0 && (
            <button onClick={clearRecords} className="clear-button">
              Clear All Records
            </button>
          )}
        </div>
      )}
    </div>
  );
}
