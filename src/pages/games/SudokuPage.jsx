import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSudoku } from 'sudoku-gen';
import { ArrowLeft, Clock, Trophy, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function SudokuPage() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('intro'); // 'intro', 'playing', 'finished'
  const [board, setBoard] = useState(null);
  const [original, setOriginal] = useState(null);
  const [solution, setSolution] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null); // {r, c}
  const [difficulty, setDifficulty] = useState('easy');
  const [elapsed, setElapsed] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef(null);

  const initGame = (diff) => {
    setDifficulty(diff);
    const puzzle = getSudoku(diff);
    const b = [];
    const o = [];
    const s = [];
    for (let i = 0; i < 9; i++) {
      b.push(new Array(9).fill(''));
      o.push(new Array(9).fill(false));
      s.push(new Array(9).fill(''));
      for (let j = 0; j < 9; j++) {
        const char = puzzle.puzzle[i * 9 + j];
        b[i][j] = char === '-' ? '' : char;
        o[i][j] = char !== '-';
        s[i][j] = puzzle.solution[i * 9 + j];
      }
    }
    setBoard(b);
    setOriginal(o);
    setSolution(s);
    setSelectedCell(null);
    setElapsed(0);
    setGameState('playing');
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleInput = (val) => {
    if (gameState !== 'playing' || !selectedCell) return;
    const { r, c } = selectedCell;
    if (original[r][c]) return;

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = val === '' ? '' : val.toString();
    setBoard(newBoard);

    checkWin(newBoard);
  };

  const checkWin = async (currentBoard) => {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (currentBoard[i][j] === '' || currentBoard[i][j] !== solution[i][j]) {
          return;
        }
      }
    }
    
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('finished');
    setIsSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('game_scores').insert({
          user_id: user.id,
          game_type: 'puzzle',
          score: 100, 
          detail: { duration_sec: elapsed, difficulty: difficulty, completed: true }
        });
      }
    } catch (err) {
      console.error("Failed to save score", err);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing' || !selectedCell) return;
      if (e.key >= '1' && e.key <= '9') {
        handleInput(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleInput('');
      } else if (e.key === 'ArrowUp') {
        setSelectedCell(p => p.r > 0 ? { r: p.r - 1, c: p.c } : p);
      } else if (e.key === 'ArrowDown') {
        setSelectedCell(p => p.r < 8 ? { r: p.r + 1, c: p.c } : p);
      } else if (e.key === 'ArrowLeft') {
        setSelectedCell(p => p.c > 0 ? { r: p.r, c: p.c - 1 } : p);
      } else if (e.key === 'ArrowRight') {
        setSelectedCell(p => p.c < 8 ? { r: p.r, c: p.c + 1 } : p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, selectedCell, board]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 파스텔 박스 색상 (9개의 3x3 영역에 각각 다른 파스텔 톤 적용)
  const getBoxColor = (r, c) => {
    const boxIdx = Math.floor(r / 3) * 3 + Math.floor(c / 3);
    const colors = [
      'bg-[#FFE5EC]', // light pink
      'bg-[#FFF2CC]', // light yellow
      'bg-[#E5F9E0]', // light green
      'bg-[#E2F0CB]', // pale green
      'bg-[#F0E6FF]', // light purple
      'bg-[#E5F2FF]', // light blue
      'bg-[#FFE5B4]', // peach
      'bg-[#D5E8D4]', // mint
      'bg-[#F8CECC]', // rose
    ];
    return colors[boxIdx];
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-20 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white px-4 py-4 sticky top-0 z-40 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-black text-[#5B637A] ml-2 tracking-tight">스도쿠</h1>
        </div>
        {gameState === 'playing' && (
          <div className="flex items-center gap-2 bg-[#F3F4F6] px-4 py-2 rounded-full shadow-inner">
            <Clock className="w-4 h-4 text-[#9CA3AF]" />
            <span className="text-sm font-bold text-[#4B5563] font-mono tracking-wider">{formatTime(elapsed)}</span>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-start p-4 max-w-md mx-auto w-full pt-8">
        
        {/* Intro Screen */}
        {gameState === 'intro' && (
          <div className="w-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500 mt-4">
            <div className="w-56 h-56 mb-8 rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white bg-white">
              <img src="/assets/games/sudoku.png" alt="Sudoku Logo" className="w-full h-full object-cover" />
            </div>
            
            <h2 className="text-3xl font-black text-[#5B637A] mb-3">스도쿠 퍼즐</h2>
            <p className="text-[#8993A4] text-sm mb-12 text-center px-4 font-medium leading-relaxed">
              화사한 색감과 함께 두뇌를 깨워보세요.<br/>난이도를 선택하면 바로 시작됩니다.
            </p>
            
            <div className="flex flex-col gap-4 w-full px-4">
              <button onClick={() => initGame('easy')} className="w-full bg-[#E5F9E0] hover:bg-[#D5E8D4] text-[#4A7C59] font-black text-lg py-5 rounded-[1.5rem] shadow-sm transition-transform active:scale-95">
                쉬움 (입문자용)
              </button>
              <button onClick={() => initGame('medium')} className="w-full bg-[#FFF2CC] hover:bg-[#FFE699] text-[#B38F00] font-black text-lg py-5 rounded-[1.5rem] shadow-sm transition-transform active:scale-95">
                보통 (일반용)
              </button>
              <button onClick={() => initGame('hard')} className="w-full bg-[#FFE5EC] hover:bg-[#FFCCD5] text-[#C9184A] font-black text-lg py-5 rounded-[1.5rem] shadow-sm transition-transform active:scale-95">
                어려움 (숙련자용)
              </button>
            </div>
          </div>
        )}

        {/* Playing Screen */}
        {gameState === 'playing' && (
          <div className="w-full animate-in fade-in duration-500 flex flex-col items-center">
            {/* 난이도 표시 및 리셋 */}
            <div className="w-full flex justify-between items-center mb-6 px-2">
              <span className={`px-5 py-2 rounded-2xl text-xs font-black shadow-sm tracking-wide ${
                difficulty === 'easy' ? 'bg-[#E5F9E0] text-[#4A7C59]' : 
                difficulty === 'medium' ? 'bg-[#FFF2CC] text-[#B38F00]' : 'bg-[#FFE5EC] text-[#C9184A]'
              }`}>
                {difficulty === 'easy' ? '쉬움' : difficulty === 'medium' ? '보통' : '어려움'} 모드
              </span>
              <button 
                onClick={() => initGame(difficulty)} 
                className="p-2 flex items-center gap-1.5 text-[#8993A4] hover:text-[#5B637A] hover:bg-[#F3F4F6] rounded-xl transition-colors text-xs font-bold"
              >
                <RefreshCw className="w-4 h-4" /> 다시 시작
              </button>
            </div>

            {/* 스도쿠 보드 (Flat Vector Pastel 스타일) */}
            <div className="w-full bg-white p-3 rounded-[2rem] shadow-xl border-4 border-white mb-8">
              <div className="aspect-square w-full grid grid-cols-9 grid-rows-9 gap-1 bg-[#F3F4F6] p-1 rounded-3xl overflow-hidden">
                {board?.map((row, r) => 
                  row.map((cell, c) => {
                    const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                    const isSameValue = cell !== '' && selectedCell && board[selectedCell.r][selectedCell.c] === cell;
                    const isOriginal = original[r][c];
                    const isError = !isOriginal && cell !== '' && cell !== solution[r][c];
                    
                    // 구역별 파스텔 배경
                    const baseBoxColor = getBoxColor(r, c);

                    // 셀 스타일링
                    let bgClass = baseBoxColor; 
                    let shadowClass = '';
                    let scaleClass = 'scale-100';

                    if (isSelected) {
                      bgClass = 'bg-[#5B637A]';
                      shadowClass = 'shadow-md z-10';
                      scaleClass = 'scale-110';
                    } else if (isSameValue) {
                      bgClass = 'bg-white';
                      shadowClass = 'shadow-sm z-0 ring-2 ring-[#5B637A]/20';
                    }

                    // 텍스트 색상
                    let textClass = 'text-[#5B637A]'; // 기본 색상 (부드러운 다크 그레이)
                    if (isSelected) {
                      textClass = 'text-white';
                    } else if (!isOriginal) {
                      textClass = isError ? 'text-[#FF4D4D] font-black' : 'text-[#4A90E2] font-black'; // 사용자가 입력한 값은 파란색/빨간색
                    }

                    return (
                      <div
                        key={`${r}-${c}`}
                        onClick={() => setSelectedCell({r, c})}
                        className={`flex items-center justify-center cursor-pointer select-none transition-all duration-200 rounded-lg
                          ${bgClass} ${shadowClass} ${scaleClass}
                        `}
                      >
                        <span className={`text-xl sm:text-2xl md:text-3xl ${isOriginal ? 'font-black' : 'font-black'} ${textClass} font-mono`}>
                          {cell}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 숫자 키패드 (둥글고 귀여운 버튼) */}
            <div className="w-full grid grid-cols-5 gap-3 px-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => handleInput(num)}
                  className="bg-white hover:bg-[#F3F4F6] text-[#5B637A] font-black text-2xl py-3 rounded-2xl shadow-sm transition-all active:scale-90"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => handleInput('')}
                className="bg-[#FFE5EC] hover:bg-[#FFCCD5] text-[#C9184A] font-black text-sm py-3 rounded-2xl shadow-sm transition-all active:scale-90 flex items-center justify-center"
              >
                지우기
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 완료 모달 */}
      {gameState === 'finished' && (
        <div className="fixed inset-0 bg-[#5B637A]/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-[#E5F9E0] rounded-[2rem] flex items-center justify-center mb-6 shadow-inner rotate-12">
              <Trophy className="w-12 h-12 text-[#4A7C59] -rotate-12" />
            </div>
            <h2 className="text-3xl font-black text-[#5B637A] mb-2 tracking-tight">퍼즐 완성!</h2>
            <p className="text-[#8993A4] mb-8 font-bold">정말 훌륭해요! 두뇌가 한결 맑아지셨을 거예요.</p>
            
            <div className="w-full bg-[#FAFAF8] rounded-3xl p-5 mb-8 flex justify-around shadow-inner border border-slate-100">
              <div className="text-center">
                <p className="text-xs font-black text-[#8993A4] mb-1">난이도</p>
                <p className="text-xl font-black text-[#5B637A]">{difficulty === 'easy' ? '쉬움' : difficulty === 'medium' ? '보통' : '어려움'}</p>
              </div>
              <div className="w-0.5 bg-slate-200 rounded-full"></div>
              <div className="text-center">
                <p className="text-xs font-black text-[#8993A4] mb-1">소요 시간</p>
                <p className="text-xl font-black text-[#5B637A] font-mono">{formatTime(elapsed)}</p>
              </div>
            </div>

            {isSaving ? (
              <div className="flex items-center justify-center w-full bg-[#F3F4F6] text-[#8993A4] font-bold py-5 rounded-3xl">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> 기록 저장 중...
              </div>
            ) : (
              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={() => setGameState('intro')}
                  className="w-full bg-[#5B637A] hover:bg-[#4B5563] text-white font-black text-lg py-5 rounded-3xl shadow-lg transition-transform active:scale-95"
                >
                  한 판 더 하기
                </button>
                <button
                  onClick={() => navigate('/prevention')}
                  className="w-full bg-white hover:bg-slate-50 text-[#8993A4] font-black text-lg py-5 rounded-3xl border-2 border-slate-100 transition-transform active:scale-95"
                >
                  목록으로 돌아가기
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
