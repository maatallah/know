'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Video, X, Square, Play, Upload, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CameraRecorderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (file: File) => Promise<void>;
}

export function CameraRecorderModal({ isOpen, onClose, onUpload }: CameraRecorderModalProps) {
    const t = useTranslations('common');
    const [mode, setMode] = useState<'PHOTO' | 'VIDEO'>('VIDEO');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [uploading, setUploading] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const playbackRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        if (isOpen && !recordedBlob) {
            startCamera();
        } else if (!isOpen) {
            stopCamera();
            setRecordedBlob(null);
        }
        return () => stopCamera();
    }, [isOpen, recordedBlob]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }, // Prefer back camera
                audio: mode === 'VIDEO'
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert(t('cameraError') || "Could not access camera/microphone.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const startRecording = () => {
        if (!stream) return;
        chunksRef.current = [];
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            setRecordedBlob(blob);
            stopCamera();
            if (playbackRef.current) {
                playbackRef.current.src = URL.createObjectURL(blob);
            }
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const takePhoto = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (blob) {
                setRecordedBlob(blob);
                stopCamera();
            }
        }, 'image/jpeg', 0.9);
    };

    const handleUpload = async () => {
        if (!recordedBlob) return;
        setUploading(true);

        const ext = recordedBlob.type.includes('video') ? 'webm' : 'jpg';
        const filename = `recording-${Date.now()}.${ext}`;
        const file = new File([recordedBlob], filename, { type: recordedBlob.type });

        try {
            await onUpload(file);
            onClose();
            setRecordedBlob(null);
        } catch (error) {
            console.error(error);
            alert(t('uploadFailed') || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const retry = () => {
        setRecordedBlob(null);
        startCamera();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
            <div className="relative w-full max-w-2xl rounded-2xl bg-card border border-border overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border p-4 bg-muted/30">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        {mode === 'VIDEO' ? <Video className="w-5 h-5 text-red-500" /> : <Camera className="w-5 h-5 text-blue-500" />}
                        {recordedBlob ? t('preview') : (mode === 'VIDEO' ? t('recordVideo') : t('takePhoto'))}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body (Video/Preview) */}
                <div className="relative aspect-video bg-black flex items-center justify-center">
                    {!recordedBlob ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        mode === 'VIDEO' ? (
                            <video
                                ref={playbackRef}
                                controls
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <img
                                src={URL.createObjectURL(recordedBlob)}
                                alt="Preview"
                                className="w-full h-full object-contain"
                            />
                        )
                    )}

                    {/* Recording Indicator */}
                    {isRecording && (
                        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 text-white px-3 py-1.5 rounded-full text-sm font-medium animate-pulse">
                            <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                            {t('recording')}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 flex items-center justify-between bg-muted/30">
                    {!recordedBlob ? (
                        <>
                            {/* Mode Switcher */}
                            <div className="flex bg-accent rounded-lg p-1">
                                <button
                                    onClick={() => { setMode('PHOTO'); stopCamera(); setRecordedBlob(null); }}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'PHOTO' ? 'bg-background shadow' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {t('photo')}
                                </button>
                                <button
                                    onClick={() => { setMode('VIDEO'); stopCamera(); setRecordedBlob(null); }}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'VIDEO' ? 'bg-background shadow' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {t('video')}
                                </button>
                            </div>

                            {/* Action Button */}
                            <div className="flex justify-center flex-1">
                                {mode === 'VIDEO' ? (
                                    !isRecording ? (
                                        <button
                                            onClick={startRecording}
                                            className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg border-4 border-red-200"
                                        >
                                            <div className="w-4 h-4 bg-white rounded-full" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={stopRecording}
                                            className="w-14 h-14 bg-white border-4 border-red-500 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg text-red-500"
                                        >
                                            <Square className="w-5 h-5" fill="currentColor" />
                                        </button>
                                    )
                                ) : (
                                    <button
                                        onClick={takePhoto}
                                        className="w-14 h-14 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg border-4 border-gray-300"
                                    >
                                        <div className="w-12 h-12 rounded-full border border-gray-400" />
                                    </button>
                                )}
                            </div>

                            <div className="w-24" /> {/* Spacer for centering */}
                        </>
                    ) : (
                        <div className="flex items-center justify-between w-full">
                            <button
                                onClick={retry}
                                disabled={uploading}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-accent transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className="w-4 h-4" />
                                {t('retake')}
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow disabled:opacity-50"
                            >
                                {uploading ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                {uploading ? t('uploading') : t('useMedia')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
