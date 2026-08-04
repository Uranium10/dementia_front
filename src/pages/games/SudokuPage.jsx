import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSudoku } from 'sudoku-gen';
import { ArrowLeft, Clock, Trophy, Loader2, RefreshCw, Eraser, Brain } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function SudokuPage() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('intro'); // 'intro', 'playing', 'finished'
  const [board, setBoard] = useState(null);
  const [original, setOriginal] = useState(null);
  const [solution, setSolution] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null); // {r, c}
  const [difficulty, setDifficulty] = useState('medium');
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

  // 9개 구역(3x3)별 파스텔 배경색 (sudoku.png 참조)
  const getBoxColor = (r, c) => {
    const boxIdx = Math.floor(r / 3) * 3 + Math.floor(c / 3);
    const colors = [
      'bg-[#FADAE5]', // 0: Pink
      'bg-[#FFE8EC]', // 1: Lighter Pink
      'bg-[#D6EAF8]', // 2: Light Blue
      'bg-[#D6EAF8]', // 3: Light Blue
      'bg-[#E8F8F5]', // 4: Mint
      'bg-[#D5F5E3]', // 5: Light Green
      'bg-[#D1F2EB]', // 6: Mint
      'bg-[#FDEBD0]', // 7: Peach
      'bg-[#FAD7A1]', // 8: Orange
    ];
    return colors[boxIdx];
  };

  // 1~9 키패드 색상 (sudoku.png 참조)
  const padColors = [
    'bg-[#F5B7B1]', // 1
    'bg-[#F5CBA7]', // 2
    'bg-[#F9E79F]', // 3
    'bg-[#A3E4D7]', // 4
    'bg-[#AED6F1]', // 5
    'bg-[#FADBD8]', // 6
    'bg-[#ABEBC6]', // 7
    'bg-[#A9CCE3]', // 8
    'bg-[#F1948A]', // 9
  ];

  return (
    <div className="min-h-screen bg-[#FDFCF4] pb-20 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-transparent px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-500 hover:bg-slate-200/50 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        {gameState === 'playing' && (
          <button 
            onClick={() => setGameState('intro')} 
            className="text-[#66B2B2] font-bold flex items-center gap-1 text-sm hover:opacity-70"
          >
            <RefreshCw className="w-4 h-4" /> 난이도 변경
          </button>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-start p-4 max-w-md mx-auto w-full pt-2">
        
        {/* Intro Screen */}
        {gameState === 'intro' && (
          <div className="w-full flex flex-col items-center justify-center animate-in fade-in duration-500 mt-4">
            <div className="w-56 h-56 mb-8 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white bg-white">
              <img src="/assets/games/sudoku.png" alt="Sudoku Logo" className="w-full h-full object-cover" />
            </div>
            
            <h2 className="text-2xl font-black text-[#2C3E50] mb-2 uppercase tracking-wide flex items-center gap-2">
              <Brain className="w-6 h-6 text-[#F1948A]" />
              두뇌 건강 스도쿠
            </h2>
            <p className="text-[#7F8C8D] text-sm mb-12 text-center px-4 font-medium">
              논리력 향상을 위한 두뇌 훈련 게임입니다.<br/>원하시는 난이도를 선택해 시작하세요.
            </p>
            
            <div className="flex flex-col gap-4 w-full px-8">
              <button onClick={() => initGame('easy')} className="w-full bg-[#D1F2EB] hover:bg-[#A3E4D7] text-[#117864] font-black text-lg py-4 rounded-full shadow-sm transition-transform active:scale-95 border-2 border-white">
                쉬움
              </button>
              <button onClick={() => initGame('medium')} className="w-full bg-[#FDEBD0] hover:bg-[#F5CBA7] text-[#D35400] font-black text-lg py-4 rounded-full shadow-sm transition-transform active:scale-95 border-2 border-white">
                보통
              </button>
              <button onClick={() => initGame('hard')} className="w-full bg-[#FADAE5] hover:bg-[#F5B7B1] text-[#900C3F] font-black text-lg py-4 rounded-full shadow-sm transition-transform active:scale-95 border-2 border-white">
                어려움
              </button>
            </div>
          </div>
        )}

        {/* Playing Screen */}
        {gameState === 'playing' && (
          <div className="w-full animate-in fade-in duration-500 flex flex-col items-center">
            
            {/* Title & Info Bar */}
            <div className="w-full flex flex-col items-center mb-6">
              <h2 className="text-2xl font-black text-[#2C3E50] uppercase tracking-wide flex items-center gap-2 mb-2">
                <Brain className="w-6 h-6 text-[#F1948A]" />
                두뇌 건강: 스도쿠
              </h2>
              <div className="w-full flex justify-between items-center px-2 text-[#5D6D7E] text-sm font-semibold">
                <span className="capitalize">Level: {difficulty === 'easy' ? '쉬움' : difficulty === 'medium' ? '보통' : '어려움'}</span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-4 h-4" /> {formatTime(elapsed)}
                </span>
              </div>
            </div>

            {/* 스도쿠 보드 (sudoku.png 완벽 재현) */}
            <div className="w-full rounded-[1.5rem] overflow-hidden border-4 border-[#66B2B2] shadow-sm mb-8 bg-[#66B2B2]">
              <div className="w-full aspect-square grid grid-cols-9 grid-rows-9 gap-0 bg-[#66B2B2]">
                {board?.map((row, r) => 
                  row.map((cell, c) => {
                    const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                    const isSameValue = cell !== '' && selectedCell && board[selectedCell.r][selectedCell.c] === cell;
                    const isOriginal = original[r][c];
                    const isError = !isOriginal && cell !== '' && cell !== solution[r][c];
                    
                    const baseBoxColor = getBoxColor(r, c);

                    // 굵은 3x3 보더 처리는 배경색(#66B2B2) 위에서 마진/보더로 처리
                    // gap-0 상태에서 각 셀에 얇은 선을 주고, 3x3은 두껍게 줌
                    const borderRight = c % 3 === 2 && c !== 8 ? 'border-r-2' : c !== 8 ? 'border-r-[1px]' : '';
                    const borderBottom = r % 3 === 2 && r !== 8 ? 'border-b-2' : r !== 8 ? 'border-b-[1px]' : '';
                    
                    const borderClasses = `${borderRight} ${borderBottom} border-[#66B2B2]`;

                    // 셀 배경 (선택 시 튀어나온 노란색 효과)
                    let bgClass = baseBoxColor; 
                    let innerClass = "w-full h-full flex items-center justify-center transition-colors duration-100";

                    if (isSelected) {
                      innerClass += ' bg-[#FDE08B] shadow-[inset_0px_0px_0px_2px_#E3B63A] rounded-md scale-95';
                    } else if (isSameValue) {
                      innerClass += ' bg-white/40';
                    }

                    // 텍스트 색상
                    let textClass = 'text-[#2C3E50]'; 
                    if (!isOriginal) {
                      textClass = isError ? 'text-[#E74C3C]' : 'text-[#AF7AC5]'; // 사용자가 쓴 글씨는 연보라/빨강
                    }
                    if (isSelected) textClass = 'text-[#B77B00]';

                    return (
                      <div
                        key={`${r}-${c}`}
                        onClick={() => setSelectedCell({r, c})}
                        className={`bg-white ${borderClasses}`}
                      >
                        <div className={`${bgClass} w-full h-full p-[1px]`}>
                          <div className={innerClass}>
                            <span className={`text-xl sm:text-2xl md:text-[1.75rem] ${isOriginal ? 'font-medium' : 'font-medium'} ${textClass} font-sans`}>
                              {cell}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 원형 숫자 키패드 (sudoku.png 참조) */}
            <div className="w-full flex flex-col gap-4 px-2 max-w-[320px]">
              {/* 첫 번째 줄: 1 2 3 4 5 */}
              <div className="flex justify-between w-full">
                {[1, 2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    onClick={() => handleInput(num)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-[#2C3E50] font-semibold text-xl shadow-sm transition-transform active:scale-90 ${padColors[num-1]}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              {/* 두 번째 줄: 6 7 8 9 + Erase */}
              <div className="flex justify-between w-full">
                {[6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    onClick={() => handleInput(num)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-[#2C3E50] font-semibold text-xl shadow-sm transition-transform active:scale-90 ${padColors[num-1]}`}
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => handleInput('')}
                  className="w-12 h-12 rounded-full bg-white flex flex-col items-center justify-center text-[#2C3E50] font-semibold text-xs shadow-sm transition-transform active:scale-90 border border-slate-200"
                >
                  <Eraser className="w-5 h-5 mb-0.5 text-slate-500" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 완료 모달 */}
      {gameState === 'finished' && (
        <div className="fixed inset-0 bg-[#2C3E50]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-[#D1F2EB] rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Trophy className="w-12 h-12 text-[#117864]" />
            </div>
            <h2 className="text-3xl font-black text-[#2C3E50] mb-2 tracking-tight uppercase">Clear!</h2>
            <p className="text-[#7F8C8D] mb-8 font-medium">대단해요! 두뇌가 한결 맑아지셨을 거예요.</p>
            
            <div className="w-full bg-[#FDFCF4] border-2 border-[#E5E8E8] rounded-2xl p-5 mb-8 flex justify-around">
              <div className="text-center">
                <p className="text-xs font-bold text-[#AAB7B8] mb-1">난이도</p>
                <p className="text-lg font-black text-[#2C3E50] capitalize">{difficulty === 'easy' ? '쉬움' : difficulty === 'medium' ? '보통' : '어려움'}</p>
              </div>
              <div className="w-0.5 bg-[#E5E8E8] rounded-full"></div>
              <div className="text-center">
                <p className="text-xs font-bold text-[#AAB7B8] mb-1">소요 시간</p>
                <p className="text-lg font-black text-[#2C3E50] font-mono">{formatTime(elapsed)}</p>
              </div>
            </div>

            {isSaving ? (
              <div className="flex items-center justify-center w-full bg-[#F2F4F4] text-[#7F8C8D] font-medium py-4 rounded-full">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> 점수 기록 중...
              </div>
            ) : (
              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={() => setGameState('intro')}
                  className="w-full bg-[#66B2B2] hover:bg-[#529595] text-white font-black text-lg py-4 rounded-full shadow-md transition-transform active:scale-95"
                >
                  한 판 더 하기
                </button>
                <button
                  onClick={() => navigate('/prevention')}
                  className="w-full bg-white hover:bg-slate-50 text-[#7F8C8D] font-black text-lg py-4 rounded-full border-2 border-[#E5E8E8] transition-transform active:scale-95"
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
