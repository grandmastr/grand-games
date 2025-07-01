import React from 'react';
import CopilotTetris from './copilot_games/CopilotTetris';
import ElasticTetris from './elastic_games/ElasticTetris';

export default function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>Game Collection</h1>
      
      <div style={{ marginBottom: '60px' }}>
        <ElasticTetris />
      </div>
      
      <div style={{ borderTop: '2px solid #ccc', paddingTop: '40px' }}>
        <CopilotTetris />
      </div>
    </div>
  );
}
