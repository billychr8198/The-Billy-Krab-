import { useEffect, useRef, useState } from 'react';
import { useApp } from '../lib/store';

/**
 * House music. Browsers block autoplay until someone interacts with the page,
 * so this starts muted-by-default and only plays on an explicit press. The
 * choice is remembered, and a later visit resumes on the first click anywhere.
 */
export default function MusicPlayer() {
  const { state, toggleMusic } = useApp();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = 0.32;

    if (!state.musicOn) {
      el.pause();
      setBlocked(false);
      return;
    }

    el.play().then(
      () => setBlocked(false),
      () => {
        // Autoplay refused. Wait for any gesture, then try once more.
        setBlocked(true);
        const retry = () => {
          el.play().then(
            () => setBlocked(false),
            () => undefined
          );
          window.removeEventListener('pointerdown', retry);
          window.removeEventListener('keydown', retry);
        };
        window.addEventListener('pointerdown', retry, { once: true });
        window.addEventListener('keydown', retry, { once: true });
      }
    );
  }, [state.musicOn]);

  return (
    <>
      <audio ref={audioRef} src="./audio/rake-hornpipe.mp3" loop preload="none" />
      <button
        onClick={toggleMusic}
        aria-pressed={state.musicOn}
        title={state.musicOn ? 'Turn the music off' : 'Turn the music on'}
        className={`btn rounded-xl border px-3 py-2 text-xs transition ${
          state.musicOn
            ? 'border-brass/60 bg-brass/15 text-brass'
            : 'border-white/15 bg-white/5 text-parchment/60 hover:text-parchment'
        }`}
      >
        <span aria-hidden className={state.musicOn ? 'animate-sway inline-block' : 'inline-block'}>
          {state.musicOn ? '🎺' : '🔇'}
        </span>
        <span className="hidden sm:inline">
          {state.musicOn ? (blocked ? 'Tap to start' : 'Music on') : 'Music off'}
        </span>
      </button>
    </>
  );
}
