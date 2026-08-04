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
  
  // 게임 진행 상태
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLimit, setTimeLimit] = useState(2400);
  const [timeLeft, setTimeLeft] = useState(2400);
  const [currentWord, setCurrentWord] = useState({ meaning: null, ink: null });
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // 총 플레이 시간 측정용

  // Refs for timers and animations
  const tickRef = useRef(null);
  const startTsRef = useRef(null);
  const totalPlayStartRef = useRef(null);
  const stageRef = useRef(null);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (tickRef.current) cancelAnimationFrame(tickRef.current);
    };
  }, []);

  const startGame = (diffKey) => {
    const d = DIFFICULTIES[diffKey];
    setDifficulty(diffKey);
    setPalette(ALL_COLORS.slice(0, d.colors));
    setScore(0);
    setStreak(0);
    setLives(3);
    setTimeLimit(d.start);
    setGameState('playing');
    totalPlayStartRef.current = Date.now();
    startRound(d.start);
  };

  const pickWord = useCallback((currentPalette) => {
    const meaning = currentPalette[Math.floor(Math.random() * currentPalette.length)];
    let ink;
    do { ink = currentPalette[Math.floor(Math.random() * currentPalette.length)]; }
    while (ink.name === meaning.name);
    return { meaning, ink };
  }, []);

  const triggerAnimation = (type) => {
    if (stageRef.current) {
      stageRef.current.classList.remove('animate-shake', 'bg-red-50', 'bg-green-50');
      void stageRef.current.offsetWidth; // trigger reflow
      if (type === 'wrong') {
        stageRef.current.classList.add('animate-shake', 'bg-red-50');
      } else if (type === 'correct') {
        stageRef.current.classList.add('bg-green-50');
      }
      setTimeout(() => {
        if (stageRef.current) stageRef.current.classList.remove('animate-shake', 'bg-red-50', 'bg-green-50');
      }, 400);
    }
  };

  const saveScore = async (finalScore, finalElapsedTime) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // game_type은 schema_guide에 없으나, 사용자가 추가하기로 협의됨
        await supabase.from('game_scores').insert({
          user_id: user.id,
          game_type: 'color_match',
          score: finalScore,
          detail: { duration_sec: finalElapsedTime, difficulty, completed: true }
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
    saveScore(score, finalElapsed);
  };

  const processMistake = (isTimeout) => {
    const newLives = lives - 1;
    setLives(newLives);
    setStreak(0);
    triggerAnimation('wrong');
    
    if (isTimeout) {
      setFeedback({ text: `시간 초과! 정답은 '${currentWord.meaning?.name}'입니다.`, type: 'wrong' });
    } else {
      setFeedback({ text: `오답! 정답은 '${currentWord.meaning?.name}'입니다.`, type: 'wrong' });
    }

    if (newLives <= 0) {
      handleGameOver();
    } else {
      const d = DIFFICULTIES[difficulty];
      const newTimeLimit = Math.min(timeLimit + d.inc, 4000);
      setTimeLimit(newTimeLimit);
      setTimeout(() => startRound(newTimeLimit), 800);
    }
  };

  const startRound = useCallback((currentLimit) => {
    if (tickRef.current) cancelAnimationFrame(tickRef.current);
    
    setFeedback({ text: '', type: '' });
    const word = pickWord(DIFFICULTIES[difficulty] ? ALL_COLORS.slice(0, DIFFICULTIES[difficulty].colors) : palette);
    setCurrentWord(word);
    setTimeLeft(currentLimit);
    
    startTsRef.current = performance.now();
    
    const tick = (now) => {
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
  }, [difficulty, lives, palette, pickWord]);

  const handleAnswer = (chosenColor) => {
    if (gameState !== 'playing' || timeLeft <= 0 || lives <= 0) return;
    if (tickRef.current) cancelAnimationFrame(tickRef.current);
    
    if (chosenColor.name === currentWord.meaning.name) {
      // 정답
      const newStreak = streak + 1;
      setStreak(newStreak);
      const mult = Math.min(4, 1 + Math.floor(newStreak / 5));
      const gained = 10 * mult;
      setScore(s => s + gained);
      
      triggerAnimation('correct');
      setFeedback({ text: '정답입니다!', type: 'correct' });
      
      const d = DIFFICULTIES[difficulty];
      const newTimeLimit = Math.max(d.min, timeLimit - d.dec);
      setTimeLimit(newTimeLimit);
      
      setTimeout(() => startRound(newTimeLimit), 500);
    } else {
      // 오답
      processMistake(false);
    }
  };

  const multiplier = Math.min(4, 1 + Math.floor(streak / 5));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* 글로벌 헤더를 가리기 때문에 로컬 헤더 제공 */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 shrink-0 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 font-bold hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-5 h-5" /> 뒤로가기
        </button>
        <div className="flex items-center gap-2 text-slate-800">
          <Brain className="w-5 h-5 text-blue-600" />
          <h1 className="font-black text-lg">색깔 맞추기</h1>
        </div>
        <div className="w-20"></div>
      </div>

      <div className="flex-1 overflow-y-auto pb-10">
        <div className="max-w-xl mx-auto px-4 py-8">
          
          {/* ================= INTRO ================= */}
          {gameState === 'intro' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4 shadow-sm">
                  <Brain className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-3">글자의 뜻에 집중하세요!</h2>
                <p className="text-slate-500 font-medium leading-relaxed">
                  화면에 나타난 글자가 <strong className="text-blue-600">말하는 뜻</strong>을 찾아주세요.<br/>
                  실제 칠해진 색상은 함정입니다!
                </p>
              </div>

              <div className="space-y-4">
                {Object.entries(DIFFICULTIES).map(([key, d]) => (
                  <button key={key} onClick={() => startGame(key)}
                    className="w-full bg-white border border-slate-200 rounded-3xl p-6 text-left flex items-center justify-between shadow-sm hover:border-blue-400 hover:shadow-md transition-all group">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{d.label}</h3>
                      <p className="text-slate-500 text-sm">제한시간 {d.start/1000}초 · 색상 {d.colors}가지</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Play className="w-5 h-5 ml-1" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-10 bg-slate-100/70 rounded-3xl p-6 text-sm text-slate-500 leading-relaxed border border-slate-200">
                <strong className="text-slate-700 block mb-2 flex items-center gap-2"><ShieldAlert className="w-4 h-4"/>왜 이 게임인가요?</strong>
                글자의 뜻과 실제 칠해진 색이 충돌할 때, 보이는 색을 억제하고 뜻을 읽어내는 것은 실행기능과 주의 억제력을 평가하는 대표적 신경심리 검사(스트룹 검사)와 같은 원리입니다. 초기 인지저하 선별에 널리 쓰입니다.
              </div>
            </div>
          )}

          {/* ================= PLAYING ================= */}
          {gameState === 'playing' && (
            <div className="animate-in fade-in duration-300 flex flex-col items-center">
              
              {/* 상단 스탯 영역 */}
              <div className="w-full flex items-center justify-between mb-8 gap-3">
                <div className="flex-1 bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
                  <div className="text-xs text-slate-400 font-bold mb-1">SCORE</div>
                  <div className="text-2xl font-black text-slate-800 tabular-nums">{score}</div>
                </div>
                <div className="flex-1 bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center relative overflow-hidden">
                  <div className="text-xs text-slate-400 font-bold mb-1">COMBO</div>
                  <div className={`text-2xl font-black tabular-nums transition-colors ${streak >= 5 ? 'text-orange-500' : 'text-slate-800'}`}>
                    {streak} <span className="text-sm font-bold text-slate-400 ml-1">x{multiplier}</span>
                  </div>
                </div>
                <div className="flex-1 bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
                  <div className="text-xs text-slate-400 font-bold mb-1">LIVES</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {[1, 2, 3].map(i => (
                      <Heart key={i} className={`w-6 h-6 ${i <= lives ? 'fill-red-500 text-red-500' : 'fill-slate-100 text-slate-200'}`} />
                    ))}
                  </div>
                </div>
              </div>

              {/* 타이머 바 */}
              <div className="w-full h-3 bg-slate-200 rounded-full mb-6 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-75 ease-linear ${timeLeft / timeLimit < 0.25 ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.max(0, (timeLeft / timeLimit) * 100)}%` }}
                ></div>
              </div>

              {/* 메인 스테이지 */}
              <div 
                ref={stageRef}
                className="w-full bg-white rounded-[2rem] shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center min-h-[220px] mb-6 relative overflow-hidden transition-colors duration-300"
              >
                {streak >= 3 && (
                  <div className="absolute top-4 bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-black tracking-wider flex items-center gap-1 animate-bounce">
                    <Zap className="w-3 h-3 fill-orange-600" /> COMBO x{streak}
                  </div>
                )}
                {currentWord.meaning && (
                  <span 
                    className="text-6xl md:text-7xl font-black tracking-tight select-none"
                    style={{ color: currentWord.ink.hex }}
                  >
                    {currentWord.meaning.name}
                  </span>
                )}
              </div>

              {/* 피드백 메시지 */}
              <div className="h-8 mb-4 flex items-center justify-center w-full">
                {feedback.text && (
                  <div className={`font-bold flex items-center gap-2 animate-in zoom-in duration-200 ${feedback.type === 'correct' ? 'text-green-600' : 'text-red-500'}`}>
                    {feedback.type === 'correct' ? <CheckCircle2 className="w-5 h-5"/> : <XCircle className="w-5 h-5"/>}
                    {feedback.text}
                  </div>
                )}
              </div>
              <p className="text-slate-500 font-medium mb-6 text-center">글자가 뜻하는 색의 버튼을 누르세요!</p>

              {/* 색상 버튼 (스와치) */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 w-full">
                {palette.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => handleAnswer(color)}
                    disabled={feedback.text !== ''}
                    className={`aspect-square rounded-2xl shadow-sm border-2 border-white/20 active:scale-95 transition-all hover:ring-4 hover:ring-offset-2 ${color.ring}`}
                    style={{ backgroundColor: color.hex }}
                    aria-label={color.name}
                  ></button>
                ))}
              </div>

            </div>
          )}

          {/* ================= GAMEOVER ================= */}
          {gameState === 'gameover' && (
            <div className="animate-in zoom-in-95 duration-500 max-w-sm mx-auto mt-10">
              <div className="bg-white rounded-[2.5rem] p-10 text-center shadow-lg border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-blue-50 -z-10"></div>
                
                <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center shadow-md mb-6 border border-slate-50">
                  <Heart className="w-10 h-10 text-red-500 fill-red-500 opacity-50" />
                </div>
                
                <h2 className="text-3xl font-black text-slate-800 mb-2">게임 오버!</h2>
                <p className="text-slate-500 font-medium mb-8">기회를 모두 소진했습니다.</p>
                
                <div className="bg-slate-50 rounded-3xl p-6 mb-8 border border-slate-100">
                  <div className="text-sm text-slate-400 font-bold mb-1">최종 점수</div>
                  <div className="text-5xl font-black text-blue-600 mb-4">{score}</div>
                  
                  <div className="flex justify-center gap-6 text-sm font-bold text-slate-500">
                    <div className="flex flex-col">
                      <span className="text-slate-400 font-medium">난이도</span>
                      <span className="text-slate-700">{DIFFICULTIES[difficulty].label}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 font-medium">소요시간</span>
                      <span className="text-slate-700">{elapsedTime}초</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => setGameState('intro')}
                    disabled={isSaving}
                    className="w-full bg-blue-600 text-white font-bold py-4 rounded-full shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>기록 저장 중...</>
                    ) : (
                      <><RotateCcw className="w-5 h-5" /> 다시 하기</>
                    )}
                  </button>
                  <button 
                    onClick={() => navigate('/prevention')}
                    className="w-full bg-white text-slate-600 font-bold py-4 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    나가기
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
