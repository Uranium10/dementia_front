import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, Brain, Heart, Star, RotateCcw, Home, Trophy, ChevronRight } from 'lucide-react';
import { supabase } from '../../supabaseClient';

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
  
  const [gameState, setGameState] = useState('intro'); // 'intro', 'playing', 'gameover', 'clear'
  const [difficulty, setDifficulty] = useState('normal');
  const [sequence, setSequence] = useState([]);
  const [playerSequence, setPlayerSequence] = useState([]);
  const [isPlayback, setIsPlayback] = useState(false);
  const [activeTile, setActiveTile] = useState(null);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [score, setScore] = useState(0); 
  
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

    currentSeq.forEach((tileIndex, i) => {
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

    const nextTile = Math.floor(Math.random() * config.gridCount);
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

    if (newPlayerSeq.length === sequence.length) {
      setIsPlayback(true);
      setTimeout(() => {
        nextLevel(sequence);
      }, 800);
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
    <div className="min-h-screen bg-gray-50 flex flex-col pt-20">
      <div className="max-w-md w-full mx-auto p-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/prevention')}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            <Home className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" />
            <h1 className="text-xl font-bold text-gray-800">순서 기억하기</h1>
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
              <div className="bg-white rounded-3xl p-8 shadow-sm text-center mb-8">
                <div className="w-24 h-24 bg-purple-100 rounded-2xl mx-auto flex items-center justify-center mb-6">
                  <Play className="w-12 h-12 text-purple-600 ml-2" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">순서 기억하기</h2>
                <p className="text-gray-600 mb-2">빛나는 사각형의 순서를 기억하고</p>
                <p className="text-gray-600 mb-8">그대로 따라 누르세요!</p>

                <div className="space-y-4">
                  {Object.values(DIFFICULTIES).map((diff) => (
                    <button
                      key={diff.id}
                      onClick={() => startGame(diff.id)}
                      className="w-full flex flex-col items-center p-4 bg-gray-50 hover:bg-purple-50 rounded-2xl transition-all group border border-gray-100 hover:border-purple-200"
                    >
                      <span className="font-bold text-lg text-gray-800 group-hover:text-purple-600 mb-1">
                        {diff.name} 난이도
                      </span>
                      <span className="text-sm text-gray-500">{diff.desc}</span>
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
              className="flex-1 flex flex-col"
            >
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm mb-8">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <span className="font-bold text-lg text-gray-800">
                    단계: {score} / {currentConfig.maxLevel}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(INITIAL_LIVES)].map((_, i) => (
                    <Heart
                      key={i}
                      className={`w-5 h-5 ${
                        i < lives
                          ? 'text-red-500 fill-current'
                          : 'text-gray-200'
                      } transition-colors duration-300`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-[360px] aspect-square">
                  <div className={`grid ${currentConfig.gridCols} gap-3 h-full`}>
                    {[...Array(currentConfig.gridCount)].map((_, index) => {
                      const isActive = activeTile === index;
                      return (
                        <motion.button
                          key={index}
                          onClick={() => handleTileClick(index)}
                          disabled={isPlayback}
                          whileTap={!isPlayback ? { scale: 0.9 } : {}}
                          className={`
                            rounded-2xl transition-all duration-200
                            ${isActive 
                              ? 'bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.6)] border-purple-400 z-10 scale-105' 
                              : 'bg-white border-2 border-gray-100 shadow-sm'
                            }
                            ${!isPlayback && !isActive ? 'hover:border-purple-200' : ''}
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
                  <p className="text-purple-600 font-medium animate-pulse">순서를 기억하세요...</p>
                ) : (
                  <p className="text-gray-600 font-medium">따라 눌러주세요!</p>
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
              <div className="bg-white rounded-3xl p-8 shadow-sm text-center w-full max-w-sm">
                <div className="w-20 h-20 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4">
                  <RotateCcw className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">게임 오버!</h2>
                <p className="text-gray-600 mb-6">
                  {difficulty === 'normal' ? '보통' : '어려움'} 난이도에서<br/>
                  <span className="font-bold text-purple-600 text-lg">{score}</span>단계를 기록했습니다.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => startGame(difficulty)}
                    className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
                  >
                    다시 하기
                  </button>
                  <button
                    onClick={() => setGameState('intro')}
                    className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-200 transition-colors"
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
              <div className="bg-white rounded-3xl p-8 shadow-sm text-center w-full max-w-sm">
                <div className="w-24 h-24 bg-yellow-100 rounded-full mx-auto flex items-center justify-center mb-6">
                  <Trophy className="w-12 h-12 text-yellow-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">목표 달성!</h2>
                <p className="text-gray-600 mb-8">
                  {difficulty === 'normal' ? '보통' : '어려움'} 난이도의<br/>
                  모든 단계({score}단계)를 완벽하게 통과했습니다!
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => setGameState('intro')}
                    className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
                  >
                    다른 난이도 도전
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => navigate('/stats')}
                    className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-200 transition-colors"
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
