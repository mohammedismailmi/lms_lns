import React, { useEffect, useRef, useState } from 'react';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@mediapipe/face_mesh';
import { Camera, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
    onVerified: (verified: boolean) => void;
}

export default function PreExamCameraCheck({ onVerified }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState<'requesting' | 'loading_ai' | 'detecting' | 'verified' | 'error' | 'multiple_faces' | 'no_face'>('requesting');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        let detector: faceLandmarksDetection.FaceLandmarksDetector | null = null;
        let animationFrameId: number;

        const initCameraAndAI = async () => {
            try {
                // Use ideal constraints for better mobile compatibility
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } }, 
                    audio: true 
                });
                
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await new Promise((resolve) => {
                        videoRef.current!.onloadedmetadata = () => resolve(null);
                    });
                    videoRef.current.play();
                }

                setStatus('loading_ai');

                const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
                const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig = {
                    runtime: 'mediapipe',
                    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
                    maxFaces: 2, 
                    refineLandmarks: false, // Don't need iris for simple face verification
                };
                
                detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
                setStatus('detecting');
                
                detectLoop(detector);
            } catch (err: any) {
                console.error("Camera Init Error:", err);
                setStatus('error');
                setErrorMessage(err.name === 'NotAllowedError' ? 'Camera and Microphone access denied.' : 'Could not access camera.');
                onVerified(false);
            }
        };

        let verifiedFrames = 0;

        const detectLoop = async (faceDetector: faceLandmarksDetection.FaceLandmarksDetector) => {
            if (!videoRef.current || !faceDetector) return;

            try {
                const faces = await faceDetector.estimateFaces(videoRef.current, { flipHorizontal: false });

                if (faces.length === 1) {
                    verifiedFrames++;
                    if (verifiedFrames > 10 && status !== 'verified') {
                        setStatus('verified');
                        onVerified(true);
                    }
                } else {
                    verifiedFrames = 0;
                    if (faces.length > 1) {
                        setStatus('multiple_faces');
                    } else {
                        setStatus('no_face');
                    }
                    onVerified(false);
                }
            } catch (e) {
                // ignore
            }

            animationFrameId = requestAnimationFrame(() => detectLoop(faceDetector));
        };

        initCameraAndAI();

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (detector) detector.dispose();
            const stream = videoRef.current?.srcObject as MediaStream;
            if (stream) stream.getTracks().forEach(t => t.stop());
        };
    }, []);

    return (
        <div className="bg-slate-50 border border-border p-6 rounded-xl text-left mb-8 shadow-inner flex flex-col md:flex-row items-center gap-6">
            <div className="relative w-48 h-36 bg-black rounded-lg overflow-hidden shrink-0 shadow-md">
                <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover" 
                    playsInline 
                    muted 
                />
                {status !== 'verified' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white backdrop-blur-sm">
                        {status === 'requesting' && <Camera className="w-8 h-8 animate-pulse" />}
                        {status === 'loading_ai' && <Loader2 className="w-8 h-8 animate-spin" />}
                        {status === 'detecting' && <div className="text-center"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" /><span className="text-xs font-bold">Locating Face...</span></div>}
                        {status === 'error' && <AlertCircle className="w-8 h-8 text-red-500" />}
                    </div>
                )}
                {status === 'verified' && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1 shadow-md">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                )}
            </div>

            <div className="flex-1">
                <h3 className="font-bold text-navy mb-2 flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Pre-Exam Camera Verification
                </h3>
                
                {status === 'requesting' && <p className="text-sm text-muted">Please allow camera and microphone access in your browser.</p>}
                {status === 'loading_ai' && <p className="text-sm text-muted">Loading AI face detection models...</p>}
                {status === 'detecting' && <p className="text-sm text-highlight-foreground font-medium">Please look directly into the camera. Ensure only one face is visible.</p>}
                {status === 'error' && <p className="text-sm text-red-600 font-bold">{errorMessage} You cannot start the exam without a working camera.</p>}
                {status === 'multiple_faces' && <p className="text-sm text-red-600 font-bold">Multiple faces detected! Only one person is allowed in the frame.</p>}
                {status === 'no_face' && <p className="text-sm text-amber-600 font-bold">No face detected. Please ensure your face is clearly visible.</p>}
                
                {status === 'verified' && (
                    <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                        <p className="font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Identity Verified</p>
                        <p className="mt-1 opacity-90">Your camera is working and your face is clearly visible. You may now begin the exam.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
