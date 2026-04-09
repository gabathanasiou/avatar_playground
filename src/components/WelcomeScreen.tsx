import React, { useState } from 'react';

interface WelcomeScreenProps {
    onStart: (name: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
    const [name, setName] = useState('Explorer');

    return (
        <div className="welcome-screen">
            <div className="welcome-card">
                <h1>Small World</h1>
                <p>Enter your name to begin your journey</p>
                <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="input-field"
                    placeholder="Enter name..."
                    maxLength={12}
                />
                <button className="btn" onClick={() => onStart(name)}>
                    Start Adventure
                </button>
            </div>
            <style>{`
                .welcome-screen {
                    width: 100%;
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                }
                .welcome-card {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    padding: 3rem;
                    border-radius: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    text-align: center;
                    width: 100%;
                    max-width: 400px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                }
                .welcome-card h1 {
                    font-size: 2.5rem;
                    margin-bottom: 0.5rem;
                    background: linear-gradient(to right, #4facfe 0%, #00f2fe 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .welcome-card p {
                    color: rgba(255, 255, 255, 0.6);
                    margin-bottom: 2rem;
                }
                .input-field {
                    width: 100%;
                    padding: 12px;
                    margin-bottom: 1.5rem;
                    background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px;
                    color: white;
                    text-align: center;
                    font-size: 1.1rem;
                }
            `}</style>
        </div>
    );
};
