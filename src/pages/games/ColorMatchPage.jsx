import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ArrowLeft, Brain, Heart, Zap, Play, RotateCcw, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

const ALL_COLORS = [
  { name: '빨강', hex: '#ef4444', ring: 'ring-red-400' },
  { name: '파랑', hex: '#3b82f6', ring: 'ring-blue-400' },
  { name: '초록', hex: '#22c55e', ring: 'ring-green-400' },
  { name: '노랑', hex: '#eab308', ring: 'ring-yellow-400' },
  { name: '보라', hex: '#a855f7', ring: 'ring-purple-400' },
  { name: '주황', hex: '#f97316', ring: 'ring-orange-400' },
];

const DIFFICULTIES = {
  easy:   { label: '쉬움',   colors: 4, start: 3200, min: 1400, dec: 60,  inc: 150 },
  normal: { label: '보통',   colors: 5, start: 2400, min: 1000, dec: 90,  inc: 180 },
  hard:   { label: '어려움', colors: 6, start: 1700, min: 650,  dec: 110, inc: 200 },
};

export default function ColorMatchPage() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('intro'); // intro, playing, gameover
  const [difficulty, setDifficulty] = useState('normal');
  const [palette, setPalette] = useState(ALL_COLORS.slice(0, 5));
  
  // 상태 변수들
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLimit, setTimeLimit] = useState(2400);
  const [timeLeft, setTimeLeft] = useState(2400);
  const [currentWord, setCurrentWord] = useState({ meaning: null, ink: null });
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); 

  // 최신 상태를 참조하기 위한 Ref들 (클로저 문제 방지)
  const stateRef = useRef({
    gameState: 'intro',
    lives: 3,
    timeLimit: 2400,
    difficulty: 'normal',
    currentWord: null,
    isProcessing: false // 타이머 오버나 클릭이 중복 처리되지 않게 락
  });

  const tickRef = useRef(null);
  const startTsRef = useRef(null);
  const totalPlayStartRef = useRef(null);
  const stageRef = useRef(null);

  // stateRef 동기화
  useEffect(() => {
    stateRef.current.gameState = gameState;
    stateRef.current.lives = lives;
    stateRef.current.timeLimit = timeLimit;
    stateRef.current.difficulty = difficulty;
    stateRef.current.currentWord = currentWord;
  }, [gameState, lives, timeLimit, difficulty, currentWord]);

  useEffect(() => {
    return () => {
      if (tickRef.current) cancelAnimationFrame(tickRef.current);
    };
  }, []);

  const pickWord = (currentPalette) => {
    const meaning = currentPalette[Math.floor(Math.random() * currentPalette.length)];
    let ink;
    do { ink = currentPalette[Math.floor(Math.random() * currentPalette.length)]; }
    while (ink.name === meaning.name);
    return { meaning, ink };
  };

  const triggerAnimation = (type) => {
    if (stageRef.current) {
      stageRef.current.classList.remove('animate-shake', 'bg-red-500/20', 'bg-green-500/20');
      void stageRef.current.offsetWidth;
      if (type === 'wrong') {
        stageRef.current.classList.add('animate-shake', 'bg-red-500/20');
      } else if (type === 'correct') {
        stageRef.current.classList.add('bg-green-500/20');
      }
      setTimeout(() => {
        if (stageRef.current) stageRef.current.classList.remove('animate-shake', 'bg-red-500/20', 'bg-green-500/20');
      }, 400);
    }
  };

  const saveScore = async (finalScore, finalElapsedTime, diffKey) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('game_scores').insert({
          user_id: user.id,
          game_type: 'color_match',
          score: finalScore,
          detail: { duration_sec: finalElapsedTime, difficulty: diffKey, completed: true }
        });
      }
    } catch (err) {
      console.error('점수 저장 실패:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGameOver = () => {
    if (tickRef.current) cancelAnimationFrame(tickRef.current);
    const finalElapsed = Math.floor((Date.now() - totalPlayStartRef.current) / 1000);
    setElapsedTime(finalElapsed);
    setGameState('gameover');
    
    // 점수 저장 시 최신 state(score)가 클로저에 없을 수 있으므로 직접 전달받거나 현재 렌더된 값을 사용
    // 여기서는 함수 실행 시점의 score를 저장
    setScore(currentScore => {
      saveScore(currentScore, finalElapsed, stateRef.current.difficulty);
      return currentScore;
    });
  };

  const processMistake = (isTimeout) => {
    if (stateRef.current.isProcessing || stateRef.current.gameState !== 'playing') return;
    stateRef.current.isProcessing = true;
    if (tickRef.current) cancelAnimationFrame(tickRef.current);

    triggerAnimation('wrong');
    
    const cw = stateRef.current.currentWord;
    if (isTimeout) {
      setFeedback({ text: `시간 초과! 정답은 '${cw?.meaning?.name}'입니다.`, type: 'wrong' });
    } else {
      setFeedback({ text: `오답! 정답은 '${cw?.meaning?.name}'입니다.`, type: 'wrong' });
    }

    setStreak(0);
    setLives(prevLives => {
      const newLives = prevLives - 1;
      if (newLives <= 0) {
        handleGameOver();
      } else {
        const d = DIFFICULTIES[stateRef.current.difficulty];
        setTimeLimit(prevLimit => {
          const newLimit = Math.min(prevLimit + d.inc, 4000);
          setTimeout(() => startRound(newLimit), 800);
          return newLimit;
        });
      }
      return newLives;
    });
  };

  const startRound = (currentLimit, customPalette = null) => {
    stateRef.current.isProcessing = false;
    if (tickRef.current) cancelAnimationFrame(tickRef.current);
    
    setFeedback({ text: '', type: '' });
    
    // 렌더링 시 최신 palette를 사용하기 위해 함수형 업데이트 대신 직접 접근
    // 초기화 시 전달받은 customPalette가 있으면 그걸 쓰고, 아니면 컴포넌트 상태 사용
    setPalette(prevPalette => {
      const activePalette = customPalette || prevPalette;
      const word = pickWord(activePalette);
      setCurrentWord(word);
      return activePalette;
    });

    setTimeLeft(currentLimit);
    startTsRef.current = performance.now();
    
    const tick = (now) => {
      if (stateRef.current.gameState !== 'playing' || stateRef.current.isProcessing) return;
      
      const elapsed = now - startTsRef.current;
      const remaining = Math.max(0, currentLimit - elapsed);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        processMistake(true);
      } else {
        tickRef.current = requestAnimationFrame(tick);
      }
    };
    
    tickRef.current = requestAnimationFrame(tick);
  };

  const startGame = (diffKey) => {
    const d = DIFFICULTIES[diffKey];
    const newPalette = ALL_COLORS.slice(0, d.colors);
    
    setDifficulty(diffKey);
    setPalette(newPalette);
    setScore(0);
    setStreak(0);
    setLives(3);
    setTimeLimit(d.start);
    setGameState('playing');
    
    stateRef.current.isProcessing = false;
    stateRef.current.difficulty = diffKey;
    stateRef.current.lives = 3;
    stateRef.current.timeLimit = d.start;
    
    totalPlayStartRef.current = Date.now();
    startRound(d.start, newPalette);
  };

  const handleAnswer = (chosenColor) => {
    if (gameState !== 'playing' || stateRef.current.isProcessing) return;
    
    const cw = stateRef.current.currentWord;
    if (!cw) return;

    if (chosenColor.name === cw.meaning.name) {
      // 정답 처리
      stateRef.current.isProcessing = true;
      if (tickRef.current) cancelAnimationFrame(tickRef.current);

      triggerAnimation('correct');
      setFeedback({ text: '정답입니다!', type: 'correct' });

      setStreak(prevStreak => {
        const newStreak = prevStreak + 1;
        const mult = Math.min(4, 1 + Math.floor(newStreak / 5));
        setScore(s => s + (10 * mult));
        return newStreak;
      });
      
      const d = DIFFICULTIES[difficulty];
      setTimeLimit(prevLimit => {
        const newLimit = Math.max(d.min, prevLimit - d.dec);
        setTimeout(() => startRound(newLimit), 500);
        return newLimit;
      });
    } else {
      // 오답 처리
      processMistake(false);
    }
  };

  const multiplier = Math.min(4, 1 + Math.floor(streak / 5));

  return (
    <div className="min-h-screen relative flex flex-col font-sans bg-cover bg-center bg-no-repeat bg-fixed" style={{ backgroundImage: "url('/assets/games/color_match_bg.png')" }}>
      
      {/* 백그라운드 글래스모피즘 오버레이 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-none z-0" />

      {/* 헤더 */}
      <div className="relative z-20 bg-white/10 backdrop-blur-md border-b border-white/10 px-4 py-4 shrink-0 flex items-center justify-between shadow-lg">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/80 font-bold hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" /> 뒤로가기
        </button>
        <div className="flex items-center gap-2 text-white">
          <Brain className="w-5 h-5 text-blue-400" />
          <h1 className="font-black text-lg">색깔 맞추기</h1>
        </div>
        <div className="w-20"></div>
      </div>

      <div className="flex-1 overflow-y-auto pb-10 relative z-10">
        <div className="max-w-xl mx-auto px-4 py-8">
          
          {/* ================= INTRO ================= */}
          {gameState === 'intro' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-500/20 text-blue-400 mb-4 shadow-[0_0_30px_rgba(59,130,246,0.3)] border border-blue-400/30">
                  <Brain className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-white mb-3 drop-shadow-md">글자의 뜻에 집중하세요!</h2>
                <p className="text-white/80 font-medium leading-relaxed drop-shadow">
                  화면에 나타난 글자가 <strong className="text-blue-300">말하는 뜻</strong>을 찾아주세요.<br/>
                  실제 칠해진 색상은 함정입니다!
                </p>
              </div>

              <div className="space-y-4">
                {Object.entries(DIFFICULTIES).map(([key, d]) => (
                  <button key={key} onClick={() => startGame(key)}
                    className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-left flex items-center justify-between shadow-lg hover:border-blue-400 hover:bg-white/20 transition-all group">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">{d.label}</h3>
                      <p className="text-white/60 text-sm">제한시간 {d.start/1000}초 · 색상 {d.colors}가지</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors border border-blue-400/30 shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                      <Play className="w-5 h-5 ml-1" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-10 bg-white/5 backdrop-blur-md rounded-3xl p-6 text-sm text-white/70 leading-relaxed border border-white/10 shadow-inner">
                <strong className="text-white block mb-2 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-blue-400"/>왜 이 게임인가요?</strong>
                글자의 뜻과 실제 칠해진 색이 충돌할 때, 보이는 색을 억제하고 뜻을 읽어내는 것은 실행기능과 주의 억제력을 평가하는 대표적 신경심리 검사(스트룹 검사)와 같은 원리입니다. 초기 인지저하 선별에 널리 쓰입니다.
              </div>
            </div>
          )}

          {/* ================= PLAYING ================= */}
          {gameState === 'playing' && (
            <div className="animate-in fade-in duration-300 flex flex-col items-center">
              
              {/* 상단 스탯 영역 */}
              <div className="w-full flex items-center justify-between mb-8 gap-3">
                <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-white/20 text-center">
                  <div className="text-xs text-white/50 font-bold mb-1">SCORE</div>
                  <div className="text-2xl font-black text-white tabular-nums drop-shadow">{score}</div>
                </div>
                <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-white/20 text-center relative overflow-hidden">
                  <div className="text-xs text-white/50 font-bold mb-1">COMBO</div>
                  <div className={`text-2xl font-black tabular-nums transition-colors drop-shadow ${streak >= 5 ? 'text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.8)]' : 'text-white'}`}>
                    {streak} <span className="text-sm font-bold text-white/50 ml-1">x{multiplier}</span>
                  </div>
                </div>
                <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-white/20 text-center">
                  <div className="text-xs text-white/50 font-bold mb-1">LIVES</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {[1, 2, 3].map(i => (
                      <Heart key={i} className={`w-6 h-6 drop-shadow-md transition-colors ${i <= lives ? 'fill-red-500 text-red-500' : 'fill-white/10 text-white/20'}`} />
                    ))}
                  </div>
                </div>
              </div>

              {/* 타이머 바 */}
              <div className="w-full h-3 bg-white/10 rounded-full mb-6 overflow-hidden shadow-inner backdrop-blur-md border border-white/10">
                <div 
                  className={`h-full rounded-full transition-colors shadow-[0_0_10px_currentColor] ${timeLeft / timeLimit < 0.25 ? 'bg-red-500 text-red-500' : 'bg-blue-500 text-blue-500'}`}
                  style={{ width: `${Math.max(0, (timeLeft / timeLimit) * 100)}%` }}
                ></div>
              </div>

              {/* 메인 스테이지 */}
              <div 
                ref={stageRef}
                className="w-full bg-black/40 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/20 p-12 flex flex-col items-center justify-center min-h-[220px] mb-6 relative overflow-hidden transition-colors duration-300"
              >
                {streak >= 3 && (
                  <div className="absolute top-4 bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-black tracking-wider flex items-center gap-1 animate-bounce border border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                    <Zap className="w-3 h-3 fill-orange-400" /> COMBO x{streak}
                  </div>
                )}
                {currentWord.meaning && (
                  <span 
                    className="text-6xl md:text-7xl font-black tracking-tight select-none drop-shadow-[0_0_20px_currentColor]"
                    style={{ color: currentWord.ink.hex }}
                  >
                    {currentWord.meaning.name}
                  </span>
                )}
              </div>

              {/* 피드백 메시지 */}
              <div className="h-8 mb-4 flex items-center justify-center w-full">
                {feedback.text && (
                  <div className={`font-bold flex items-center gap-2 animate-in zoom-in duration-200 drop-shadow-md ${feedback.type === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                    {feedback.type === 'correct' ? <CheckCircle2 className="w-5 h-5"/> : <XCircle className="w-5 h-5"/>}
                    {feedback.text}
                  </div>
                )}
              </div>
              <p className="text-white/80 font-medium mb-6 text-center drop-shadow">글자가 뜻하는 색의 버튼을 누르세요!</p>

              {/* 색상 버튼 (스와치) - 동적으로 꽉 차게 변경 */}
              <div className="flex w-full gap-2 sm:gap-3">
                {palette.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => handleAnswer(color)}
                    disabled={feedback.text !== ''}
                    className={`flex-1 h-20 sm:h-24 rounded-2xl shadow-lg border-2 border-white/30 active:scale-95 transition-all hover:ring-4 hover:ring-offset-2 hover:ring-offset-black/50 ${color.ring}`}
                    style={{ backgroundColor: color.hex, boxShadow: `0 0 20px ${color.hex}80` }}
                    aria-label={color.name}
                  ></button>
                ))}
              </div>

            </div>
          )}

          {/* ================= GAMEOVER ================= */}
          {gameState === 'gameover' && (
            <div className="animate-in zoom-in-95 duration-500 max-w-sm mx-auto mt-10">
              <div className="bg-white/10 backdrop-blur-2xl rounded-[2.5rem] p-10 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-blue-500/10 -z-10"></div>
                
                <div className="w-20 h-20 bg-red-500/20 rounded-full mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.3)] mb-6 border border-red-500/30">
                  <Heart className="w-10 h-10 text-red-400 fill-red-400 opacity-80" />
                </div>
                
                <h2 className="text-3xl font-black text-white mb-2 drop-shadow">게임 오버!</h2>
                <p className="text-white/70 font-medium mb-8">기회를 모두 소진했습니다.</p>
                
                <div className="bg-black/40 backdrop-blur-md rounded-3xl p-6 mb-8 border border-white/10 shadow-inner">
                  <div className="text-sm text-white/50 font-bold mb-1">최종 점수</div>
                  <div className="text-5xl font-black text-blue-400 mb-4 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]">{score}</div>
                  
                  <div className="flex justify-center gap-6 text-sm font-bold text-white/70">
                    <div className="flex flex-col">
                      <span className="text-white/40 font-medium">난이도</span>
                      <span className="text-white">{DIFFICULTIES[difficulty].label}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white/40 font-medium">소요시간</span>
                      <span className="text-white">{elapsedTime}초</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => startGame(difficulty)}
                    disabled={isSaving}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>기록 저장 중...</>
                    ) : (
                      <><RotateCcw className="w-5 h-5" /> 다시 하기</>
                    )}
                  </button>
                  <button 
                    onClick={() => navigate('/game-stats')}
                    className="w-full bg-white/10 text-white font-bold py-4 rounded-xl border border-white/20 hover:bg-white/20 transition-colors"
                  >
                    통계 확인하기
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      
      {/* 쉐이크 애니메이션용 CSS 추가 */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          50% { transform: translateX(8px); }
          75% { transform: translateX(-8px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
