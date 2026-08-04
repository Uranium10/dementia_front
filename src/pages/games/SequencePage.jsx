import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, Brain, Heart, Star, RotateCcw, Home, Trophy, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const DIFFICULTIES = {
  normal: { 
    id: 'normal', 
    name: '보통', 
    gridCount: 9, 
    gridCols: 'grid-cols-3',
    maxLevel: 9,
    desc: '3x3 격자, 9단계까지 도전합니다.'
  },
  hard: { 
    id: 'hard', 
    name: '어려움', 
    gridCount: 16, 
    gridCols: 'grid-cols-4',
    maxLevel: 16,
    desc: '4x4 격자, 16단계까지 도전합니다.'
  }
};

const INITIAL_LIVES = 3;
const PLAYBACK_DELAY_MS = 600;

export default function SequencePage() {
  const navigate = useNavigate();
  
  const [gameState, setGameState] = useState('intro');
  const [difficulty, setDifficulty] = useState('normal');
  const [sequence, setSequence] = useState([]);
  const [playerSequence, setPlayerSequence] = useState([]);
  const [isPlayback, setIsPlayback] = useState(false);
  const [activeTile, setActiveTile] = useState(null);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [score, setScore] = useState(0); 
  const [showSuccess, setShowSuccess] = useState(false);
  
  const timeoutRefs = useRef([]);

  const clearAllTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  }, []);

  useEffect(() => {
    return () => clearAllTimeouts();
  }, [clearAllTimeouts]);

  const saveGameScore = async (finalScore, isClear) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('game_scores')
        .insert({
          user_id: user.id,
          game_type: 'sequence',
          score: finalScore,
          detail: {
            difficulty,
            cleared: isClear,
            max_target: DIFFICULTIES[difficulty].maxLevel,
            played_at: new Date().toISOString()
          }
        });
      if (error) throw error;
    } catch (error) {
      console.error('Failed to save score:', error);
    }
  };

  const playSequence = useCallback((currentSeq) => {
    setIsPlayback(true);
    setPlayerSequence([]);
    clearAllTimeouts();
    
    let timeOffset = 800;

    currentSeq.forEach((tileIndex) => {
      const onTimeout = setTimeout(() => {
        setActiveTile(tileIndex);
      }, timeOffset);
      timeoutRefs.current.push(onTimeout);

      timeOffset += PLAYBACK_DELAY_MS;

      const offTimeout = setTimeout(() => {
        setActiveTile(null);
      }, timeOffset - 150);
      timeoutRefs.current.push(offTimeout);
    });

    const endTimeout = setTimeout(() => {
      setIsPlayback(false);
      setActiveTile(null);
    }, timeOffset);
    timeoutRefs.current.push(endTimeout);
  }, [clearAllTimeouts]);

  const nextLevel = useCallback((currentSeq) => {
    const config = DIFFICULTIES[difficulty];
    if (currentSeq.length >= config.maxLevel) {
      setScore(config.maxLevel);
      setGameState('clear');
      saveGameScore(config.maxLevel, true);
      return;
    }

    // 연속으로 동일한 타일이 나오지 않도록 방지
    let nextTile;
    const lastTile = currentSeq.length > 0 ? currentSeq[currentSeq.length - 1] : -1;
    do {
      nextTile = Math.floor(Math.random() * config.gridCount);
    } while (nextTile === lastTile);

    const newSeq = [...currentSeq, nextTile];
    
    setSequence(newSeq);
    setScore(newSeq.length - 1);

    playSequence(newSeq);
  }, [difficulty, playSequence]);

  const startGame = (diff) => {
    setDifficulty(diff);
    setLives(INITIAL_LIVES);
    setScore(0);
    setSequence([]);
    setPlayerSequence([]);
    setGameState('playing');
    setTimeout(() => {
      nextLevel([]);
    }, 500);
  };

  const handleTileClick = (index) => {
    if (isPlayback || gameState !== 'playing') return;

    setActiveTile(index);
    setTimeout(() => setActiveTile(null), 200);

    const newPlayerSeq = [...playerSequence, index];
    setPlayerSequence(newPlayerSeq);

    const currentIndex = newPlayerSeq.length - 1;
    if (sequence[currentIndex] !== index) {
      handleMistake();
      return;
    }

    // 해당 라운드를 모두 맞춤
    if (newPlayerSeq.length === sequence.length) {
      setIsPlayback(true);
      setShowSuccess(true);
      
      // 정답 팝업 노출 후 진행
      setTimeout(() => {
        setShowSuccess(false);
        nextLevel(sequence);
      }, 1200);
    }
  };

  const handleMistake = () => {
    setIsPlayback(true);
    const newLives = lives - 1;
    setLives(newLives);

    if (newLives <= 0) {
      setGameState('gameover');
      saveGameScore(score, false);
    } else {
      setTimeout(() => {
        playSequence(sequence);
      }, 1000);
    }
  };

  const currentConfig = DIFFICULTIES[difficulty];

  return (
    <div className="min-h-screen relative flex flex-col pt-20 bg-cover bg-center bg-no-repeat bg-fixed" style={{ backgroundImage: "url('/assets/games/sequence_bg.png')" }}>
      {/* 백그라운드 어둡게 처리(글래스모피즘 효과용) */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-none" />

      <div className="relative max-w-md w-full mx-auto p-4 flex-1 flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/prevention')}
            className="p-2 text-white/80 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md"
          >
            <Home className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-300" />
            <h1 className="text-xl font-bold text-white">순서 기억하기</h1>
          </div>
          <div className="w-10"></div>
        </div>

        <AnimatePresence mode="wait">
          {/* Intro Screen */}
          {gameState === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col justify-center"
            >
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl text-center mb-8">
                {/* 썸네일 이미지 */}
                <div className="w-32 h-32 mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg border-2 border-purple-300/30">
                  <img src="/assets/games/sequence.png" alt="순서 기억하기 썸네일" className="w-full h-full object-cover" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-4">순서 기억하기</h2>
                <p className="text-purple-100 mb-2">빛나는 사각형의 순서를 기억하고</p>
                <p className="text-purple-100 mb-8 font-medium">그대로 따라 누르세요!</p>

                <div className="space-y-4">
                  {Object.values(DIFFICULTIES).map((diff) => (
                    <button
                      key={diff.id}
                      onClick={() => startGame(diff.id)}
                      className="w-full flex flex-col items-center p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group border border-white/20 hover:border-purple-300"
                    >
                      <span className="font-bold text-lg text-white mb-1">
                        {diff.name} 난이도
                      </span>
                      <span className="text-sm text-purple-200">{diff.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Playing Screen */}
          {gameState === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col relative"
            >
              {/* 정답 팝업 */}
              <AnimatePresence>
                {showSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    className="absolute inset-0 m-auto w-48 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.8)] z-50 pointer-events-none"
                  >
                    <span className="text-white font-extrabold text-2xl tracking-widest">정답! 🎉</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-between items-center bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-lg mb-8">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="font-bold text-lg text-white">
                    단계: {score} / {currentConfig.maxLevel}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(INITIAL_LIVES)].map((_, i) => (
                    <Heart
                      key={i}
                      className={`w-5 h-5 ${
                        i < lives
                          ? 'text-pink-500 fill-current drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]'
                          : 'text-white/20'
                      } transition-colors duration-300`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center relative">
                <div className="w-full max-w-[360px] aspect-square">
                  <div className={`grid ${currentConfig.gridCols} gap-3 h-full p-2`}>
                    {[...Array(currentConfig.gridCount)].map((_, index) => {
                      const isActive = activeTile === index;
                      return (
                        <motion.button
                          key={index}
                          onClick={() => handleTileClick(index)}
                          disabled={isPlayback}
                          whileTap={!isPlayback ? { scale: 0.9 } : {}}
                          className={`
                            rounded-2xl transition-all duration-200 backdrop-blur-sm
                            ${isActive 
                              ? 'bg-purple-500 shadow-[0_0_25px_rgba(192,132,252,1)] border-purple-300 z-10 scale-105' 
                              : 'bg-white/10 border-2 border-white/20 shadow-sm'
                            }
                            ${!isPlayback && !isActive ? 'hover:border-purple-300/50 hover:bg-white/20' : ''}
                            ${isPlayback ? 'cursor-default' : 'cursor-pointer'}
                          `}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="text-center mt-8 h-8">
                {isPlayback ? (
                  <p className="text-purple-300 font-bold text-lg animate-pulse drop-shadow-md">순서를 기억하세요...</p>
                ) : (
                  <p className="text-white font-bold text-lg drop-shadow-md">따라 눌러주세요!</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Game Over Screen */}
          {gameState === 'gameover' && (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl text-center w-full max-w-sm">
                <div className="w-20 h-20 bg-pink-500/20 rounded-full mx-auto flex items-center justify-center mb-4 border border-pink-500/30 shadow-[0_0_30px_rgba(236,72,153,0.3)]">
                  <RotateCcw className="w-10 h-10 text-pink-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">게임 오버!</h2>
                <p className="text-purple-100 mb-6 text-lg">
                  {difficulty === 'normal' ? '보통' : '어려움'} 난이도에서<br/>
                  <span className="font-bold text-yellow-300 text-2xl drop-shadow-md">{score}</span>단계를 기록했습니다.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => startGame(difficulty)}
                    className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                  >
                    다시 하기
                  </button>
                  <button
                    onClick={() => setGameState('intro')}
                    className="w-full py-4 bg-white/10 text-white rounded-xl font-bold text-lg hover:bg-white/20 transition-all border border-white/10"
                  >
                    메뉴로 돌아가기
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Clear Screen */}
          {gameState === 'clear' && (
            <motion.div
              key="clear"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl text-center w-full max-w-sm">
                <div className="w-24 h-24 bg-yellow-400/20 rounded-full mx-auto flex items-center justify-center mb-6 border border-yellow-400/30 shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                  <Trophy className="w-12 h-12 text-yellow-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">목표 달성!</h2>
                <p className="text-purple-100 mb-8 text-lg">
                  {difficulty === 'normal' ? '보통' : '어려움'} 난이도의<br/>
                  모든 단계(<span className="text-yellow-300 font-bold">{score}</span>단계)를 완벽하게 통과했습니다!
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => setGameState('intro')}
                    className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2"
                  >
                    다른 난이도 도전
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => navigate('/stats')}
                    className="w-full py-4 bg-white/10 text-white rounded-xl font-bold text-lg hover:bg-white/20 transition-all border border-white/10"
                  >
                    통계 확인하기
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
