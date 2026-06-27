'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { resolveAssetUrl } from '@/lib/api';

interface CustomAudioPlayerProps {
  src: string;
}

export default function CustomAudioPlayer({ src }: CustomAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => console.warn('Erro ao reproduzir áudio:', err));
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!audioRef.current) return;

    const newMuted = !isMuted;
    audioRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === Infinity) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-4 w-full bg-black/40 border border-white/5 rounded-2xl p-3 sm:px-4 backdrop-blur-md" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
      <audio
        ref={audioRef}
        src={resolveAssetUrl(src)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        preload="metadata"
      />

      {/* Botão de Play/Pause */}
      <button
        onClick={togglePlay}
        className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-if-purple hover:bg-if-purple/80 text-white transition-all shadow-lg active:scale-95"
        aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
      >
        {isPlaying ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current ml-0.5" />}
      </button>

      {/* Tempo Atual */}
      <span className="text-xs font-mono text-if-text/60 shrink-0 select-none">
        {formatTime(currentTime)}
      </span>

      {/* Barra de Progresso */}
      <input
        type="range"
        min={0}
        max={duration || 100}
        value={currentTime}
        onChange={handleSeek}
        className="w-full flex-1 h-1.5 rounded-lg appearance-none cursor-pointer bg-white/10 accent-if-purple transition-all hover:bg-white/20 focus:outline-none"
        style={{
          background: `linear-gradient(to right, #8F9972 0%, #8F9972 ${progressPercentage}%, rgba(255, 255, 255, 0.1) ${progressPercentage}%, rgba(255, 255, 255, 0.1) 100%)`
        }}
      />

      {/* Duração Total */}
      <span className="text-xs font-mono text-if-text/60 shrink-0 select-none">
        {formatTime(duration)}
      </span>

      {/* Botão de Mute */}
      <button
        onClick={toggleMute}
        className="p-2 shrink-0 text-if-text/50 hover:text-if-purple transition-colors active:scale-95"
        aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
      >
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </div>
  );
}
