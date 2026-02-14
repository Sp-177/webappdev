import { useEffect, useMemo, useRef, useState } from 'react';

export default function App() {
  const [stage, setStage] = useState('closed');
  // closed -> opening -> open

  const isOpening = stage === 'opening';
  const isOpen = stage === 'open';

  // ============================
  // ASSETS (YOU WILL RENAME)
  // ============================
  const yesImages = useMemo(
    () => ['../src/assets/yes1.png', '../src/assets/yes2.png', '../src/assets/yes3.png'],
    []
  );

  const noPopupImage = '../src/assets/rejection.jpeg';
  const yesVideo = '../src/assets/yes_video.mp4';

  // Audio
  const bgRomantic = '../src/assets/bg.mp3';
  const noPopupSfx = '../src/assets/no_song.wav';
  const yesSong = '../src/assets/yes_song.mp3';

  // ============================
  // Floating hearts background
  // ============================
  const hearts = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      left: `${4 + Math.random() * 92}%`,
      top: `${6 + Math.random() * 86}%`,
      size: 14 + Math.floor(Math.random() * 20),
      delay: `${Math.random() * 2.5}s`,
      duration: `${5 + Math.random() * 4}s`,
      opacity: 0.08 + Math.random() * 0.16,
      emoji: ['💗', '💖', '💕', '✨'][i % 4],
    }));
  }, []);

  // ============================
  // NO running
  // ============================
  const noCountRef = useRef(0);
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });

  // ============================
  // Popups
  // ============================
  const [showNoPopup, setShowNoPopup] = useState(false);
  const [showYesPopup, setShowYesPopup] = useState(false);

  // ============================
  // YES push mode after NO popup
  // ============================
  const [pushMode, setPushMode] = useState(false);
  const [pushStep, setPushStep] = useState(0); // 0..4
  const pushTimerRef = useRef(null);

  // ============================
  // YES carousel
  // ============================
  const [yesIndex, setYesIndex] = useState(0);

  // ============================
  // AUDIO REFS
  // ============================
  const bgRef = useRef(null);
  const noSfxRef = useRef(null);
  const yesRef = useRef(null);

  // user gesture unlock
  const hasInteractedRef = useRef(false);

  // ============================
  // AUDIO HELPERS
  // ============================
  const stop = (ref) => {
    if (!ref?.current) return;
    ref.current.pause();
    ref.current.currentTime = 0;
  };

  const pause = (ref) => {
    if (!ref?.current) return;
    ref.current.pause();
  };

  const play = async (ref) => {
    if (!ref?.current) return;
    try {
      await ref.current.play();
    } catch {
      // browser blocks sometimes until gesture
    }
  };

  const startBG = async () => {
    if (!hasInteractedRef.current) return;
    if (!bgRef.current) return;
    if (showYesPopup) return;

    bgRef.current.loop = true;
    bgRef.current.volume = 0.33;
    await play(bgRef);
  };

  const stopAll = () => {
    stop(bgRef);
    stop(noSfxRef);
    stop(yesRef);
  };

  // ============================
  // Stop all audio when tab hidden
  // ============================
  useEffect(() => {
    const onBlur = () => stopAll();
    const onVisibility = () => {
      if (document.hidden) stopAll();
    };

    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // ============================
  // YES carousel autoplay
  // ============================
  useEffect(() => {
    if (!showYesPopup) return;

    const id = setInterval(() => {
      setYesIndex((p) => (p + 1) % yesImages.length);
    }, 2200);

    return () => clearInterval(id);
  }, [showYesPopup, yesImages.length]);

  // ============================
  // NO POPUP AUDIO (instant)
  // ============================
  useEffect(() => {
    if (!hasInteractedRef.current) return;

    if (showNoPopup) {
      pause(bgRef);
      stop(yesRef);

      if (noSfxRef.current) {
        noSfxRef.current.loop = true;
        noSfxRef.current.volume = 0.7;
        play(noSfxRef);
      }
    } else {
      stop(noSfxRef);
      if (!showYesPopup) startBG();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNoPopup]);

  // ============================
  // YES POPUP AUDIO (instant)
  // ============================
  useEffect(() => {
    if (!hasInteractedRef.current) return;

    if (showYesPopup) {
      pause(bgRef);
      stop(noSfxRef);

      if (yesRef.current) {
        yesRef.current.loop = true;
        yesRef.current.volume = 0.85;
        play(yesRef);
      }
    } else {
      stop(yesRef);
      if (!showNoPopup) startBG();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showYesPopup]);

  // ============================
  // Push timer cleanup
  // ============================
  const clearPushTimer = () => {
    if (pushTimerRef.current) {
      clearInterval(pushTimerRef.current);
      pushTimerRef.current = null;
    }
  };

  // ============================
  // Envelope open (FIRST CLICK)
  // ============================
  const openEnvelope = async () => {
    if (stage !== 'closed') return;

    // unlock audio
    hasInteractedRef.current = true;

    // start BG immediately (fastest)
    await startBG();

    setStage('opening');
    setTimeout(() => setStage('open'), 1050);
  };

  // ============================
  // Reset buttons
  // ============================
  const resetButtons = () => {
    clearPushTimer();
    setPushMode(false);
    setPushStep(0);

    setNoPos({ x: 0, y: 0 });
    noCountRef.current = 0;
  };

  // ============================
  // Reset all
  // ============================
  const resetAll = () => {
    resetButtons();

    setShowNoPopup(false);
    setShowYesPopup(false);
    setYesIndex(0);

    stopAll();
    setStage('closed');
  };

  // ============================
  // Push sequence (YES pushes NO)
  // ============================
  const startPushSequence = () => {
    clearPushTimer();
    setPushMode(true);
    setPushStep(0);

    setNoPos({ x: 0, y: 0 });

    let step = 0;
    pushTimerRef.current = setInterval(() => {
      step += 1;
      setPushStep(step);

      if (step >= 4) {
        clearPushTimer();
      }
    }, 520);
  };

  // ============================
  // Close popups
  // ============================
  const closePopups = () => {
    if (showNoPopup) startPushSequence();

    setShowNoPopup(false);
    setShowYesPopup(false);

    // BG will auto resume from useEffect
  };

  // ============================
  // NO movement (bounded)
  // ============================
  const moveNo = () => {
    if (!isOpen) return;
    if (pushMode) return;

    noCountRef.current += 1;

    const maxX = 110;
    const maxY = 55;

    const x = (Math.random() * 2 - 1) * maxX;
    const y = (Math.random() * 2 - 1) * maxY;

    setNoPos({ x, y });

    if (noCountRef.current >= 5) {
      setShowNoPopup(true);
      noCountRef.current = 0;
    }
  };

  // ============================
  // YES click
  // ============================
  const clickYes = () => {
    resetButtons();
    setShowYesPopup(true);
    setYesIndex(0);
  };

  // ============================
  // Push layout math
  // ============================
  const noScale = pushMode ? Math.max(0.55, 1 - pushStep * 0.12) : 1;
  const noSideX = pushMode ? Math.min(170, pushStep * 55) : 0;
  const yesGrow = pushMode ? 1 + Math.min(0.2, pushStep * 0.06) : 1;

  const yesNudgeClass =
    pushMode && pushStep > 0 && pushStep < 4 ? 'animate-[yesPush_0.28s_ease-out]' : '';

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#F9A8D4] via-[#FFF7FB] to-[#C4B5FD] flex items-center justify-center p-6">
      {/* AUDIO ELEMENTS ALWAYS MOUNTED (IMPORTANT) */}
      <audio ref={bgRef} src={bgRomantic} preload="auto" />
      <audio ref={noSfxRef} src={noPopupSfx} preload="auto" />
      <audio ref={yesRef} src={yesSong} preload="auto" />

      {/* Reset */}
      <button
        onClick={resetAll}
        className="fixed top-5 right-5 z-[80] rounded-full border border-white/60 bg-white/65 backdrop-blur-xl px-4 py-2 text-xs font-semibold text-slate-700 shadow-lg hover:bg-white transition"
      >
        Reset ↺
      </button>

      {/* Soft blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#F43F5E]/14 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-[#C4B5FD]/25 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-white/28 blur-3xl" />

      {/* Floating hearts */}
      <div className="pointer-events-none absolute inset-0">
        {hearts.map((h) => (
          <div
            key={h.id}
            className="absolute animate-[floatUp_var(--dur)_ease-in-out_infinite]"
            style={{
              left: h.left,
              top: h.top,
              fontSize: `${h.size}px`,
              opacity: h.opacity,
              animationDelay: h.delay,
              ['--dur']: h.duration,
            }}
          >
            {h.emoji}
          </div>
        ))}
      </div>

      {/* ENVELOPE VIEW */}
      <div
        className={[
          'relative w-full max-w-3xl flex items-center justify-center',
          isOpen ? 'pointer-events-none opacity-0 scale-[0.97]' : 'opacity-100',
          'transition-all duration-700',
        ].join(' ')}
      >
        <div
          onClick={openEnvelope}
          className={[
            'relative select-none',
            stage === 'closed' ? 'cursor-pointer' : 'cursor-default',
            stage === 'closed' ? 'hover:scale-[1.03]' : '',
            'transition-transform duration-500',
          ].join(' ')}
        >
          <div
            className={[
              'relative w-[360px] sm:w-[460px] h-[250px] sm:h-[310px]',
              isOpening ? 'animate-[envelopeDip_1.05s_ease-in-out]' : '',
            ].join(' ')}
          >
            {/* Back */}
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-[#F43F5E] to-[#FB7185] shadow-[0_30px_95px_rgba(244,63,94,0.33)] border-4 border-white/35" />
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]" />

            {/* Letter */}
            <div
              className={[
                'absolute left-1/2 -translate-x-1/2 w-[80%] h-[74%] rounded-2xl bg-white/95 border-2 border-white/70',
                'shadow-[0_18px_55px_rgba(0,0,0,0.16)]',
                'transition-all duration-[1050ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
                stage === 'closed' ? 'top-11' : isOpening ? '-top-14' : '-top-16',
              ].join(' ')}
              style={{
                transitionDelay: stage === 'opening' ? '220ms' : '0ms',
              }}
            >
              <div className="h-full w-full rounded-2xl bg-gradient-to-br from-white via-white to-[#FFF1F7]" />
            </div>

            {/* Flap */}
            <div
              className={[
                'absolute top-0 left-0 right-0 h-[44%] origin-top',
                'border-4 border-white/35',
                'bg-gradient-to-br from-[#F43F5E] to-[#FB7185]',
                'transition-transform duration-[1050ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
                stage === 'closed' ? 'rotate-0' : '-rotate-[34deg]',
              ].join(' ')}
              style={{
                clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              }}
            />

            {/* Front fold */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[58%] rounded-b-[2rem] border-4 border-white/25"
              style={{
                clipPath: 'polygon(0 0, 50% 55%, 100% 0, 100% 100%, 0 100%)',
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))',
              }}
            />

            {/* Wax seal */}
            <div className="absolute left-1/2 top-[54%] -translate-x-1/2 -translate-y-1/2 z-30">
              <div
                className={[
                  'h-20 w-20 rounded-full bg-[#F43F5E] border-4 border-white/75',
                  'shadow-[0_0_35px_rgba(244,63,94,0.55)]',
                  'flex items-center justify-center',
                  'transition-all duration-500',
                  stage === 'closed' ? 'scale-100 rotate-0' : 'scale-90 rotate-10 opacity-70',
                ].join(' ')}
              >
                <span className="text-4xl animate-pulse">💖</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OPEN VIEW */}
      {isOpen && (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="relative w-full max-w-4xl animate-[fadeIn_0.7s_ease-out]">
            <div className="relative rounded-[2.8rem] border border-white/60 bg-white/65 backdrop-blur-2xl shadow-[0_25px_110px_rgba(76,29,149,0.16)] overflow-hidden">
              <div className="pointer-events-none absolute inset-0 rounded-[2.8rem] border border-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]" />

              <div className="p-10 sm:p-16">
                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#F43F5E]">
                  Will you be mine Valentine, <span className="text-[#4C1D95]">Miss Garg</span>?
                </h1>

                <div className="mt-14">
                  <div className="relative w-full min-h-[260px] rounded-[2.4rem] border border-white/55 bg-white/35 backdrop-blur-xl p-7 overflow-hidden">
                    <div className="relative flex gap-6 items-center">
                      {/* YES */}
                      <button
                        onClick={clickYes}
                        className={[
                          'rounded-2xl bg-[#F43F5E] text-white py-5 text-sm sm:text-base font-extrabold tracking-wide',
                          'shadow-[0_18px_70px_rgba(244,63,94,0.45)] transition active:scale-[0.98]',
                          'hover:shadow-[0_18px_100px_rgba(244,63,94,0.65)]',
                          yesNudgeClass,
                        ].join(' ')}
                        style={{
                          width: pushMode ? '66%' : '50%',
                          transform: `scale(${yesGrow})`,
                          transition:
                            'width 520ms cubic-bezier(0.22,1,0.36,1), transform 520ms cubic-bezier(0.22,1,0.36,1)',
                        }}
                      >
                        YES 💍
                      </button>

                      {/* NO */}
                      <button
                        onMouseEnter={moveNo}
                        onClick={moveNo}
                        className="rounded-2xl border border-[#F43F5E]/20 bg-white/90 py-5 text-sm sm:text-base font-extrabold text-slate-700 shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition hover:bg-white active:scale-[0.98]"
                        style={{
                          width: pushMode ? '34%' : '50%',
                          transform: pushMode
                            ? `translateX(${noSideX}px) scale(${noScale})`
                            : `translate(${noPos.x}px, ${noPos.y}px)`,
                          transition: pushMode
                            ? 'transform 520ms cubic-bezier(0.22,1,0.36,1), width 520ms cubic-bezier(0.22,1,0.36,1)'
                            : 'transform 220ms cubic-bezier(0.22,1,0.36,1)',
                        }}
                      >
                        NO 🙃
                      </button>
                    </div>
                  </div>
                </div>

                <p className="mt-7 text-sm text-slate-700/70">(Dare: Try NO !! 😈)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay blur */}
      {(showNoPopup || showYesPopup) && (
        <div className="fixed inset-0 z-[90] bg-black/45 backdrop-blur-lg" />
      )}

      {/* NO Popup */}
      {showNoPopup && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-6">
          <div onClick={closePopups} className="absolute inset-0" />

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-[2rem] border border-white/25 bg-white/20 backdrop-blur-2xl shadow-[0_30px_120px_rgba(0,0,0,0.25)] overflow-hidden animate-[fadeIn_0.35s_ease-out]"
          >
            <div className="p-6">
              <div className="rounded-[1.6rem] overflow-hidden border border-white/20 shadow-lg">
                <img src={noPopupImage} alt="Stop" className="h-60 w-full object-cover" />
              </div>

              <p className="mt-5 text-lg font-extrabold text-white">
                Stop messing around with me 😤💗
              </p>
            </div>
          </div>
        </div>
      )}

      {/* YES Popup */}
      {showYesPopup && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-6">
          <div onClick={closePopups} className="absolute inset-0" />

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg sm:max-w-xl rounded-[2.2rem] border border-white/25 bg-white/20 backdrop-blur-2xl shadow-[0_30px_120px_rgba(0,0,0,0.25)] overflow-hidden animate-[fadeIn_0.35s_ease-out]"
          >
            <div className="p-6 sm:p-7">
              {/* Portrait Carousel */}
              <div className="relative rounded-[1.8rem] overflow-hidden border border-white/20 shadow-lg">
                <img
                  key={yesIndex}
                  src={yesImages[yesIndex]}
                  alt="Valentine"
                  className="h-[420px] sm:h-[520px] w-full object-cover object-center animate-[fadeIn_0.35s_ease-out]"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

                <div className="absolute bottom-5 left-5 right-5">
                  <p className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow">
                    You’re my favorite “yes.”
                  </p>

                  <p className="mt-2 text-sm sm:text-base text-white/85 leading-relaxed">
                    I’ll love you gently, loudly, and forever — in every little moment. your patttuuu 💗
                  </p>
                </div>
              </div>

              {/* Video below */}
              <div className="mt-3 rounded-[1.8rem] overflow-hidden border border-white/20 shadow-lg">
                <video
                  className="h-[220px] sm:h-[260px] w-full object-cover object-top"
                  src={yesVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes floatUp {
          0% { transform: translateY(0); }
          50% { transform: translateY(-18px); }
          100% { transform: translateY(0); }
        }
        @keyframes envelopeDip {
          0% { transform: translateY(0) scale(1); }
          35% { transform: translateY(7px) scale(0.995); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes yesPush {
          0% { transform: translateX(0); }
          45% { transform: translateX(12px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
