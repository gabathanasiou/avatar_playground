import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Avatar } from '../Avatar';
import { DialogueBox } from './DialogueBox';
import { generateDialogue } from '../utils/sentenceFactory';
import type { DialoguePage } from '../utils/sentenceFactory';
import type { Expression } from '../types';

interface Entity {
    id: string;
    type: 'player' | 'npc';
    x: number;
    y: number;
    seed: string;
    name: string;
    direction: 'front' | 'back' | 'left' | 'right';
    isWalking: boolean;
    isSpeaking: boolean;
    expression: Expression;
    busyUntil?: number;
    expressionExpiry?: number;
    socialContext?: 'greeting' | 'chatting' | 'ambient';
    currentNeighborId?: string;
}

interface GameWorldProps {
    playerName: string;
}

const generateRandomSeed = () => Math.random().toString(36).substring(7);
const MOVE_SPEED = 3.5; // Reduced from 5
const COLLISION_RADIUS = 30;
const INTERACTION_DISTANCE = 110;
const SOCIAL_DISTANCE = 70;
const TALK_RADIUS = 120; // Gaze locks within this range

export const GameWorld: React.FC<GameWorldProps> = ({ playerName }) => {
    // --- RENDER STATE ---
    const [renderTick, setRenderTick] = useState(0);
    const [activeDialogue, setActiveDialogue] = useState<{ speaker: string; pages: DialoguePage[]; currentPageIndex: number } | null>(null);

    // --- PHYSICS REFS ---
    const playerPosRef = useRef({ x: 400, y: 300 });
    const playerDirRef = useRef<Entity['direction']>('front');
    const isWalkingRef = useRef(false);
    const keysPressed = useRef<Set<string>>(new Set());
    const animationFrameRef = useRef<number>();
    const activeDialogueRef = useRef<{ speaker: string; pages: DialoguePage[]; currentPageIndex: number } | null>(null);

    // NPC state lives in a ref for physics, but also in React state for rendering
    const npcsRef = useRef<Entity[]>([
        { id: 'npc1_v7', type: 'npc', x: 200, y: 200, seed: generateRandomSeed(), name: 'Elder Oak', direction: 'front', isWalking: false, isSpeaking: false, expression: 'NEUTRAL' },
        { id: 'npc2_v7', type: 'npc', x: 500, y: 400, seed: generateRandomSeed(), name: 'Pacing Pat', direction: 'front', isWalking: false, isSpeaking: false, expression: 'NEUTRAL' },
        { id: 'npc3_v7', type: 'npc', x: 630, y: 150, seed: generateRandomSeed(), name: 'Moody Mike', direction: 'right', isWalking: false, isSpeaking: false, expression: 'SMUG' },
        { id: 'npc4_v7', type: 'npc', x: 150, y: 450, seed: generateRandomSeed(), name: 'Chaos Carl', direction: 'left', isWalking: false, isSpeaking: false, expression: 'NEUTRAL' },
    ]);
    // Snapshot for rendering — updated each RAF frame
    const [npcSnapshot, setNpcSnapshot] = useState<Entity[]>(npcsRef.current);

    // Keep dialogue ref in sync
    useEffect(() => { activeDialogueRef.current = activeDialogue; }, [activeDialogue]);

    const handleDialogueComplete = useCallback(() => {
        setActiveDialogue(null);
        npcsRef.current = npcsRef.current.map(n => ({
            ...n, isSpeaking: false, busyUntil: 0,
            expression: n.id.includes('npc3') ? 'SMUG' : 'NEUTRAL',
            expressionExpiry: 0
        }));
    }, []);

    const handleNextPage = useCallback(() => {
        if (!activeDialogue) return;
        const nextIndex = activeDialogue.currentPageIndex + 1;
        
        if (nextIndex >= activeDialogue.pages.length) {
            handleDialogueComplete();
        } else {
            const nextPage = activeDialogue.pages[nextIndex];
            setActiveDialogue({ ...activeDialogue, currentPageIndex: nextIndex });
            
            // Update NPC expression for the new page
            npcsRef.current = npcsRef.current.map(n => {
                if (n.name === activeDialogue.speaker) {
                    return { ...n, expression: nextPage.expression };
                }
                return n;
            });
        }
    }, [activeDialogue, handleDialogueComplete]);

    const handleInteraction = useCallback(() => {
        if (activeDialogueRef.current) {
            handleNextPage();
            return;
        }

        const { x: px, y: py } = playerPosRef.current;
        let closest: Entity | null = null;
        let minDist = INTERACTION_DISTANCE;
        npcsRef.current.forEach(npc => {
            const d = Math.hypot(npc.x - px, npc.y - (py - 30));
            if (d < minDist) { minDist = d; closest = npc; }
        });

        if (closest) {
            const npc = closest as Entity;
            const pages = generateDialogue();
            const firstPage = pages[0];
            
            setActiveDialogue({ speaker: npc.name, pages, currentPageIndex: 0 });

            npcsRef.current = npcsRef.current.map(n => {
                if (n.id !== npc.id) return n;
                const dx = px - n.x;
                const dy = py - n.y;
                const dir: Entity['direction'] =
                    Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'front' : 'back');
                return { ...n, direction: dir, isWalking: false, isSpeaking: true, expression: firstPage.expression, busyUntil: Date.now() + 60000 };
            });
        }
    }, [handleNextPage, handleDialogueComplete]);

    // --- PURE RAF LOOP: reads refs, never recreated ---
    const tick = useCallback(() => {
        if (!activeDialogueRef.current) {
            const { x, y } = playerPosRef.current;
            let inputX = 0, inputY = 0;
            let newDir = playerDirRef.current;

            if (keysPressed.current.has('ArrowUp') || keysPressed.current.has('w')) { inputY -= 1; newDir = 'back'; }
            if (keysPressed.current.has('ArrowDown') || keysPressed.current.has('s')) { inputY += 1; newDir = 'front'; }
            if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('a')) { inputX -= 1; newDir = 'left'; }
            if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d')) { inputX += 1; newDir = 'right'; }

            if (inputX !== 0 || inputY !== 0) {
                // Normalize diagonal movement
                const length = Math.hypot(inputX, inputY);
                const dx = (inputX / length) * MOVE_SPEED;
                const dy = (inputY / length) * MOVE_SPEED;

                const nx = Math.max(50, Math.min(x + dx, 750));
                const ny = Math.max(50, Math.min(y + dy, 550));
                const blocked = npcsRef.current.some(npc => Math.hypot(nx - npc.x, ny - npc.y) < COLLISION_RADIUS);
                
                if (!blocked) { 
                    playerPosRef.current = { x: nx, y: ny }; 
                }
                playerDirRef.current = newDir;
                isWalkingRef.current = !blocked;
            } else {
                isWalkingRef.current = false;
            }
        } else {
            isWalkingRef.current = false;
        }

        // Sync NPC snapshot to render state
        setNpcSnapshot([...npcsRef.current]);
        setRenderTick(t => t + 1); // force re-render for player position
        animationFrameRef.current = requestAnimationFrame(tick);
    }, []); // empty deps — refs keep it fresh, never restarts

    // --- NPC AI: separate interval, writes to npcsRef ---
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            let changed = false;

            const next = npcsRef.current.map((npc) => {
                // Determine social context based on neighbors
                let context: Entity['socialContext'] = npc.socialContext || 'ambient';
                let neighborId = npc.currentNeighborId;

                // Find nearest neighbor for context (including player)
                const allEntities = [...npcsRef.current, { id: 'player', x: playerPosRef.current.x, y: playerPosRef.current.y }];
                let closest = null;
                let minDist = TALK_RADIUS;
                for (const other of allEntities) {
                    if (other.id === npc.id) continue;
                    const d = Math.hypot(other.x - npc.x, other.y - npc.y);
                    if (d < minDist) { minDist = d; closest = other; }
                }

                if (closest) {
                    if (closest.id !== neighborId) {
                        // New neighbor! Start greeting
                        context = 'greeting';
                        neighborId = closest.id;
                    } else if (npc.isSpeaking || (activeDialogueRef.current && (npc.name === activeDialogueRef.current.speaker || neighborId === 'player'))) {
                        context = 'chatting';
                    }
                    // If they stay in range but aren't talking, it naturally stays 'greeting' 
                    // until dialogue ends, then we want it to drop to 'ambient'
                } else {
                    // Left range: reset
                    context = 'ambient';
                    neighborId = undefined;
                }

                // Transition: if dialogue just ended, drop to ambient
                if (npc.socialContext === 'chatting' && !npc.isSpeaking && !activeDialogueRef.current) {
                    context = 'ambient';
                }

                // Cleanup expired expressions
                if (npc.expression !== 'NEUTRAL' && !npc.id.includes('npc3') && npc.expressionExpiry && npc.expressionExpiry < now) {
                    changed = true;
                    return { ...npc, expression: 'NEUTRAL' as Expression, expressionExpiry: 0, socialContext: context, currentNeighborId: neighborId };
                }

                const isBusy = npc.busyUntil && npc.busyUntil > now;
                if (isBusy) {
                    // Update context even while busy (e.g. while chatting)
                    if (context !== npc.socialContext) { changed = true; return { ...npc, socialContext: context, currentNeighborId: neighborId }; }
                    return npc;
                }

                // Release from speaking
                if (npc.isSpeaking && !activeDialogueRef.current) {
                    changed = true;
                    return { ...npc, isSpeaking: false, expression: (npc.id.includes('npc3') ? 'SMUG' : 'NEUTRAL') as Expression, socialContext: 'ambient', currentNeighborId: neighborId };
                }

                const roll = Math.random();

                // Social check
                if (roll < 0.05) {
                    for (const other of npcsRef.current) {
                        if (other.id !== npc.id && !other.busyUntil && !other.isSpeaking) {
                            if (Math.hypot(npc.x - other.x, npc.y - other.y) < SOCIAL_DISTANCE) {
                                // For NPC gossip, we just use the first page of a random dialogue for simplicity
                                const pages = generateDialogue();
                                const firstPage = pages[0];
                                const chatEnd = now + 4000;
                                const dir: Entity['direction'] = other.x > npc.x ? 'right' : 'left';
                                npcsRef.current = npcsRef.current.map(n => {
                                    if (n.id === other.id) return { ...n, isSpeaking: false, isWalking: false, direction: (other.x > npc.x ? 'left' : 'right') as Entity['direction'], busyUntil: chatEnd, expression: 'NEUTRAL' as Expression, expressionExpiry: chatEnd + 2000 };
                                    return n;
                                });
                                changed = true;
                                return { ...npc, isSpeaking: true, isWalking: false, direction: dir, busyUntil: chatEnd, expression: firstPage.expression, expressionExpiry: chatEnd + 2000 };
                            }
                        }
                    }
                }

                // Autonomous emoting
                if (roll < 0.005 && npc.expression === 'NEUTRAL') {
                    const moods: Expression[] = ['HAPPY', 'SAD', 'THINKING', 'SHOCKED', 'ANGRY'];
                    changed = true;
                    return { ...npc, expression: moods[Math.floor(Math.random() * moods.length)], expressionExpiry: now + 3000 + Math.random() * 3000 };
                }

                // Wandering
                if (roll < 0.03 && !npc.isWalking) { changed = true; return { ...npc, isWalking: true, direction: (['front', 'back', 'left', 'right'] as Entity['direction'][])[Math.floor(Math.random() * 4)], socialContext: context, currentNeighborId: neighborId }; }
                if (roll < 0.07 && npc.isWalking) { changed = true; return { ...npc, isWalking: false, socialContext: context, currentNeighborId: neighborId }; }

                if (npc.isWalking) {
                    let nx = npc.x, ny = npc.y;
                    if (npc.direction === 'left') nx -= 1; if (npc.direction === 'right') nx += 1;
                    if (npc.direction === 'back') ny -= 1; if (npc.direction === 'front') ny += 1;
                    if (nx < 50 || nx > 750 || ny < 50 || ny > 550) { changed = true; return { ...npc, isWalking: false, socialContext: context, currentNeighborId: neighborId }; }
                    const blocked = npcsRef.current.some(o => o.id !== npc.id && Math.hypot(nx - o.x, ny - o.y) < COLLISION_RADIUS)
                        || Math.hypot(nx - playerPosRef.current.x, ny - playerPosRef.current.y) < COLLISION_RADIUS;
                    if (blocked) { changed = true; return { ...npc, isWalking: false, socialContext: context, currentNeighborId: neighborId }; }
                    changed = true;
                    return { ...npc, x: nx, y: ny, socialContext: context as any, currentNeighborId: neighborId };
                }
                
                if (context !== npc.socialContext || neighborId !== npc.currentNeighborId) {
                    changed = true;
                    return { ...npc, socialContext: context as any, currentNeighborId: neighborId };
                }

                return npc;
            });

            if (changed) npcsRef.current = next;
        }, 80); // AI doesn't need to run at 60fps — 80ms is fine
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            keysPressed.current.add(e.key);
            if (e.key === ' ' || e.key === 'Enter') handleInteraction();
        };
        const up = (e: KeyboardEvent) => keysPressed.current.delete(e.key);
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        animationFrameRef.current = requestAnimationFrame(tick);
        return () => {
            window.removeEventListener('keydown', down);
            window.removeEventListener('keyup', up);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [tick, handleInteraction]);

    const sortedEntities = useMemo(() => {
        const pos = playerPosRef.current;
        const player: Entity = {
            id: 'player', type: 'player',
            x: pos.x, y: pos.y,
            seed: playerName, name: playerName,
            direction: playerDirRef.current,
            isWalking: isWalkingRef.current,
            isSpeaking: false, expression: 'NEUTRAL',
            socialContext: activeDialogueRef.current ? 'chatting' : undefined // player specific context logic
        };
        const all = [...npcSnapshot, player];

        // Compute gaze target per entity, only within TALK_RADIUS
        const gazeMap = new Map<string, { x: number; y: number } | undefined>();
        for (const entity of all) {
            // Find nearest entity within TALK_RADIUS for tracking
            let nearest: Entity | null = null;
            let nearestDist = TALK_RADIUS;
            for (const other of all) {
                if (other.id === entity.id) continue;
                const d = Math.hypot(other.x - entity.x, other.y - entity.y);
                if (d < nearestDist) { nearestDist = d; nearest = other; }
            }
            if (nearest) {
                const dx = nearest.x - entity.x;
                const dy = nearest.y - entity.y;
                const len = Math.hypot(dx, dy) || 1;
                gazeMap.set(entity.id, { x: dx / len, y: dy / len });
            } else {
                gazeMap.set(entity.id, undefined);
            }
        }

        return all
            .map(e => {
                let ctx = e.socialContext;
                // If player doesn't have a static context, check proximity for greeting
                if (e.id === 'player' && !ctx) {
                    const nearest = npcSnapshot.find(n => Math.hypot(n.x - pos.x, n.y - pos.y) < TALK_RADIUS);
                    ctx = nearest ? 'greeting' : 'ambient';
                }
                return { ...e, socialContext: ctx, gazeAt: gazeMap.get(e.id) };
            })
            .sort((a, b) => a.y - b.y);
    }, [npcSnapshot, playerName, renderTick]);

    return (
        <div className="game-world-container no-float">
            <div className="game-map">
                {sortedEntities.map(entity => (
                    <div key={entity.id} className={`game-object ${entity.type}`}
                        style={{ left: entity.x, top: entity.y, zIndex: Math.floor(entity.y) }}>
                        <Avatar seed={entity.seed} size={60} direction={entity.direction}
                            walking={entity.isWalking} speaking={entity.isSpeaking} expression={entity.expression}
                            gazeAt={(entity as any).gazeAt} socialContext={(entity as any).socialContext} />
                        <div className={`name-plate ${entity.type === 'player' ? 'player-name' : ''}`}>
                            {entity.name}
                        </div>
                    </div>
                ))}
            </div>
            {!activeDialogue && <div className="game-instructions">Move with WASD • Space to talk</div>}
            {activeDialogue && (
                <DialogueBox 
                    text={activeDialogue.pages[activeDialogue.currentPageIndex].text} 
                    speakerName={activeDialogue.speaker}
                    onComplete={handleNextPage}
                    isLastPage={activeDialogue.currentPageIndex === activeDialogue.pages.length - 1}
                />
            )}
        </div>
    );
};
