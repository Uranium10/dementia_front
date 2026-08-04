import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSudoku } from 'sudoku-gen';
import { ArrowLeft, Clock, RefreshCw, CheckCircle2, Trophy, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function SudokuPage() {
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [original, setOriginal] = useState(null);
  const [solution, setSolution] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null); // {r, c}
  const [difficulty, setDifficulty] = useState('easy');
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
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
    setIsFinished(false);
    setIsPlaying(true);
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };

  useEffect(() => {
    initGame('easy');
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleInput = (val) => {
    if (!isPlaying || isFinished || !selectedCell) return;
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
    setIsFinished(true);
    setIsPlaying(false);
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
      if (!isPlaying || isFinished || !selectedCell) return;
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
  }, [isPlaying, isFinished, selectedCell, board]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white px-4 py-4 sticky top-0 z-40 border-b border-slate-100 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-800 ml-2">퍼즐 맞추기</h1>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
          <Clock className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-bold text-slate-700 font-mono tracking-wider">{formatTime(elapsed)}</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full">
        
        {/* 난이도 선택 및 리셋 */}
        <div className="w-full flex justify-between items-center mb-6 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex gap-1">
            {['easy', 'medium', 'hard'].map(level => (
              <button
                key={level}
                onClick={() => initGame(level)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${
                  difficulty === level 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {level === 'easy' ? '쉬움' : level === 'medium' ? '보통' : '어려움'}
              </button>
            ))}
          </div>
          <button 
            onClick={() => initGame(difficulty)} 
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="새 게임"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* 스도쿠 보드 */}
        <div className="w-full bg-white p-3 rounded-3xl shadow-sm border border-slate-100 mb-6">
          <div className="aspect-square w-full grid grid-cols-9 grid-rows-9 gap-0 border-2 border-slate-800 rounded-lg overflow-hidden bg-slate-200">
            {board?.map((row, r) => 
              row.map((cell, c) => {
                const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                const isSameBox = selectedCell && Math.floor(r/3) === Math.floor(selectedCell.r/3) && Math.floor(c/3) === Math.floor(selectedCell.c/3);
                const isSameRowCol = selectedCell && (r === selectedCell.r || c === selectedCell.c);
                const isSameValue = cell !== '' && selectedCell && board[selectedCell.r][selectedCell.c] === cell;
                const isOriginal = original[r][c];
                const isError = !isOriginal && cell !== '' && cell !== solution[r][c];

                // 박스 테두리 (3x3 마다 굵게)
                const borderClasses = `
                  ${c % 3 === 2 && c !== 8 ? 'border-r-2 border-r-slate-800' : 'border-r border-r-slate-300'}
                  ${r % 3 === 2 && r !== 8 ? 'border-b-2 border-b-slate-800' : 'border-b border-b-slate-300'}
                `;

                // 배경색
                let bgClass = 'bg-white';
                if (isSelected) bgClass = 'bg-blue-200';
                else if (isSameValue) bgClass = 'bg-blue-100';
                else if (isSameRowCol || isSameBox) bgClass = 'bg-blue-50';

                // 텍스트 색상
                let textClass = 'text-slate-800';
                if (!isOriginal) {
                  textClass = isError ? 'text-red-500' : 'text-blue-600';
                }

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => setSelectedCell({r, c})}
                    className={`flex items-center justify-center cursor-pointer select-none transition-colors duration-100
                      ${borderClasses}
                      ${bgClass}
                    `}
                  >
                    <span className={`text-lg sm:text-xl md:text-2xl font-bold font-mono ${textClass}`}>
                      {cell}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 숫자 키패드 (모바일 대응) */}
        <div className="w-full grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleInput(num)}
              className="bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 font-bold text-xl py-3 rounded-2xl shadow-sm transition-colors active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleInput('')}
            className="bg-slate-100 hover:bg-red-50 border border-slate-200 text-red-500 font-bold text-sm py-3 rounded-2xl shadow-sm transition-colors active:scale-95 flex items-center justify-center"
          >
            지우기
          </button>
        </div>
      </main>

      {/* 완료 모달 */}
      {isFinished && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <Trophy className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">퍼즐 완성!</h2>
            <p className="text-slate-500 mb-6 font-medium">대단해요! 멋지게 해결하셨습니다.</p>
            
            <div className="w-full bg-slate-50 rounded-2xl p-4 mb-8 flex justify-around">
              <div className="text-center">
                <p className="text-xs font-bold text-slate-400 mb-1">난이도</p>
                <p className="text-lg font-bold text-slate-700 capitalize">{difficulty === 'easy' ? '쉬움' : difficulty === 'medium' ? '보통' : '어려움'}</p>
              </div>
              <div className="w-px bg-slate-200"></div>
              <div className="text-center">
                <p className="text-xs font-bold text-slate-400 mb-1">소요 시간</p>
                <p className="text-lg font-bold text-slate-700 font-mono">{formatTime(elapsed)}</p>
              </div>
            </div>

            {isSaving ? (
              <div className="flex items-center text-slate-400 text-sm font-medium">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> 점수 기록 중...
              </div>
            ) : (
              <button
                onClick={() => navigate('/prevention')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-sm transition-colors"
              >
                목록으로 돌아가기
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
