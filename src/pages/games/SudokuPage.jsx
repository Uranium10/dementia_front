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
    
    // Win!
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('finished');
    setIsSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('game_scores').insert({
          user_id: user.id,
          game_type: 'puzzle',
          score: 100, // 고정 점수
          detail: { 
            duration_sec: elapsed, 
            difficulty: difficulty,
            completed: true
          }
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

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-20 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white px-4 py-4 sticky top-0 z-40 border-b border-rose-50 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-rose-400 hover:bg-rose-50 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-700 ml-2">스도쿠</h1>
        </div>
        {gameState === 'playing' && (
          <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold text-indigo-600 font-mono tracking-wider">{formatTime(elapsed)}</span>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full">
        
        {/* Intro Screen */}
        {gameState === 'intro' && (
          <div className="w-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500 mt-10">
            <div className="w-48 h-48 mb-8 rounded-3xl overflow-hidden shadow-xl shadow-rose-100 border-4 border-white">
              <img src="/assets/games/sudoku.png" alt="Sudoku Logo" className="w-full h-full object-cover" />
            </div>
            
            <h2 className="text-2xl font-extrabold text-slate-700 mb-2">두뇌 회전 스도쿠</h2>
            <p className="text-slate-500 text-sm mb-10 text-center px-4">숫자를 채우며 논리력과 기억력을 키워보세요.<br/>원하시는 난이도를 선택해 시작하세요!</p>
            
            <div className="flex flex-col gap-3 w-full px-8">
              <button onClick={() => initGame('easy')} className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold py-4 rounded-2xl shadow-sm transition-all transform hover:scale-105">
                쉬움 (입문자용)
              </button>
              <button onClick={() => initGame('medium')} className="w-full bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold py-4 rounded-2xl shadow-sm transition-all transform hover:scale-105">
                보통 (일반용)
              </button>
              <button onClick={() => initGame('hard')} className="w-full bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold py-4 rounded-2xl shadow-sm transition-all transform hover:scale-105">
                어려움 (숙련자용)
              </button>
            </div>
          </div>
        )}

        {/* Playing Screen */}
        {gameState === 'playing' && (
          <div className="w-full animate-in fade-in duration-500">
            {/* 난이도 표시 및 리셋 */}
            <div className="w-full flex justify-between items-center mb-6 px-2">
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize shadow-sm ${
                difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' : 
                difficulty === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {difficulty === 'easy' ? '쉬움' : difficulty === 'medium' ? '보통' : '어려움'} 모드
              </span>
              <button 
                onClick={() => initGame(difficulty)} 
                className="p-2 flex items-center gap-1 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors text-xs font-bold"
              >
                <RefreshCw className="w-4 h-4" /> 다시 시작
              </button>
            </div>

            {/* 스도쿠 보드 */}
            <div className="w-full bg-white p-2 rounded-3xl shadow-xl shadow-indigo-100/50 border border-slate-100 mb-8">
              <div className="aspect-square w-full grid grid-cols-9 grid-rows-9 gap-0 border-[3px] border-indigo-200 rounded-xl overflow-hidden bg-white">
                {board?.map((row, r) => 
                  row.map((cell, c) => {
                    const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                    const isSameBox = selectedCell && Math.floor(r/3) === Math.floor(selectedCell.r/3) && Math.floor(c/3) === Math.floor(selectedCell.c/3);
                    const isSameRowCol = selectedCell && (r === selectedCell.r || c === selectedCell.c);
                    const isSameValue = cell !== '' && selectedCell && board[selectedCell.r][selectedCell.c] === cell;
                    const isOriginal = original[r][c];
                    const isError = !isOriginal && cell !== '' && cell !== solution[r][c];

                    // 박스 구분을 파스텔톤으로 강조
                    const boxIdx = Math.floor(r/3) * 3 + Math.floor(c/3);
                    const isAltBox = boxIdx % 2 === 1;

                    // 테두리 두껍게
                    const borderClasses = `
                      ${c % 3 === 2 && c !== 8 ? 'border-r-2 border-r-indigo-100' : 'border-r border-r-slate-100'}
                      ${r % 3 === 2 && r !== 8 ? 'border-b-2 border-b-indigo-100' : 'border-b border-b-slate-100'}
                    `;

                    // 배경색 로직
                    let bgClass = isAltBox ? 'bg-[#F9FAFB]' : 'bg-white'; 
                    if (isSelected) bgClass = 'bg-rose-200';
                    else if (isSameValue) bgClass = 'bg-indigo-200/60';
                    else if (isSameRowCol || isSameBox) bgClass = 'bg-rose-50';

                    // 텍스트 색상
                    let textClass = 'text-slate-700';
                    if (!isOriginal) {
                      textClass = isError ? 'text-rose-500 font-extrabold' : 'text-indigo-600 font-bold';
                    } else {
                      textClass = 'text-slate-800 font-extrabold';
                    }

                    return (
                      <div
                        key={`${r}-${c}`}
                        onClick={() => setSelectedCell({r, c})}
                        className={`flex items-center justify-center cursor-pointer select-none transition-colors duration-200
                          ${borderClasses}
                          ${bgClass}
                        `}
                      >
                        <span className={`text-lg sm:text-xl md:text-2xl font-mono ${textClass}`}>
                          {cell}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 숫자 키패드 (파스텔 톤) */}
            <div className="w-full grid grid-cols-5 gap-2 px-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => handleInput(num)}
                  className="bg-white hover:bg-indigo-50 border-b-4 border-slate-200 active:border-b-0 active:translate-y-[4px] text-indigo-600 font-extrabold text-xl py-3 rounded-2xl shadow-sm transition-all"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => handleInput('')}
                className="bg-rose-50 hover:bg-rose-100 border-b-4 border-rose-200 active:border-b-0 active:translate-y-[4px] text-rose-500 font-bold text-sm py-3 rounded-2xl shadow-sm transition-all flex items-center justify-center"
              >
                지우기
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 완료 모달 */}
      {gameState === 'finished' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-gradient-to-tr from-emerald-200 to-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-100">
              <Trophy className="w-12 h-12 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">퍼즐 완성!</h2>
            <p className="text-slate-500 mb-6 font-medium">대단해요! 두뇌가 한결 맑아지셨을 거예요.</p>
            
            <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-8 flex justify-around">
              <div className="text-center">
                <p className="text-xs font-bold text-slate-400 mb-1">난이도</p>
                <p className="text-lg font-bold text-indigo-600 capitalize">{difficulty === 'easy' ? '쉬움' : difficulty === 'medium' ? '보통' : '어려움'}</p>
              </div>
              <div className="w-px bg-slate-200"></div>
              <div className="text-center">
                <p className="text-xs font-bold text-slate-400 mb-1">소요 시간</p>
                <p className="text-lg font-bold text-indigo-600 font-mono">{formatTime(elapsed)}</p>
              </div>
            </div>

            {isSaving ? (
              <div className="flex items-center justify-center w-full bg-slate-100 text-slate-500 font-medium py-4 rounded-2xl">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> 기록 저장 중...
              </div>
            ) : (
              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={() => setGameState('intro')}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-md shadow-indigo-200 transition-colors"
                >
                  한 판 더 하기
                </button>
                <button
                  onClick={() => navigate('/prevention')}
                  className="w-full bg-white hover:bg-slate-50 text-slate-500 font-bold py-4 rounded-2xl transition-colors"
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
