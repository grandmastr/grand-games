import { useEffect, useRef, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { format } from 'date-fns';
import { LOG_VIEWER_CONFIG } from '../config';
import './LogViewer.css';

const LogRow = ({ index, style, data }) => {
  const log = data[index];
  if (!log) {
    return (
      <div style={style} className="log-row">
        <span className="log-message">Loading...</span>
      </div>
    );
  }

  return (
    <div style={style} className="log-row">
      <span className="log-timestamp">
        {format(log.timestamp, 'HH:mm:ss.SSS')}
      </span>
      <span className={`log-level log-level-${log.level}`}>
        {log.level}
      </span>
      <span className="log-source">{log.source}</span>
      <span className="log-message">{log.message}</span>
    </div>
  );
};

function LogViewer() {
  const [logs, setLogs] = useState(() => new Array(LOG_VIEWER_CONFIG.TOTAL_LOGS).fill(null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const workerRef = useRef(null);
  const loadedBatchesRef = useRef(new Set());

  useEffect(() => {
    console.log('LogViewer mounted');
    let mounted = true;

    const initializeWorker = () => {
      try {
        console.log('Creating Web Worker...');
        const worker = new Worker(new URL('../workers/logGenerator.js', import.meta.url), {
          type: 'module'
        });
        
        console.log('Worker created, setting up message handlers...');
        
        worker.onmessage = (e) => {
          if (!mounted) return;
          
          const { logs: newLogs, startIndex } = e.data;
          console.log(`Received ${newLogs?.length || 0} logs starting at index ${startIndex}`);
          
          setLogs(prevLogs => {
            const updatedLogs = [...prevLogs];
            newLogs.forEach((log, i) => {
              updatedLogs[startIndex + i] = log;
            });
            return updatedLogs;
          });
          
          setLoading(false);
        };

        worker.onerror = (error) => {
          console.error('Worker error:', error);
          if (mounted) {
            setError(`Worker error: ${error.message}`);
            setLoading(false);
          }
        };

        workerRef.current = worker;
        console.log('Worker initialized, requesting first batch...');
        
        // Request first batch immediately
        requestAnimationFrame(() => {
          loadMoreLogs(0);
        });
      } catch (err) {
        console.error('Failed to initialize worker:', err);
        if (mounted) {
          setError(`Failed to initialize worker: ${err.message}`);
          setLoading(false);
        }
      }
    };

    initializeWorker();

    return () => {
      console.log('LogViewer unmounting...');
      mounted = false;
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const loadMoreLogs = (startIndex) => {
    if (!workerRef.current) {
      console.error('Worker not initialized');
      return;
    }

    const batchIndex = Math.floor(startIndex / LOG_VIEWER_CONFIG.BATCH_SIZE);
    if (
      startIndex >= LOG_VIEWER_CONFIG.TOTAL_LOGS ||
      loadedBatchesRef.current.has(batchIndex)
    ) {
      return;
    }

    console.log(`Requesting batch ${batchIndex} (startIndex: ${startIndex})`);
    loadedBatchesRef.current.add(batchIndex);
    
    workerRef.current.postMessage({
      batchSize: LOG_VIEWER_CONFIG.BATCH_SIZE,
      startIndex
    });
  };

  const onItemsRendered = ({ visibleStartIndex, visibleStopIndex }) => {
    const currentBatchStart = Math.floor(visibleStartIndex / LOG_VIEWER_CONFIG.BATCH_SIZE) * LOG_VIEWER_CONFIG.BATCH_SIZE;
    loadMoreLogs(currentBatchStart);

    const nextBatchStart = currentBatchStart + LOG_VIEWER_CONFIG.BATCH_SIZE;
    loadMoreLogs(nextBatchStart);
  };

  if (error) {
    return (
      <div className="log-viewer error">
        <div className="error-message">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="log-viewer">
      <div className="log-viewer-header">
        <h1>Log Viewer</h1>
        <p>Total entries: {LOG_VIEWER_CONFIG.TOTAL_LOGS.toLocaleString()}</p>
        <p>Loaded entries: {logs.filter(Boolean).length.toLocaleString()}</p>
      </div>
      
      <div className="log-viewer-content">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading logs...</p>
          </div>
        ) : (
          <List
            height={window.innerHeight - LOG_VIEWER_CONFIG.HEADER_HEIGHT}
            itemCount={LOG_VIEWER_CONFIG.TOTAL_LOGS}
            itemSize={LOG_VIEWER_CONFIG.ROW_HEIGHT}
            width="100%"
            onItemsRendered={onItemsRendered}
            itemData={logs}
            overscanCount={LOG_VIEWER_CONFIG.BATCH_SIZE}
          >
            {LogRow}
          </List>
        )}
      </div>
    </div>
  );
}

export default LogViewer;
