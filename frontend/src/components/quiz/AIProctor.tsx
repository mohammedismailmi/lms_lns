import React, { useEffect, useRef, useState } from 'react';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@mediapipe/face_mesh';
import { useQuizStore } from '../../store/quizStore';

interface AIProctorProps {
    onViolation: () => void;
}

export default function AIProctor({ onViolation }: AIProctorProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [modelLoaded, setModelLoaded] = useState(false);
    
    const incrementProctoringLog = useQuizStore(state => state.incrementProctoringLog);
    const activeViolations = useRef({
        multipleFaces: false,
        noFace: false,
        headTurn: false,
        gaze: false,
        audio: false
    });

    // Tracking state
    const pupilHistory = useRef<{x: number, y: number}[]>([]);
    const violationTimer = useRef<number | null>(null);

    // Audio and Camera tracking
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContext = useRef<AudioContext | null>(null);
    const analyser = useRef<AnalyserNode | null>(null);

    useEffect(() => {
        let detector: faceLandmarksDetection.FaceLandmarksDetector | null = null;
        let animationFrameId: number;

        const initAudio = async (stream: MediaStream) => {
            audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContext.current.createMediaStreamSource(stream);
            analyser.current = audioContext.current.createAnalyser();
            analyser.current.fftSize = 256;
            source.connect(analyser.current);
        };

        const initAI = async () => {
            try {
                // Use ideal constraints and facingMode for broad device support (especially mobile)
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } }, 
                    audio: true 
                });
                mediaStreamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await new Promise((resolve) => {
                        videoRef.current!.onloadedmetadata = () => {
                            resolve(null);
                        };
                    });
                    videoRef.current.play();
                }

                await initAudio(stream);

                const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
                const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig = {
                    runtime: 'mediapipe',
                    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
                    maxFaces: 2, // Track up to 2 faces to detect multiple people
                    refineLandmarks: true, // Required for pupil tracking
                };
                
                detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
                setModelLoaded(true);
                
                detectLoop(detector);
            } catch (err) {
                console.error("AI Proctoring Init Error:", err);
            }
        };

        let smoothedBox = { xMin: 0, yMin: 0, width: 0, height: 0 };
        let boxInitialized = false;
        let framesWithoutFace = 0;

        const detectLoop = async (faceDetector: faceLandmarksDetection.FaceLandmarksDetector) => {
            if (!videoRef.current || !canvasRef.current || !faceDetector) return;

            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Match canvas size to video
            if (canvas.width !== video.videoWidth) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }

            let isViolating = false;

            try {
                const faces = await faceDetector.estimateFaces(video, { flipHorizontal: false });

                let faceChecks = {
                    multipleFaces: false,
                    noFace: false,
                    headTurn: false,
                    gaze: false,
                    audio: false
                };

                // 1. Multiple Faces or No Face Check
                if (faces.length > 1) {
                    isViolating = true;
                    faceChecks.multipleFaces = true;
                } else if (faces.length === 0) {
                    isViolating = true;
                    faceChecks.noFace = true;
                }

                if (faces.length > 0) {
                    const face = faces[0];
                    const box = face.box;

                    // Initialize or LERP the bounding box to prevent blinking/jitter
                    if (!boxInitialized) {
                        smoothedBox = { ...box };
                        boxInitialized = true;
                    } else {
                        smoothedBox.xMin += (box.xMin - smoothedBox.xMin) * 0.3;
                        smoothedBox.yMin += (box.yMin - smoothedBox.yMin) * 0.3;
                        smoothedBox.width += (box.width - smoothedBox.width) * 0.3;
                        smoothedBox.height += (box.height - smoothedBox.height) * 0.3;
                    }

                    // 2. Head Pose (looking away)
                    const nose = face.keypoints.find(k => k.name === 'noseTip') || face.keypoints[1];
                    const leftEye = face.keypoints.find(k => k.name === 'leftEye') || face.keypoints[159];
                    const rightEye = face.keypoints.find(k => k.name === 'rightEye') || face.keypoints[386];
                    
                    if (nose && leftEye && rightEye) {
                        const midEyeX = (leftEye.x + rightEye.x) / 2;
                        const eyeDist = Math.abs(leftEye.x - rightEye.x);
                        if (Math.abs(nose.x - midEyeX) > eyeDist * 0.7) {
                            isViolating = true; // Looking away
                            faceChecks.headTurn = true;
                        }
                    }

                    // 3. Precise Iris Tracking (Gaze Detection)
                    // MediaPipe Face Mesh with refineLandmarks gives 478 points.
                    // 468 = Left Iris center, 33 = Left Eye Inner Corner, 133 = Left Eye Outer Corner
                    if (face.keypoints.length >= 478) {
                        const leftIris = face.keypoints[468];
                        const leftInner = face.keypoints[133];
                        const leftOuter = face.keypoints[33];

                        const eyeWidth = Math.hypot(leftOuter.x - leftInner.x, leftOuter.y - leftInner.y);
                        const irisDist = Math.hypot(leftIris.x - leftInner.x, leftIris.y - leftInner.y);
                        
                        if (eyeWidth > 0) {
                            const ratio = irisDist / eyeWidth;
                            // Normal gaze is roughly 0.4 to 0.6. Outside means looking hard left or right
                            if (ratio < 0.25 || ratio > 0.75) {
                                isViolating = true;
                                faceChecks.gaze = true;
                            }
                        }
                    }

                    // 4. Audio check (Loud background noise/talking)
                    if (analyser.current) {
                        const dataArray = new Uint8Array(analyser.current.frequencyBinCount);
                        analyser.current.getByteFrequencyData(dataArray);
                        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                        if (average > 40) { // Threshold for speech/noise
                            isViolating = true;
                            faceChecks.audio = true;
                        }
                    }

                    // Log unique violation starts
                    if (faceChecks.multipleFaces && !activeViolations.current.multipleFaces) {
                        incrementProctoringLog('multipleFaces');
                    }
                    if (faceChecks.noFace && !activeViolations.current.noFace) {
                        incrementProctoringLog('noFace');
                    }
                    if (faceChecks.headTurn && !activeViolations.current.headTurn) {
                        incrementProctoringLog('headTurns');
                    }
                    if (faceChecks.gaze && !activeViolations.current.gaze) {
                        incrementProctoringLog('gazeViolations');
                    }
                    if (faceChecks.audio && !activeViolations.current.audio) {
                        incrementProctoringLog('audioViolations');
                    }
                    
                    activeViolations.current = faceChecks;

                    // Draw Smoothed Bounding Box
                    framesWithoutFace = 0;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.strokeStyle = isViolating ? '#EF4444' : '#10B981'; // Red if violating, Green if normal
                    ctx.lineWidth = 4;
                    ctx.strokeRect(smoothedBox.xMin, smoothedBox.yMin, smoothedBox.width, smoothedBox.height);
                } else {
                    // No faces detected
                    isViolating = true;
                    if (!activeViolations.current.noFace) {
                        incrementProctoringLog('noFace');
                    }
                    activeViolations.current.noFace = true;
                    activeViolations.current.multipleFaces = false;
                    activeViolations.current.headTurn = false;
                    activeViolations.current.gaze = false;
                    
                    framesWithoutFace++;
                    
                    if (framesWithoutFace < 15 && boxInitialized) {
                        // Grace period: keep drawing the last known box as red
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.strokeStyle = '#EF4444';
                        ctx.lineWidth = 4;
                        ctx.strokeRect(smoothedBox.xMin, smoothedBox.yMin, smoothedBox.width, smoothedBox.height);
                    } else {
                        // Truly lost face
                        boxInitialized = false;
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.strokeStyle = '#EF4444';
                        ctx.lineWidth = 6;
                        ctx.strokeRect(0, 0, canvas.width, canvas.height);
                    }
                }

                // Handle sustained violations
                if (isViolating) {
                    if (!violationTimer.current) {
                        violationTimer.current = window.setTimeout(() => {
                            onViolation();
                            violationTimer.current = null;
                        }, 5000); // 5 seconds of sustained violation triggers a tab switch violation
                    }
                } else {
                    if (violationTimer.current) {
                        clearTimeout(violationTimer.current);
                        violationTimer.current = null;
                    }
                }

            } catch (e) {
                // ignore
            }

            animationFrameId = requestAnimationFrame(() => detectLoop(faceDetector));
        };

        initAI();

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (detector) detector.dispose();
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(t => t.stop());
            }
            if (audioContext.current) audioContext.current.close();
        };
    }, [onViolation]);

    return (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-black/50 pointer-events-none">
            {!modelLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-navy/80 text-white text-xs font-bold p-2 text-center z-10 backdrop-blur-sm">
                    Loading AI Proctor...
                </div>
            )}
            <video 
                ref={videoRef} 
                className="w-48 h-36 object-cover bg-black" 
                playsInline 
                muted 
            />
            <canvas 
                ref={canvasRef} 
                className="absolute inset-0 w-full h-full pointer-events-none" 
            />
        </div>
    );
}
