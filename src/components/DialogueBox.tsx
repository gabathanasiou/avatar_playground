import React, { useState, useEffect, useRef } from 'react';

interface DialogueBoxProps {
    text: string;
    onComplete?: () => void;
    speakerName?: string;
    isLastPage?: boolean;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({ text, onComplete, speakerName, isLastPage }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isFinished, setIsFinished] = useState(false);
    const textRef = useRef(text);

    useEffect(() => {
        // Reset state on text change
        setDisplayedText('');
        setIsFinished(false);
        textRef.current = text;
        
        let currentIndex = 0;
        let animatedText = '';
        
        const interval = setInterval(() => {
            if (currentIndex < text.length) {
                // Use a local string bit to avoid doubling from overlapping state updates
                animatedText += text[currentIndex];
                setDisplayedText(animatedText);
                currentIndex++;
            } else {
                setIsFinished(true);
                clearInterval(interval);
                // We don't call onComplete here anymore; it's called by GameWorld interaction 
                // but we keep it available if needed for auto-advance in the future.
            }
        }, 30);

        return () => {
            clearInterval(interval);
        };
    }, [text, onComplete]);

    return (
        <div className="pokemon-dialogue-container">
            {speakerName && <div className="speaker-name-tag">{speakerName}</div>}
            <div className="pokemon-dialogue-content">
                <p style={{ minHeight: '3.6em', maxHeight: '3.6em', overflow: 'hidden' }}>{displayedText}</p>
                {isFinished && <div className="dialogue-arrow">{isLastPage ? '×' : '▼'}</div>}
            </div>
        </div>
    );
};
