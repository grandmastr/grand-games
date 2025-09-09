import React, { useState } from 'react';
import CopilotTetris from './copilot_games/CopilotTetris';
import ElasticTetris from './elastic_games/ElasticTetris';
import SnakeGame from './components/SnakeGame';
import WaterBalloonGame from './components/WaterBalloonGame';
import TicTacToe from './components/TicTacToe';
import PongGame from './components/PongGame';

type GameType = 'menu' | 'snake' | 'tictactoe' | 'waterballoon' | 'pong' | 'copilot-tetris' | 'elastic-tetris';

export default function App() {
  const [currentGame, setCurrentGame] = useState<GameType>('menu');

  const renderGame = () => {
    switch (currentGame) {
      case 'snake':
        return <SnakeGame />;
      case 'tictactoe':
        return <TicTacToe />;
      case 'waterballoon':
        return <WaterBalloonGame />;
      case 'pong':
        return <PongGame />;
      case 'copilot-tetris':
        return <CopilotTetris />;
      case 'elastic-tetris':
        return <ElasticTetris />;
      default:
        return (
          <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ 
              fontSize: '3rem', 
              marginBottom: '2rem', 
              background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundSize: '300% 300%',
              animation: 'gradient 3s ease infinite'
            }}>
              🎮 Game Collection 🎮
            </h1>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '3rem'
            }}>
              <GameCard
                title="🐍 Snake Game"
                description="Classic snake game with arrow key controls"
                onClick={() => setCurrentGame('snake')}
                gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              />
              <GameCard
                title="⭕ Tic Tac Toe"
                description="Classic 3x3 strategy game"
                onClick={() => setCurrentGame('tictactoe')}
                gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
              />
              <GameCard
                title="💧 Water Balloon"
                description="Shoot water balloons at targets"
                onClick={() => setCurrentGame('waterballoon')}
                gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
              />
              <GameCard
                title="🏓 Pong Game"
                description="Classic arcade game vs AI"
                onClick={() => setCurrentGame('pong')}
                gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              />
              <GameCard
                title="🧩 Copilot Tetris"
                description="Feature-rich Tetris with scoring"
                onClick={() => setCurrentGame('copilot-tetris')}
                gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
              />
              <GameCard
                title="🔥 Elastic Tetris"
                description="Modern Tetris implementation"
                onClick={() => setCurrentGame('elastic-tetris')}
                gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
              />
            </div>

            <div style={{ 
              fontSize: '1.1rem', 
              color: '#666',
              lineHeight: '1.6'
            }}>
              <p>Welcome to our collection of classic games! Choose any game above to start playing.</p>
              <p>Each game includes keyboard controls and scoring systems.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .game-card {
          transition: all 0.3s ease;
          transform: translateY(0);
        }
        
        .game-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
      `}</style>
      
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '40px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        {currentGame !== 'menu' && (
          <button
            onClick={() => setCurrentGame('menu')}
            style={{
              marginBottom: '20px',
              padding: '10px 20px',
              backgroundColor: '#6c5ce7',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#5a4fcf';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#6c5ce7';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ← Back to Menu
          </button>
        )}
        
        {renderGame()}
      </div>
    </div>
  );
}

interface GameCardProps {
  title: string;
  description: string;
  onClick: () => void;
  gradient: string;
}

function GameCard({ title, description, onClick, gradient }: GameCardProps) {
  return (
    <div
      className="game-card"
      onClick={onClick}
      style={{
        background: gradient,
        borderRadius: '15px',
        padding: '25px',
        cursor: 'pointer',
        color: 'white',
        textAlign: 'center',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}
    >
      <h3 style={{ 
        margin: '0 0 10px 0', 
        fontSize: '1.3rem',
        fontWeight: 'bold'
      }}>
        {title}
      </h3>
      <p style={{ 
        margin: 0, 
        fontSize: '0.9rem',
        opacity: 0.9,
        lineHeight: '1.4'
      }}>
        {description}
      </p>
    </div>
  );
}
