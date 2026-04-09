import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { Expression } from './types';

interface AvatarProps {
    seed: string;
    size?: number;
    className?: string;
    expression?: Expression;
    speaking?: boolean;
    audioVolume?: number; // 0.0 to 1.0 for smart lip sync
    direction?: 'front' | 'left' | 'right' | 'back';
    walking?: boolean;
    gazeAt?: { x: number; y: number }; // normalized -1 to 1 offset for pupils. Ignored when speaking.
    socialContext?: 'greeting' | 'chatting' | 'ambient';
}

const HAIR_COLORS = [
    '#090807', '#2C1608', '#714130', '#E6CEA8', '#A52A2A', '#DCDCDC', '#FF4081', '#3F51B5',
    '#2E7D32', '#F57F17', '#6A1B9A', '#1565C0', '#C62828', '#AD1457', '#00695C', '#5D4037'
];
const SKIN_TONES = [
    '#FFC107', '#FFB74D', '#FF8A65', '#A1887F', '#E57373', '#BA68C8', '#4DD0E1', '#81C784',
    '#FFD54F', '#90CAF9', '#A5D6A7', '#F48FB1', '#CE93D8', '#BCAAA4', '#80CBC4', '#E6EE9C'
];

export const Avatar: React.FC<AvatarProps> = ({ seed, size = 100, className = '', expression = 'NEUTRAL', speaking = false, audioVolume = 0, direction = 'front', walking = false, gazeAt, socialContext = 'ambient' }) => {
    const [blinking, setBlinking] = useState(false);
    const [gaze, setGaze] = useState({ x: 0, y: 0 });
    const [mouthState, setMouthState] = useState(0); // 0 = closed, 1 = open
    const [walkFrame, setWalkFrame] = useState(0); // 0-3 sprite frame cycle
    const containerRef = useRef<HTMLDivElement>(null);

    // --- GENETICS ---
    const features = useMemo(() => {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        }

        const getGene = (shift: number, mod: number) => Math.abs(hash >> shift) % mod;

        return {
            skinColor: SKIN_TONES[getGene(0, SKIN_TONES.length)],
            bodyShape: getGene(1, 3), // 0=Circle, 1=Squircle, 2=Peanut
            eyeSpacing: (getGene(2, 8)) - 4, // -4 to 4
            eyeSize: getGene(3, 3),
            mouthType: getGene(4, 5),
            hairType: getGene(5, 8), // 0=Bald, 1=Spiky, 2=Bob, 3=Afro, 4=Long, 5=Mohawk, 6=Crazy, 7=Ponytail
            hairColor: HAIR_COLORS[getGene(6, HAIR_COLORS.length)],
            noseType: getGene(7, 4), // 0=None, 1=Button, 2=Long, 3=Triangle
            cheekType: getGene(8, 4), // 0=None, 1=Rosy, 2=Freckles, 3=Spiral
            accessory: getGene(9, 6), // 0-2=None, 3=Glasses, 4=Patch, 5=Monocle
            facialHair: getGene(10, 5), // 0-1=None, 2=Stubble, 3=Mustache, 4=Goatee
            shirtColor: HAIR_COLORS[getGene(11, HAIR_COLORS.length)],
            pantsColor: SKIN_TONES[getGene(12, SKIN_TONES.length)],
            bodyProportion: getGene(13, 3) // 0=Slim, 1=Chunky, 2=Buff
        };
    }, [seed]);

    // --- BEHAVIOR LOOPS ---
    // 1. Blinking Loop
    useEffect(() => {
        let blinkTimeout: number;
        const triggerBlink = () => {
            setBlinking(true);
            setTimeout(() => setBlinking(false), 150);
            const nextBlink = Math.random() * 3000 + 2000 + (expression === 'SHOCKED' ? 4000 : 0);
            blinkTimeout = window.setTimeout(triggerBlink, nextBlink);
        };
        blinkTimeout = window.setTimeout(triggerBlink, Math.random() * 2000);
        return () => clearTimeout(blinkTimeout);
    }, [expression]);

    // 2. Attention Engine — Stateful machine with real-time tracking
    const currentGazeAt = useRef(gazeAt);
    useEffect(() => { currentGazeAt.current = gazeAt; }, [gazeAt]);

    useEffect(() => {
        let timer: number;
        let trackingInterval: number;
        const stateRef = { active: true, phase: 'wandering' as 'attending' | 'wandering' };

        // Real-time tracking loop (runs only during 'attending' phase)
        const updateGazePosition = () => {
            if (!stateRef.active) return;
            const target = currentGazeAt.current;

            if (stateRef.phase === 'attending' && target && !speaking) {
                // Smoothly update pupil position to follow target
                const gx = Math.max(-1, Math.min(1, target.x)) * 9;
                const gy = Math.max(-1, Math.min(1, target.y)) * 6;
                setGaze({ x: gx, y: gy });
            } else if (stateRef.phase === 'attending' && (!target || speaking)) {
                // If we lose target or start speaking while 'attending', force wander
                transition('wandering');
            }
        };

        const transition = (nextPhase: 'attending' | 'wandering') => {
            if (!stateRef.active) return;
            stateRef.phase = nextPhase;
            window.clearTimeout(timer);

            if (nextPhase === 'attending') {
                // Duration of focus: 1.5s to 4s
                const duration = 1500 + Math.random() * 2500;
                timer = window.setTimeout(() => decideNext(), duration);
            } else {
                // Duration of wander: 1s to 2.5s
                const duration = 1000 + Math.random() * 1500;
                // Move eyes to a random "unfocused" spot once
                setGaze({ x: (Math.random() - 0.5) * 14, y: (Math.random() - 0.5) * 10 });
                timer = window.setTimeout(() => decideNext(), duration);
            }
        };

        const decideNext = () => {
            if (!stateRef.active) return;
            const target = currentGazeAt.current;
            
            if (!target) {
                // No neighbor? Just keep wandering
                transition('wandering');
                return;
            }

            // Determine probability based on social context
            let prob = 0.3; // Ambient fallback
            if (socialContext === 'greeting') prob = 0.85;
            else if (socialContext === 'chatting') prob = 0.50;
            else if (socialContext === 'ambient') prob = 0.20;

            if (speaking) prob *= 0.6; // Speaking characters are 40% less likely to focus

            transition(Math.random() < prob ? 'attending' : 'wandering');
        };

        // Start the machine
        trackingInterval = window.setInterval(updateGazePosition, 50); // 20fps tracking
        decideNext();

        return () => {
            stateRef.active = false;
            window.clearTimeout(timer);
            window.clearInterval(trackingInterval);
        };
    }, [expression, speaking, !!gazeAt, socialContext]);


    // 3. Speaking Loop (Fallback Mouth Animation for when not using real-time audio)
    useEffect(() => {
        let speakInterval: number;
        if (speaking && audioVolume === 0) { 
            speakInterval = window.setInterval(() => {
                setMouthState(prev => (prev === 0 ? 1 : 0));
            }, 150); 
        } else {
            setMouthState(0);
        }

        return () => {
            if (speakInterval) clearInterval(speakInterval);
        };
    }, [speaking, audioVolume]);


    // Walk frame cycle (sprite-style: single timer drives everything)
    useEffect(() => {
        if (!walking) { setWalkFrame(0); return; }
        const interval = window.setInterval(() => {
            setWalkFrame(f => (f + 1) % 4);
        }, 150); // 150ms per frame = 0.6s full cycle
        return () => clearInterval(interval);
    }, [walking]);

    // --- COMPONENT PARTS ---

    const getAnimationClass = () => {
        if (walking) return ''; // Walking is now JS-driven
        switch (expression) {
            case 'HAPPY': return 'animate-bounce-subtle';
            case 'SHOCKED': return 'animate-shiver';
            case 'THINKING': return 'animate-sway';
            case 'SMUG': return 'animate-float-smug';
            case 'SAD': return 'animate-squash-sad';
            case 'ANGRY': return 'animate-shake-angry';
            default: return 'animate-float';
        }
    };
    // Walk frame pose tables (like a spritesheet lookup)
    const WALK_BODY =   [{ y: -4 }, { y: 0 }, { y: -4 }, { y: 0 }];
    // shoe: 'sole' = forward (show bottom), 'top' = back (show top), 'normal' = standing
    const WALK_LEG_L =  [{ y: 4, sy: 0.75, h: 30, shoe: 'sole' as const }, { y: 0, sy: 1, h: 40, shoe: 'normal' as const }, { y: -3, sy: 1.08, h: 45, shoe: 'top' as const },  { y: 0, sy: 1, h: 40, shoe: 'normal' as const }];
    const WALK_LEG_R =  [{ y: -3, sy: 1.08, h: 45, shoe: 'top' as const },  { y: 0, sy: 1, h: 40, shoe: 'normal' as const }, { y: 4, sy: 0.75, h: 30, shoe: 'sole' as const }, { y: 0, sy: 1, h: 40, shoe: 'normal' as const }];
    const WALK_ARM_L =  [{ y: 3, sy: 1.1, behind: true },  { y: 0, sy: 1, behind: false }, { y: -4, sy: 0.7, behind: false }, { y: 0, sy: 1, behind: false }];
    const WALK_ARM_R =  [{ y: -4, sy: 0.7, behind: false }, { y: 0, sy: 1, behind: false }, { y: 3, sy: 1.1, behind: true },  { y: 0, sy: 1, behind: false }];
    const WALK_SIDE_LEG_L = [{ r: 30, y: -2 }, { r: 0, y: 0 }, { r: -30, y: 4 }, { r: 0, y: 0 }];
    const WALK_SIDE_LEG_R = [{ r: -30, y: 4 }, { r: 0, y: 0 }, { r: 30, y: -2 }, { r: 0, y: 0 }];
    const WALK_SIDE_ARM_L = [{ r: -30, y: 2 }, { r: 0, y: 0 }, { r: 30, y: 2 }, { r: 0, y: 0 }];
    const WALK_SIDE_ARM_R = [{ r: 30, y: 2 }, { r: 0, y: 0 }, { r: -30, y: 2 }, { r: 0, y: 0 }];

    const BodyShape = () => {
        const { bodyShape, skinColor } = features;
        const stroke = "black";
        const strokeWidth = "3";

        switch (bodyShape) {
            case 2: // Peanut / Blob
                return <path d="M 30 20 Q 10 20 10 50 Q 10 80 30 90 L 70 90 Q 90 80 90 50 Q 90 20 70 20 Z" fill={skinColor} stroke={stroke} strokeWidth={strokeWidth} />;
            case 1: // Squircle
                return <rect x="10" y="10" width="80" height="80" rx="25" fill={skinColor} stroke={stroke} strokeWidth={strokeWidth} />;
            default: // Circle
                return <circle cx="50" cy="50" r="45" fill={skinColor} stroke={stroke} strokeWidth={strokeWidth} />;
        }
    };

    const HairBack = () => {
        const { hairType, hairColor } = features;
        const stroke = "black";
        const strokeWidth = "3";
        
        switch (hairType) {
            case 1: // Spiky Back
                return <path d="M 2 50 A 48 48 0 0 1 98 50 L 98 65 Q 50 75 2 65 Z" fill={hairColor} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />;
            case 2: // Bob Back
                return <path d="M 2 50 A 48 48 0 0 1 98 50 L 98 75 Q 50 85 2 75 Z" fill={hairColor} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />;
            case 3: // Afro Back
                return <circle cx="50" cy="50" r="55" fill={hairColor} stroke={stroke} strokeWidth={strokeWidth} />;
            case 4: // Long Back
                return <path d="M 2 50 A 48 48 0 0 1 98 50 L 98 90 L 2 90 Z" fill={hairColor} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />;
            case 5: // Mohawk Back strip
                return <path d="M 45 5 L 55 5 L 52 80 L 48 80 Z" fill={hairColor} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />;
            case 6: // Crazy Back
                return (
                    <g>
                        <path d="M 10 40 Q 0 10 30 20" fill="none" stroke={hairColor} strokeWidth="5" strokeLinecap="round" />
                        <path d="M 90 40 Q 100 10 70 20" fill="none" stroke={hairColor} strokeWidth="5" strokeLinecap="round" />
                        <path d="M 40 20 L 50 0 L 60 20" fill="none" stroke={hairColor} strokeWidth="5" strokeLinecap="round" />
                    </g>
                );
            case 7: { // Ponytail
                const cx = (direction === 'back' || direction === 'right') ? 15 : 85;
                const base = <path d="M 2 50 A 48 48 0 0 1 98 50 L 98 65 Q 50 75 2 65 Z" fill={hairColor} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />;
                const bun = <circle cx={cx} cy="50" r="15" fill={hairColor} stroke={stroke} strokeWidth={strokeWidth} />;
                return (
                    <g>
                        {base}
                        {direction !== 'back' && bun}
                    </g>
                );
            }
            default: return null;
        }
    };

    const HairScalp = () => {
        const { hairType, hairColor } = features;
        if (hairType === 0) return null;

        const isBack = direction === 'back';
        const isLeft = direction === 'left';
        const isRight = direction === 'right';
        const isSide = isLeft || isRight;

        if (!isBack && !isSide) return null;

        const stroke = "black";
        
        if (isBack) {
            switch (hairType) {
                case 1: return <path d="M 2 50 A 48 48 0 0 1 98 50 L 98 65 Q 50 75 2 65 Z" fill={hairColor} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />;
                case 2: return <path d="M 2 50 A 48 48 0 0 1 98 50 L 98 75 Q 50 85 2 75 Z" fill={hairColor} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />;
                case 3: return <circle cx="50" cy="50" r="55" fill={hairColor} stroke={stroke} strokeWidth="3" />;
                case 4: return <path d="M 2 50 A 48 48 0 0 1 98 50 L 98 90 L 2 90 Z" fill={hairColor} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />;
                case 5: return <path d="M 45 5 L 55 5 L 52 80 L 48 80 Z" fill={hairColor} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />;
                case 7: return (
                    <g>
                        <path d="M 2 50 A 48 48 0 0 1 98 50 L 98 65 Q 50 75 2 65 Z" fill={hairColor} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
                        <circle cx="15" cy="50" r="15" fill={hairColor} stroke={stroke} strokeWidth="3" />
                    </g>
                );
                default: return null;
            }
        }

        if (isSide) {
            const rightCap = <path d="M 20 12 A 48 48 0 0 1 98 50 L 98 70 Q 75 80 50 40 Q 30 30 20 12 Z" fill={hairColor} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />;
            const leftCap = <path d="M 80 12 A 48 48 0 0 0 2 50 L 2 70 Q 25 80 50 40 Q 70 30 80 12 Z" fill={hairColor} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />;
            
            switch (hairType) {
                case 1:
                case 2:
                case 4:
                case 7:
                    return (
                        <g>
                            {isLeft ? rightCap : leftCap}
                            {hairType === 7 && isLeft && <circle cx="65" cy="50" r="15" fill={hairColor} stroke={stroke} strokeWidth="3" />}
                        </g>
                    );
                case 3:
                case 5:
                default:
                    return null;
            }
        }
        return null;
    };

    const HairFront = () => {
        const { hairType, hairColor } = features;
        const stroke = "black";
        const strokeWidth = "2";

        const transform = expression === 'SHOCKED' ? "translate(0, -5)" : "";

        if (direction === 'back') {
            // Front-specific bangs or holes shouldn't render when facing away,
            // only hair that sits exclusively on top top.
            if (hairType === 1) return <path d="M 20 30 L 30 10 L 40 30 L 50 5 L 60 30 L 70 10 L 80 30" fill={hairColor} stroke={stroke} strokeWidth={strokeWidth} transform={transform} />;
            if (hairType === 6) return (
                <g transform={transform}>
                    <path d="M 10 40 Q 0 10 30 20" fill="none" stroke={hairColor} strokeWidth="5" strokeLinecap="round" />
                    <path d="M 90 40 Q 100 10 70 20" fill="none" stroke={hairColor} strokeWidth="5" strokeLinecap="round" />
                    <path d="M 40 20 L 50 0 L 60 20" fill="none" stroke={hairColor} strokeWidth="5" strokeLinecap="round" />
                </g>
            );
            return null;
        }

        switch (hairType) {
            case 1: // Spiky
                return (
                    <g transform={transform}>
                        <path d="M 20 35 L 30 10 L 40 33 L 50 5 L 60 33 L 70 10 L 80 35" fill={hairColor} stroke={stroke} strokeWidth={strokeWidth} />
                    </g>
                );
            case 2: // Bob (Fuller dome)
                return <path d="M 12 40 A 38 38 0 0 1 88 40 L 88 70 Q 88 80 78 70 L 78 40 Q 50 48 22 40 L 22 70 Q 12 80 12 70 Z" fill={hairColor} stroke={stroke} strokeWidth={strokeWidth} />;
            case 3: // Afro Front
                return <path d="M 15 40 Q 50 10 85 40" fill="none" stroke={hairColor} strokeWidth="18" strokeLinecap="round" />;
            case 4: // Long Front (Bangs + Top Cap)
                return <path d="M 12 40 A 38 38 0 0 1 88 40 Q 50 50 12 40 Z" fill={hairColor} stroke={stroke} strokeWidth={strokeWidth} />;
            case 5: // Mohawk
                return <path d="M 45 5 L 55 5 L 52 40 L 48 40 Z" fill={hairColor} stroke={stroke} strokeWidth={strokeWidth} transform={transform} />;
            case 6: // Crazy
                return (
                    <g transform={transform}>
                        <path d="M 10 40 Q 0 10 30 20" fill="none" stroke={hairColor} strokeWidth="5" strokeLinecap="round" />
                        <path d="M 90 40 Q 100 10 70 20" fill="none" stroke={hairColor} strokeWidth="5" strokeLinecap="round" />
                        <path d="M 40 20 L 50 0 L 60 20" fill="none" stroke={hairColor} strokeWidth="5" strokeLinecap="round" />
                    </g>
                );
            default: return null;
        }
    };

    const Eyebrows = () => {
        const stroke = "black";
        const width = "3";

        switch (expression) {
            case 'SHOCKED':
                return (
                    <g stroke={stroke} strokeWidth={width} fill="none" strokeLinecap="round">
                        <path d="M 20 20 Q 30 5 40 20" />
                        <path d="M 60 20 Q 70 5 80 20" />
                    </g>
                );
            case 'SAD':
                return (
                    <g stroke={stroke} strokeWidth={width} fill="none" strokeLinecap="round">
                        <path d="M 15 32 L 40 28" />
                        <path d="M 60 28 L 85 32" />
                    </g>
                );
            case 'SMUG':
                return (
                    <g stroke={stroke} strokeWidth={width} fill="none" strokeLinecap="round">
                        <path d="M 20 30 L 40 35" />
                        <path d="M 60 30 Q 70 20 80 30" />
                    </g>
                );
            case 'THINKING':
                return (
                    <g stroke={stroke} strokeWidth={width} fill="none" strokeLinecap="round">
                        <path d="M 20 35 L 40 35" />
                        <path d="M 60 25 Q 70 15 80 25" />
                    </g>
                );
            case 'ANGRY':
                return (
                    <g stroke={stroke} strokeWidth={width} fill="none" strokeLinecap="round">
                        <path d="M 20 25 L 45 35" />
                        <path d="M 80 25 L 55 35" />
                    </g>
                );
            default: // Neutral
                return (
                    <g stroke={stroke} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6">
                        <path d="M 25 32 Q 32 30 40 32" />
                        <path d="M 60 32 Q 68 30 75 32" />
                    </g>
                );
        }
    };

    const EyeBalls = () => {
        if (blinking) {
            return (
                <g stroke="black" strokeWidth="3" strokeLinecap="round">
                    <line x1="25" y1="45" x2="45" y2="45" />
                    <line x1="55" y1="45" x2="75" y2="45" />
                </g>
            );
        }

        if (expression === 'HAPPY') {
            return (
                <g stroke="black" strokeWidth="4" fill="none" strokeLinecap="round">
                    <path d="M 25 50 Q 35 40 45 50" />
                    <path d="M 55 50 Q 65 40 75 50" />
                </g>
            );
        }

        const r = features.eyeSize === 0 ? 8 : (features.eyeSize === 1 ? 11 : 6);
        const pupilR = expression === 'SHOCKED' ? 2 : Math.max(2, r / 2.5);

        return (
            <g>
                <g transform={`translate(${features.eyeSpacing}, 0)`}>
                    <circle cx="35" cy="48" r={r} fill="white" stroke="black" strokeWidth="2" />
                    <circle cx="65" cy="48" r={r} fill="white" stroke="black" strokeWidth="2" />

                    {expression === 'ANGRY' && (
                        <g fill={features.skinColor} stroke="black" strokeWidth="1">
                            <path d="M 20 35 L 50 48 L 50 30 Z" />
                            <path d="M 80 35 L 50 48 L 50 30 Z" />
                        </g>
                    )}

                    <g transform={`translate(${gaze.x}, ${gaze.y})`} style={{ transition: 'transform 0.15s ease-out' }}>
                        <circle cx="35" cy="48" r={pupilR} fill="black" />
                        <circle cx="65" cy="48" r={pupilR} fill="black" />
                        <circle cx="37" cy="46" r={pupilR / 2} fill="white" opacity="0.7" />
                        <circle cx="67" cy="46" r={pupilR / 2} fill="white" opacity="0.7" />
                    </g>
                </g>
            </g>
        );
    };

    const Accessories = () => {
        const r = features.eyeSize === 0 ? 8 : (features.eyeSize === 1 ? 11 : 6);

        if (features.accessory === 3) {
            return (
                <g stroke="black" strokeWidth="2" fill="rgba(255,255,255,0.3)">
                    <circle cx="35" cy="48" r={r + 6} strokeWidth="3" />
                    <circle cx="65" cy="48" r={r + 6} strokeWidth="3" />
                    <line x1="48" y1="48" x2="52" y2="48" strokeWidth="3" />
                    <line x1="20" y1="48" x2="10" y2="45" />
                    <line x1="80" y1="48" x2="90" y2="45" />
                </g>
            );
        }
        if (features.accessory === 4) {
            return (
                <g>
                    <path d="M 20 40 L 50 60" stroke="black" strokeWidth="2" />
                    <circle cx="35" cy="48" r={r + 2} fill="black" />
                </g>
            );
        }
        if (features.accessory === 5) {
            return (
                <g>
                    <circle cx="65" cy="48" r={r + 4} fill="rgba(200,255,255,0.3)" stroke="gold" strokeWidth="2" />
                    <path d="M 65 60 Q 65 80 70 90" fill="none" stroke="gold" strokeWidth="1" />
                </g>
            );
        }
        return null;
    };

    const Nose = () => {
        const { noseType } = features;
        const color = "rgba(0,0,0,0.1)"; 

        switch (noseType) {
            case 1: return <circle cx="50" cy="60" r="4" fill={color} />;
            case 2: return <path d="M 50 55 L 45 65 L 55 65 Z" fill={color} />; 
            case 3: return <path d="M 50 50 L 50 65 L 58 65" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" opacity="0.3" />; 
            default: return null;
        }
    };

    const Cheeks = () => {
        const { cheekType } = features;
        if (cheekType === 1) 
            return (
                <g fill="#FF0000" opacity="0.1">
                    <circle cx="20" cy="60" r="8" />
                    <circle cx="80" cy="60" r="8" />
                </g>
            );
        if (cheekType === 2) 
            return (
                <g fill="rgba(100,50,0,0.2)">
                    <circle cx="20" cy="60" r="2" />
                    <circle cx="25" cy="58" r="1.5" />
                    <circle cx="18" cy="64" r="2" />
                    <circle cx="80" cy="60" r="2" />
                    <circle cx="75" cy="58" r="1.5" />
                    <circle cx="82" cy="64" r="2" />
                </g>
            );
        if (cheekType === 3) 
            return (
                <g stroke="#F06292" strokeWidth="1" fill="none" opacity="0.4">
                    <path d="M 20 60 Q 25 55 20 50 Q 15 55 20 60" />
                    <path d="M 80 60 Q 85 55 80 50 Q 75 55 80 60" />
                </g>
            );
        return null;
    };

    const FacialHair = () => {
        const { facialHair, hairColor } = features;
        if (facialHair === 2) 
            return <path d="M 30 70 Q 50 90 70 70" fill="none" stroke="black" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />;
        if (facialHair === 3) 
            return <path d="M 35 70 Q 50 60 65 70 Q 50 75 35 70" fill={hairColor} stroke="black" strokeWidth="1" />;
        if (facialHair === 4) 
            return <path d="M 45 80 L 50 90 L 55 80" fill={hairColor} stroke="black" strokeWidth="1" />;
        return null;
    };

    const Mouth = () => {
        // SMART LIP SYNC LOGIC
        if (audioVolume > 0.05) { // Threshold for silence
           // scale opening up to ry=16
           const dynamicRy = Math.min(2 + audioVolume * 40, 16);
           return <ellipse cx="50" cy="78" rx="8" ry={dynamicRy} fill="black" />;
        } else if (speaking && mouthState === 1) {
            return <ellipse cx="50" cy="78" rx="8" ry="8" fill="black" />;
        } // Otherwise closed

        if (expression === 'SHOCKED') return <ellipse cx="50" cy="78" rx="8" ry="12" fill="black" />;
        if (expression === 'HAPPY') return <path d="M 30 75 Q 50 90 70 75" fill="#FFFFFF" stroke="black" strokeWidth="2" />;
        if (expression === 'SAD') return <path d="M 35 85 Q 50 75 65 85" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" />;
        if (expression === 'SMUG') return <path d="M 40 78 Q 50 78 60 75" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" />;
        if (expression === 'ANGRY') return <path d="M 40 85 Q 50 75 60 85" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" />;

        switch (features.mouthType) {
            case 0: return <line x1="42" y1="78" x2="58" y2="78" stroke="black" strokeWidth="3" strokeLinecap="round" />;
            case 1: return <circle cx="50" cy="78" r="4" fill="black" />;
            case 2: return <path d="M 40 78 Q 50 82 60 78" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" />;
            case 3: return <rect x="42" y="76" width="16" height="4" rx="1" fill="white" stroke="black" strokeWidth="1" />;
            default: return <path d="M 45 80 Q 50 75 55 80" fill="none" stroke="black" strokeWidth="2" />; // Pucker
        }
    };

    const Particles = () => {
        if (expression === 'SHOCKED') {
            return (
                <g fill="#4FC3F7" className="animate-pulse">
                    <path d="M 90 20 Q 95 10 100 20 A 5 5 0 1 1 90 20" />
                    <path d="M 10 20 Q 5 10 0 20 A 5 5 0 1 1 10 20" />
                </g>
            );
        }
        if (expression === 'THINKING') {
            return <text x="85" y="30" fontSize="30" fontWeight="bold" fill="#000" className="animate-bounce">?</text>;
        }
        if (expression === 'SMUG') {
            return (
                <g stroke="#FFA000" strokeWidth="3" className="animate-spin-slow" opacity="0.8">
                    <line x1="85" y1="15" x2="95" y2="25" />
                    <line x1="95" y1="15" x2="85" y2="25" />
                </g>
            );
        }
        if (expression === 'ANGRY') {
            return (
                <g stroke="#D32F2F" strokeWidth="4" opacity="0.8">
                    <path d="M 10 10 L 25 25" />
                    <path d="M 25 10 L 10 25" />
                    <path d="M 80 10 L 95 25" />
                    <path d="M 95 10 L 80 25" />
                </g>
            );
        }
        return null;
    };

    const StylizedBody = () => {
        const { skinColor, shirtColor, pantsColor, bodyProportion } = features;
        const stroke = "black";
        
        const isSideView = direction === 'left' || direction === 'right';
        const f = walkFrame; // Current sprite frame

        let torsoW = 40;
        let torsoX = 30;
        let buffPath = "M 20 90 L 80 90 L 60 135 L 40 135 Z";
        
        if (bodyProportion === 1) {
           torsoW = 56;
           torsoX = 22;
        } else if (bodyProportion === 2) {
           torsoW = 60;
           torsoX = 20;
        }

        if (isSideView) {
           torsoW = 32;
           if (bodyProportion === 1) torsoW = 44;
           torsoX = 50 - (torsoW / 2);
           buffPath = "M 27.5 90 L 72.5 90 L 65 135 L 35 135 Z";
        }

        // Non-walking expression classes (only when not walking)
        let leftArmExprClass = !walking && expression === 'HAPPY' ? 'animate-wave-left' : '';
        let rightArmExprClass = !walking && expression === 'ANGRY' ? 'animate-angry-arm-right' : '';

        const leftShoePath = direction === 'right' ? "M 35 170 Q 45 160 52 170 Z" : "M 30 170 Q 35 160 47 170 Z";
        const rightShoePath = direction === 'left' ? "M 48 170 Q 55 160 65 170 Z" : "M 53 170 Q 65 160 70 170 Z";

        // Compute walk transforms from frame lookup tables
        const legLFrame = WALK_LEG_L[f];
        const legRFrame = WALK_LEG_R[f];
        const legLT = walking ? (isSideView
            ? `rotate(${WALK_SIDE_LEG_L[f].r}deg) translateY(${WALK_SIDE_LEG_L[f].y}px)`
            : `translateY(${legLFrame.y}px) scaleY(${legLFrame.sy})`) : '';
        const legRT = walking ? (isSideView
            ? `rotate(${WALK_SIDE_LEG_R[f].r}deg) translateY(${WALK_SIDE_LEG_R[f].y}px)`
            : `translateY(${legRFrame.y}px) scaleY(${legRFrame.sy})`) : '';

        // Dynamic shoe paths for front/back based on frame
        const shoeForLeg = (cx: number, frame: typeof legLFrame) => {
            if (!walking || isSideView) return null;
            const x = cx - 6;
            const bottom = 130 + frame.h; // bottom of the leg rect
            if (frame.shoe === 'sole') {
                return <ellipse cx={cx} cy={bottom + 2} rx="8" ry="3" fill="#555" stroke={stroke} strokeWidth="1.5" />;
            } else if (frame.shoe === 'top') {
                return <path d={`M ${x} ${bottom} Q ${cx} ${bottom - 5} ${x + 12} ${bottom}`} fill="#333" stroke={stroke} strokeWidth="1.5" />;
            }
            return null;
        };
        const armLT = walking ? (isSideView
            ? `rotate(${WALK_SIDE_ARM_L[f].r}deg) translateY(${WALK_SIDE_ARM_L[f].y}px)`
            : `translateY(${WALK_ARM_L[f].y}px) scaleY(${WALK_ARM_L[f].sy})`) : '';
        const armRT = walking ? (isSideView
            ? `rotate(${WALK_SIDE_ARM_R[f].r}deg) translateY(${WALK_SIDE_ARM_R[f].y}px)`
            : `translateY(${WALK_ARM_R[f].y}px) scaleY(${WALK_ARM_R[f].sy})`) : '';
        const armLBehind = walking && !isSideView ? WALK_ARM_L[f].behind : false;
        const armRBehind = walking && !isSideView ? WALK_ARM_R[f].behind : false;

        const ArmLeft = () => (
            <g className={leftArmExprClass} style={{transformOrigin: '25px 95px', transform: armLT}}>
                <rect x="15" y="90" width="12" height="35" rx="5" fill={shirtColor} stroke={stroke} strokeWidth="2" />
                <circle cx="21" cy="125" r="6" fill={skinColor} stroke={stroke} strokeWidth="2" />
            </g>
        );
        const ArmRight = () => (
            <g className={rightArmExprClass} style={{transformOrigin: '75px 95px', transform: armRT}}>
                <rect x="73" y="90" width="12" height="35" rx="5" fill={shirtColor} stroke={stroke} strokeWidth="2" />
                <circle cx="79" cy="125" r="6" fill={skinColor} stroke={stroke} strokeWidth="2" />
            </g>
        );

        return (
            <g id="full-body">
                {/* Legs + Shoes */}
                <g style={{transformOrigin: '41px 130px', transform: legLT}}>
                    <rect x="35" y="130" width="12" height={walking && !isSideView ? legLFrame.h : 40} fill={pantsColor} stroke={stroke} strokeWidth="2" />
                    {(!walking || isSideView || legLFrame.shoe === 'normal') && (
                        <path d={leftShoePath} fill="#333" stroke={stroke} strokeWidth="2" />
                    )}
                    {shoeForLeg(41, legLFrame)}
                </g>
                <g style={{transformOrigin: '59px 130px', transform: legRT}}>
                    <rect x="53" y="130" width="12" height={walking && !isSideView ? legRFrame.h : 40} fill={pantsColor} stroke={stroke} strokeWidth="2" />
                    {(!walking || isSideView || legRFrame.shoe === 'normal') && (
                        <path d={rightShoePath} fill="#333" stroke={stroke} strokeWidth="2" />
                    )}
                    {shoeForLeg(59, legRFrame)}
                </g>

                {/* Side view: far arm behind torso */}
                {direction === 'left' && (
                    <g transform='translate(-29, 0)'><ArmRight /></g>
                )}
                {direction === 'right' && (
                    <g transform='translate(29, 0)'><ArmLeft /></g>
                )}

                {/* Front/Back: arms behind torso when swinging back */}
                {(direction === 'front' || direction === 'back') && armLBehind && <ArmLeft />}
                {(direction === 'front' || direction === 'back') && armRBehind && <ArmRight />}

                {/* Torso */}
                {bodyProportion === 2 ? (
                    <path d={buffPath} fill={shirtColor} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
                ) : (
                    <rect x={torsoX} y="85" width={torsoW} height="50" rx="10" fill={shirtColor} stroke={stroke} strokeWidth="3" />
                )}

                {/* Front/Back: arms in front of torso when swinging forward */}
                {(direction === 'front' || direction === 'back') && !armLBehind && <ArmLeft />}
                {(direction === 'front' || direction === 'back') && !armRBehind && <ArmRight />}

                {/* Side view: near arm in front of torso */}
                {direction !== 'right' && direction !== 'front' && direction !== 'back' && (
                    <g transform='translate(29, 0)'><ArmLeft /></g>
                )}
                {direction !== 'left' && direction !== 'front' && direction !== 'back' && (
                    <g transform='translate(-29, 0)'><ArmRight /></g>
                )}
            </g>
        );
    };

    const faceTransform = direction === 'left' ? 'translate(-15, 0)' : direction === 'right' ? 'translate(15, 0)' : '';

    return (
        <div
            ref={containerRef}
            className={`avatar-container ${className}`}
            style={{ width: size, height: size * 1.8 }}
        >
            <div className={`avatar-wrapper ${getAnimationClass()}`}>
                <svg viewBox="0 0 100 180" className="avatar-svg">
                    <g transform={walking ? `translate(0, ${WALK_BODY[walkFrame].y})` : ''}>
                    <HairBack />
                    <StylizedBody />
                    <BodyShape />
                    <HairScalp />
                    {direction !== 'back' && (
                        <g transform={faceTransform}>
                            <Cheeks />
                            <Nose />
                            <EyeBalls />
                            <FacialHair />
                            <Mouth />
                        </g>
                    )}
                    <g transform={direction !== 'back' ? faceTransform : ''}>
                        <HairFront />
                    </g>
                    {direction !== 'back' && (
                        <g transform={faceTransform}>
                            <Eyebrows />
                            <Accessories />
                        </g>
                    )}
                    <Particles />
                    </g>
                </svg>
            </div>
        </div>
    );
};
