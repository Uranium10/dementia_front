import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Home, Brain, Heart, Star, RotateCcw, Trophy, ChevronRight, Play, AlertTriangle } from 'lucide-react';
import { Anchor, Bell, Crown, Diamond, Flame, Ghost, Leaf, Moon, Sun, Zap } from 'lucide-react';

const CARD_TYPES = [
  { id: 'anchor', icon: Anchor, color: 'text-sky-800', bg: 'bg-sky-100' },
  { id: 'bell', icon: Bell, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { id: 'crown', icon: Crown, color: 'text-amber-500', bg: 'bg-amber-100' },
  { id: 'diamond', icon: Diamond, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  { id: 'flame', icon: Flame, color: 'text-red-600', bg: 'bg-red-100' },
  { id: 'ghost', icon: Ghost, color: 'text-purple-600', bg: 'bg-purple-100' },
  { id: 'leaf', icon: Leaf, color: 'text-green-600', bg: 'bg-green-100' },
  { id: 'moon', icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { id: 'sun', icon: Sun, color: 'text-orange-500', bg: 'bg-orange-100' },
  { id: 'zap', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50' },
];

const DIFFICULTIES = {
  normal: { 
    id: 'normal', 
    name: '보통', 
    pairs: 6, 
    memorizeTime: 3000,
    gridClass: 'grid-cols-3 sm:grid-cols-4',
    desc: '총 12장 (6쌍), 암기시간 3초'
  },
  hard: { 
    id: 'hard', 
    name: '어려움', 
    pairs: 10, 
    memorizeTime: 5000,
    gridClass: 'grid-cols-4 sm:grid-cols-5',
    desc: '총 20장 (10쌍), 암기시간 5초'
  }
};

const INITIAL_LIVES = 3;

export default function CardMatchPage() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('intro'); // intro, memorizing, playing, gameover, clear
  const [difficulty, setDifficulty] = useState('normal');
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timerText, setTimerText] = useState('');
  
  const stateRef = useRef({
    difficulty: 'normal',
    score: 0,
    streak: 0,
    matchedIdsLength: 0
  });

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // state 동기화
  useEffect(() => {
    stateRef.current.difficulty = difficulty;
    stateRef.current.score = score;
    stateRef.current.streak = streak;
    stateRef.current.matchedIdsLength = matchedIds.length;
  }, [difficulty, score, streak, matchedIds]);

  // 게임 초기화
  const initGame = (diffKey) => {
    const d = DIFFICULTIES[diffKey];
    setDifficulty(diffKey);
    setLives(INITIAL_LIVES);
    setScore(0);
    setStreak(0);
    setMatchedIds([]);
    setFlippedIndices([]);
    setTimerText(`${d.memorizeTime / 1000}`);
    
    // 카드 섞기
    const selectedTypes = CARD_TYPES.slice(0, d.pairs);
    const deck = [...selectedTypes, ...selectedTypes]
      .sort(() => Math.random() - 0.5)
      .map((item, idx) => ({ ...item, uniqueId: idx }));
      
    setCards(deck);
    setGameState('memorizing');

    // 암기 시간 카운트다운
    let remaining = d.memorizeTime / 1000;
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        setTimerText(remaining.toString());
      } else {
        clearInterval(timerRef.current);
        setTimerText('START!');
        setTimeout(() => {
          setGameState('playing');
          setTimerText('');
          startTimeRef.current = Date.now();
        }, 800);
      }
    }, 1000);
  };

  const cleanupTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    return cleanupTimer;
  }, []);

  const saveScore = async (finalScore, isCleared) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedTime(duration);

      const d = new Date();
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localDate = new Date(d.getTime() - tzOffset).toISOString().split('T')[0];

      const { error } = await supabase.from('game_scores').insert({
        user_id: user.id,
        game_type: 'card_match',
        score: finalScore,
        play_date: localDate,
        detail: { difficulty: stateRef.current.difficulty, cleared: isCleared, duration_sec: duration }
      });

      if (error) {
        console.error('DB Insert Error:', error);
        alert(`점수 저장 실패: DB에 'card_match' 타입이 허용되지 않았을 수 있습니다.\n상세: ${error.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCardClick = (index) => {
    // 락 걸림, 이미 맞춰짐, 이미 뒤집힘, 암기 시간 중
    if (isProcessing || gameState !== 'playing') return;
    if (matchedIds.includes(cards[index].id)) return;
    if (flippedIndices.includes(index)) return;

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsProcessing(true);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = cards[firstIdx];
      const secondCard = cards[secondIdx];

      if (firstCard.id === secondCard.id) {
        // 일치
        setTimeout(() => {
          setMatchedIds(prev => {
            const newMatched = [...prev, firstCard.id];
            // 클리어 체크는 최신 배열의 길이를 기준으로 판별
            if (newMatched.length === DIFFICULTIES[stateRef.current.difficulty].pairs) {
              setGameState('clear');
              const finalScore = stateRef.current.score + 100 + Math.min((stateRef.current.streak + 1) * 10, 50);
              saveScore(finalScore, true);
            }
            return newMatched;
          });
          setFlippedIndices([]);
          
          setStreak(prev => {
            const newStreak = prev + 1;
            const comboBonus = Math.min(newStreak * 10, 50);
            setScore(s => s + 100 + comboBonus);
            return newStreak;
          });
          
          setIsProcessing(false);
        }, 500);
      } else {
        // 불일치
        setStreak(0);
        setTimeout(() => {
          setFlippedIndices([]);
          setLives(prev => {
            const nl = prev - 1;
            if (nl <= 0) {
              setGameState('gameover');
              saveScore(stateRef.current.score, false);
            }
            return nl;
          });
          setIsProcessing(false);
        }, 800);
      }
    }
  };

  const dConfig = DIFFICULTIES[difficulty];

  // UI 공통 버튼
  const renderStatsButton = () => (
    <button onClick={() => navigate('/game-stats?tab=card_match')} className="w-full bg-[#1A2530] text-white/90 font-bold text-lg py-4 rounded-xl border border-white/20 hover:bg-[#2C3E50] transition-colors shadow-lg">
      통계 확인하기
    </button>
  );

  return (
    <div className="min-h-[100dvh] relative flex flex-col pt-16 bg-[#0E151C] overflow-hidden">
      {/* 고화질 배경 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-90"
        style={{ backgroundImage: "url('/assets/games/card_match_bg.png')" }}
      />
      
      {/* 은은한 비네팅 오버레이 */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />

      <div className="relative max-w-2xl w-full mx-auto p-4 flex-1 flex flex-col z-10 font-sans">
        
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6 shrink-0 bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-xl">
          <button onClick={() => navigate('/prevention')} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <Home className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl font-bold text-white tracking-wide">카드 짝 맞추기</h1>
          </div>
          <div className="w-10"></div>
        </div>

        <AnimatePresence mode="wait">
          
          {/* ================= INTRO ================= */}
          {gameState === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full"
            >
              <div className="bg-[#1A2530]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl text-center mb-8">
                <div className="w-32 h-32 mx-auto mb-6 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] border-2 border-emerald-900/50">
                  <img src="/assets/games/card_match_thumbnail.png" alt="카드 짝 맞추기" className="w-full h-full object-cover" />
                </div>
                
                <h2 className="text-3xl font-black text-white mb-2 tracking-tight">카드 짝 맞추기</h2>
                <p className="text-[#8B9BB4] mb-8 font-medium">숨겨진 카드의 짝을 기억하여<br/>단기 기억력을 향상하세요.</p>

                <div className="space-y-4">
                  {Object.values(DIFFICULTIES).map((diff) => (
                    <button
                      key={diff.id}
                      onClick={() => initGame(diff.id)}
                      className="w-full flex flex-col items-center p-4 bg-[#212E3C] hover:bg-[#2C3E50] rounded-2xl transition-all group border border-white/5 hover:border-emerald-500/50 shadow-lg"
                    >
                      <span className="font-bold text-lg text-white mb-1 group-hover:text-emerald-400 transition-colors">
                        {diff.name} 시작
                      </span>
                      <span className="text-xs text-[#6B7C94]">{diff.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= PLAYING / MEMORIZING ================= */}
          {(gameState === 'playing' || gameState === 'memorizing') && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col relative"
            >
              {/* 스탯 바 */}
              <div className="flex justify-between items-center bg-[#1A2530]/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-xl mb-6 shrink-0">
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-bold text-[#6B7C94] uppercase tracking-wider mb-0.5">Score</span>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-black text-xl text-white tabular-nums">{score}</span>
                  </div>
                </div>
                
                {gameState === 'memorizing' && (
                  <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <span className="text-xs font-bold text-emerald-400 mb-1 animate-pulse">암기 시간</span>
                    <span className="text-3xl font-black text-white drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]">{timerText}</span>
                  </div>
                )}
                
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-[#6B7C94] uppercase tracking-wider mb-0.5">Lives</span>
                  <div className="flex items-center gap-1">
                    {[...Array(INITIAL_LIVES)].map((_, i) => (
                      <Heart
                        key={i}
                        className={`w-5 h-5 transition-all duration-300 ${
                          i < lives
                            ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                            : 'text-white/10 fill-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 카드 그리드 */}
              <div className="flex-1 flex items-center justify-center relative w-full h-full pb-8">
                <div className={`w-full max-w-[600px] grid ${dConfig.gridClass} gap-3 p-4 bg-[#111A24]/60 backdrop-blur-sm rounded-3xl border border-white/5 shadow-2xl`}>
                  {cards.map((card, index) => {
                    // 암기 중이거나, 짝을 맞췄거나, 현재 뒤집은 카드면 앞면 노출
                    const isFaceUp = gameState === 'memorizing' || matchedIds.includes(card.id) || flippedIndices.includes(index);
                    const isMatched = matchedIds.includes(card.id);
                    const Icon = card.icon;
                    
                    return (
                      <div key={card.uniqueId} className="aspect-[3/4] relative perspective-1000">
                        <motion.div
                          onClick={() => handleCardClick(index)}
                          className="w-full h-full relative preserve-3d cursor-pointer"
                          initial={false}
                          animate={{ rotateY: isFaceUp ? 180 : 0 }}
                          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                          whileHover={!isFaceUp && gameState === 'playing' ? { scale: 1.05 } : {}}
                          whileTap={!isFaceUp && gameState === 'playing' ? { scale: 0.95 } : {}}
                        >
                          {/* 뒷면 (Back) */}
                          <div 
                            className={`absolute inset-0 backface-hidden rounded-xl shadow-lg border-2 ${
                              gameState === 'playing' ? 'border-white/10 hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-white/5'
                            } bg-cover bg-center`}
                            style={{ backgroundImage: "url('/assets/games/card_back.png')" }}
                          >
                            <div className="absolute inset-0 bg-black/20 rounded-xl" />
                          </div>

                          {/* 앞면 (Front) */}
                          <div 
                            className={`absolute inset-0 backface-hidden rounded-xl shadow-lg border-2 ${
                              isMatched ? 'border-emerald-400/50' : 'border-white/20'
                            } bg-white flex items-center justify-center rotate-y-180 overflow-hidden`}
                          >
                            <div className={`absolute inset-0 ${card.bg} opacity-20`} />
                            {isMatched && (
                              <div className="absolute inset-0 bg-emerald-400/10 animate-pulse" />
                            )}
                            <Icon className={`w-1/2 h-1/2 ${card.color} drop-shadow-md z-10`} />
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= GAMEOVER ================= */}
          {gameState === 'gameover' && (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex items-center justify-center max-w-sm mx-auto w-full"
            >
              <div className="bg-[#1A2530]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl text-center w-full">
                <div className="w-20 h-20 bg-rose-500/10 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(244,63,94,0.2)] border border-rose-500/20 rotate-12">
                  <AlertTriangle className="w-10 h-10 text-rose-500 -rotate-12" />
                </div>
                
                <h2 className="text-3xl font-black text-white mb-2">게임 오버!</h2>
                <p className="text-[#8B9BB4] mb-8 font-medium">아쉽게도 목숨을 모두 잃었습니다.</p>
                
                <div className="bg-[#0E151C]/50 rounded-2xl p-6 mb-8 border border-white/5 shadow-inner">
                  <div className="text-xs font-bold text-[#6B7C94] mb-1">최종 점수</div>
                  <div className="text-4xl font-black text-white tabular-nums drop-shadow-md mb-2">{score}</div>
                  <div className="text-sm font-bold text-rose-400">{dConfig.name} 난이도</div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => initGame(difficulty)}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" /> 다시 하기
                  </button>
                  {renderStatsButton()}
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= CLEAR ================= */}
          {gameState === 'clear' && (
            <motion.div
              key="clear"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex items-center justify-center max-w-sm mx-auto w-full"
            >
              <div className="bg-[#1A2530]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl text-center w-full">
                <div className="w-24 h-24 bg-yellow-500/10 rounded-[2rem] mx-auto flex items-center justify-center mb-6 border border-yellow-500/20 shadow-[0_0_40px_rgba(234,179,8,0.2)]">
                  <Trophy className="w-12 h-12 text-yellow-500" />
                </div>
                
                <h2 className="text-3xl font-black text-white mb-2">완벽합니다!</h2>
                <p className="text-[#8B9BB4] mb-8 font-medium">모든 카드의 짝을 찾아냈습니다.</p>
                
                <div className="bg-[#0E151C]/50 rounded-2xl p-6 mb-8 border border-white/5 shadow-inner flex justify-around">
                  <div>
                    <div className="text-[10px] font-bold text-[#6B7C94] uppercase mb-1">Score</div>
                    <div className="text-2xl font-black text-white tabular-nums">{score}</div>
                  </div>
                  <div className="w-[1px] bg-white/10"></div>
                  <div>
                    <div className="text-[10px] font-bold text-[#6B7C94] uppercase mb-1">Time</div>
                    <div className="text-2xl font-black text-emerald-400 tabular-nums">{elapsedTime}s</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setGameState('intro')}
                    className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:from-yellow-600 hover:to-amber-700 transition-all flex items-center justify-center gap-2"
                  >
                    다른 난이도 도전 <ChevronRight className="w-5 h-5" />
                  </button>
                  {renderStatsButton()}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <style>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
