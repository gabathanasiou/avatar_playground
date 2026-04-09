import React, { useState, useEffect, useRef } from 'react';
import { Avatar } from './Avatar';
import type { Expression } from './types';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GameWorld } from './components/GameWorld';
import './index.css';

function App() {
  const [mode, setMode] = useState<'game' | 'lab'>('lab'); // Default to lab to preserve user's work
  const [gameState, setGameState] = useState<'welcome' | 'playing'>('welcome');
  const [playerName, setPlayerName] = useState('PlayerOne');

  // --- LAB STATE (Original VTuber Logic) ---
  const [seed, setSeed] = useState('MyAvatar');
  const [expression, setExpression] = useState<Expression>('NEUTRAL');
  const [direction, setDirection] = useState<'front' | 'left' | 'right' | 'back'>('front');
  const [walking, setWalking] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [volume, setVolume] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number>();
  const smoothedVolumeRef = useRef(0);

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      analyserRef.current = analyser;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;
      setIsMicActive(true);
      processAudio();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopMic = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    streamRef.current = null;
    audioContextRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
    setIsMicActive(false);
    setVolume(0);
  };

  const processAudio = () => {
    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        let val = (dataArray[i] - 128) / 128;
        sum += val * val;
    }
    let rms = Math.sqrt(sum / dataArray.length);
    const targetVolume = rms > 0.015 ? Math.min(rms * 6, 1.0) : 0;
    smoothedVolumeRef.current += (targetVolume - smoothedVolumeRef.current) * 0.25;
    setVolume(smoothedVolumeRef.current);
    requestRef.current = requestAnimationFrame(processAudio);
  };

  const startGame = (name: string) => {
    setPlayerName(name);
    setGameState('playing');
  };

  useEffect(() => {
    return () => stopMic();
  }, []);

  return (
    <div className="app">
      {/* Mode Switcher */}
      <div className="mode-toggle">
        <button className={mode === 'lab' ? 'active' : ''} onClick={() => setMode('lab')}>🧪 Lab</button>
        <button className={mode === 'game' ? 'active' : ''} onClick={() => setMode('game')}>🎮 World</button>
      </div>

      {mode === 'game' ? (
        gameState === 'welcome' ? (
          <WelcomeScreen onStart={startGame} />
        ) : (
          <GameWorld playerName={playerName} />
        )
      ) : (
        /* ORIGINAL LAB UI */
        <div className="app-container">
          <div className="flex-1 w-full max-w-md flex justify-center items-center" style={{minHeight: '300px'}}>
             <Avatar 
               seed={seed} 
               size={300} 
               expression={expression} 
               speaking={volume > 0.02} 
               audioVolume={volume} 
               direction={direction}
               walking={walking}
             />
          </div>

          <div className="controls-panel">
            <div className="controls-header">
              <h1>Avatar Lab</h1>
              <p>Testing System for Genetics & Lip-Sync</p>
            </div>

            <div className="controls-grid">
              <div className="control-group">
                <label>Avatar Seed</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={seed} 
                  onChange={e => setSeed(e.target.value)}
                />
              </div>

              <div className="control-group">
                <label>Expression</label>
                <select 
                  className="input-field"
                  value={expression}
                  onChange={e => setExpression(e.target.value as Expression)}
                >
                  <option value="NEUTRAL">Neutral</option>
                  <option value="HAPPY">Happy</option>
                  <option value="SAD">Sad</option>
                  <option value="ANGRY">Angry</option>
                  <option value="SHOCKED">Shocked</option>
                  <option value="SMUG">Smug</option>
                  <option value="THINKING">Thinking</option>
                </select>
              </div>

              <div className="control-group">
                <label>Direction</label>
                <select 
                  className="input-field"
                  value={direction}
                  onChange={e => setDirection(e.target.value as any)}
                >
                  <option value="front">Front</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="back">Back</option>
                </select>
              </div>

              <div className="control-group" style={{flexDirection: 'row', alignItems: 'center', gap: '1rem'}}>
                 <label style={{margin: 0}}>Walking</label>
                 <input type="checkbox" style={{width: 'auto', outline: 'none'}} checked={walking} onChange={e => setWalking(e.target.checked)} />
              </div>
            </div>

            <div className="control-group" style={{marginTop: '1rem'}}>
              <button 
                className={`btn ${isMicActive ? 'danger' : ''}`}
                onClick={isMicActive ? stopMic : startMic}
              >
                <span className={`status-indicator ${isMicActive ? 'on' : ''}`}></span>
                {isMicActive ? 'Stop Microphone' : 'Start Lip Sync'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
