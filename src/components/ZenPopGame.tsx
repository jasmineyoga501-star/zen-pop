import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import confetti from 'canvas-confetti';

type Level = 1 | 2 | 3;

interface Bubble {
    id: number;
    x: number;
    y: number;
    size: number;
    text: string;
    popped: boolean;
    color: string;
    vx: number;
    vy: number;
}

const WORDS = ['ZEN', 'POP', 'JOY', 'LUX', 'FLOW', 'HEAL', 'CALM', 'PURE'];
const COLORS = {
    1: ['#ffd1dc', '#dec9ff', '#bae1ff'],
    2: ['#74ebd5', '#9face6', '#2af598'],
    3: ['#f6d365', '#fda085', '#ff9a9e']
};

export const ZenPopGame: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);

    const [level, setLevel] = useState<Level>(1);
    const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);
    const [bubbles, setBubbles] = useState<Bubble[]>([]);

    // Game Stats
    const [coins, setCoins] = useState(0);
    const [combo, setCombo] = useState(0);
    const [lastColor, setLastColor] = useState<string | null>(null);
    const [popMessage, setPopMessage] = useState<{ text: string, x: number, y: number } | null>(null);

    // Sound Engine: Enhanced for different levels
    const playSound = useCallback((type: Level, isCombo: boolean = false) => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        if (type === 1) {
            // Lv 1: Tinkle (High pitch, clean)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
        } else if (type === 2) {
            // Lv 2: Bubble Pop (Low to high sweep)
            osc.type = 'triangle';
            const baseFreq = isCombo ? 600 + (combo * 100) : 400;
            osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.05);
        } else {
            // Lv 3: Powerful Pop (Noise-like, fast)
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
        }

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    }, [combo]);

    const createBubble = useCallback((id: number, currentLevel: Level): Bubble => {
        const palette = COLORS[currentLevel];
        const text = currentLevel === 1
            ? String.fromCharCode(65 + Math.floor(Math.random() * 26))
            : WORDS[Math.floor(Math.random() * WORDS.length)];

        return {
            id: Date.now() + id + Math.random(),
            x: Math.random() * 80 + 10,
            y: currentLevel === 2 ? 110 : (Math.random() * 60 + 20),
            size: currentLevel === 1 ? 90 : (currentLevel === 2 ? 110 : 70),
            text,
            popped: false,
            color: palette[Math.floor(Math.random() * palette.length)],
            vx: currentLevel === 3 ? (Math.random() - 0.5) * 4 : 0,
            vy: currentLevel === 2 ? -(Math.random() * 0.8 + 0.4) : (currentLevel === 3 ? (Math.random() - 0.5) * 4 : 0)
        };
    }, []);

    const handlePopLogic = (b: Bubble, bx: number, by: number) => {
        let earned = 0;
        let message = "";

        if (level === 1) {
            earned = 1;
            message = "+1 Coin";
            playSound(1);
        } else if (level === 2) {
            if (b.color === lastColor) {
                const newCombo = combo + 1;
                setCombo(newCombo);
                earned = 2 * newCombo;
                message = `Combo x${newCombo}! +${earned}`;
                playSound(2, true);
            } else {
                setCombo(1);
                setLastColor(b.color);
                earned = 2;
                message = "+2 Coin";
                playSound(2, false);
            }
        } else {
            // Level 3: Harder, Higher Reward
            earned = 5;
            message = "SPEED! +5";
            playSound(3);
        }

        setCoins(prev => prev + earned);
        setPopMessage({ text: message, x: bx, y: by });
        setTimeout(() => setPopMessage(null), 800);

        confetti({
            particleCount: 20,
            origin: { x: (bx + canvasRef.current!.getBoundingClientRect().left) / window.innerWidth, y: (by + canvasRef.current!.getBoundingClientRect().top) / window.innerHeight },
            colors: [b.color, '#ffffff']
        });
    };

    useEffect(() => {
        const init = async () => {
            const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
            const landmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                    delegate: "GPU"
                },
                runningMode: "VIDEO"
            });
            setHandLandmarker(landmarker);

            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 900, height: 600 } });
            if (videoRef.current) videoRef.current.srcObject = stream;
        };
        init();
    }, []);

    useEffect(() => {
        const initial = [];
        const count = level === 3 ? 15 : 10;
        for (let i = 0; i < count; i++) initial.push(createBubble(i, level));
        setBubbles(initial);
        setCombo(0);
        setLastColor(null);
    }, [level, createBubble]);

    useEffect(() => {
        let frameId: number;
        const loop = () => {
            if (handLandmarker && videoRef.current && canvasRef.current) {
                const results = handLandmarker.detectForVideo(videoRef.current, performance.now());
                const ctx = canvasRef.current.getContext('2d');
                if (!ctx) return;
                ctx.clearRect(0, 0, 900, 600);

                setBubbles(prev => {
                    const next = prev.map(b => {
                        if (b.popped) return b;
                        let nx = b.x + b.vx;
                        let ny = b.y + b.vy;
                        if (level === 3) {
                            if (nx < 10 || nx > 90) b.vx *= -1;
                            if (ny < 10 || ny > 90) b.vy *= -1;
                        }
                        if (level === 2 && ny < -10) ny = 110;
                        return { ...b, x: nx, y: ny };
                    });

                    if (results.landmarks && results.landmarks[0]) {
                        const tip = results.landmarks[0][8];
                        const hx = (1 - tip.x) * 900;
                        const hy = tip.y * 600;

                        ctx.beginPath();
                        ctx.arc(hx, hy, 12, 0, Math.PI * 2);
                        ctx.fillStyle = 'rgba(255,255,255,0.8)';
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = 'white';
                        ctx.fill();

                        return next.map(b => {
                            if (b.popped) return b;
                            const bx = (b.x / 100) * 900;
                            const by = (b.y / 100) * 600;
                            const dist = Math.sqrt((hx - bx) ** 2 + (hy - by) ** 2);

                            if (dist < b.size / 2) {
                                handlePopLogic(b, bx, by);
                                return { ...b, popped: true };
                            }
                            return b;
                        });
                    }
                    return next;
                });

                setBubbles(current => {
                    if (current.some(b => b.popped)) {
                        const alive = current.filter(b => !b.popped);
                        while (alive.length < (level === 3 ? 15 : 10)) {
                            alive.push(createBubble(alive.length, level));
                        }
                        return alive;
                    }
                    return current;
                });
            }
            frameId = requestAnimationFrame(loop);
        };
        loop();
        return () => cancelAnimationFrame(frameId);
    }, [handLandmarker, level, createBubble, combo, lastColor]);

    return (
        <div className={`zen-container bg-level-${level}`}>
            <div className="glass-panel" style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 100, display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffD700' }}>
                    🪙 {coins.toLocaleString()}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {[1, 2, 3].map(num => (
                        <button key={num} onClick={() => setLevel(num as Level)} className={`level-btn ${level === num ? 'active' : ''}`}>
                            Lv.{num}
                        </button>
                    ))}
                </div>
            </div>

            {combo > 1 && level === 2 && (
                <div style={{ position: 'fixed', top: '100px', left: '50%', transform: 'translateX(-50%)', fontSize: '3rem', fontWeight: 'bold', color: 'white', textShadow: '0 0 20px rgba(0,255,100,0.5)', zIndex: 50 }}>
                    {combo} COMBO!
                </div>
            )}

            <div className="zen-stage">
                <video ref={videoRef} autoPlay playsInline muted style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', opacity: 0.1 }} />
                <canvas ref={canvasRef} width={900} height={600} style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }} />

                {popMessage && (
                    <div style={{ position: 'absolute', left: popMessage.x, top: popMessage.y - 40, transform: 'translateX(-50%)', color: 'white', fontWeight: 'bold', fontSize: '1.2rem', zIndex: 100, pointerEvents: 'none', animation: 'floatUp 0.8s ease-out' }}>
                        {popMessage.text}
                    </div>
                )}

                <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
                    {bubbles.map(b => (
                        <div key={b.id} className="bubble" style={{
                            left: `${b.x}%`,
                            top: `${b.y}%`,
                            width: `${b.size}px`,
                            height: `${b.size}px`,
                            backgroundColor: b.color,
                            fontSize: level === 1 ? '2.5rem' : '1.5rem',
                            opacity: b.popped ? 0 : 1,
                            border: level === 2 && b.color === lastColor ? '4px solid white' : 'none',
                            boxShadow: level === 2 && b.color === lastColor ? '0 0 15px white' : ''
                        }}>
                            <span className="bubble-text">{b.text}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ position: 'fixed', bottom: '20px', color: 'white', opacity: 0.7 }}>
                {level === 1 && "Level 1: 기본 보상 +1 코인"}
                {level === 2 && "Level 2: 같은 색 연속 터치시 콤보 보너스! (2x, 4x, 6x...)"}
                {level === 3 && "Level 3: 고위험 고수익! 마구 터뜨리세요 (+5 코인)"}
            </div>

            <style>{`
        @keyframes floatUp {
          from { transform: translate(-50%, 0); opacity: 1; }
          to { transform: translate(-50%, -60px); opacity: 0; }
        }
      `}</style>
        </div>
    );
};
