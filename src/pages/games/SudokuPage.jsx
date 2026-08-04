import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSudoku } from 'sudoku-gen';
import { ArrowLeft, Clock, Trophy, Loader2, RefreshCw, Eraser, Brain, Lightbulb, PenLine } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function SudokuPage() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('intro');
  const [board, setBoard] = useState(null);
  const [original, setOriginal] = useState(null);
  const [solution, setSolution] = useState(null);
  const [notesBoard, setNotesBoard] = useState(null); // 9x9 array of arrays
  const [selectedCell, setSelectedCell] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [elapsed, setElapsed] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isNotesMode, setIsNotesMode] = useState(false);
  const timerRef = useRef(null);

  const initGame = (diff) => {
    setDifficulty(diff);
    const puzzle = getSudoku(diff);
    const b = [], o = [], s = [], n = [];
    for (let i = 0; i < 9; i++) {
      b.push(new Array(9).fill(''));
      o.push(new Array(9).fill(false));
      s.push(new Array(9).fill(''));
      n.push(new Array(9).fill([]));
      for (let j = 0; j < 9; j++) {
        const char = puzzle.puzzle[i * 9 + j];
        b[i][j] = char === '-' ? '' : char;
        o[i][j] = char !== '-';
        s[i][j] = puzzle.solution[i * 9 + j];
        n[i][j] = [];
      }
    }
    setBoard(b); setOriginal(o); setSolution(s); setNotesBoard(n);
    setSelectedCell(null); setElapsed(0); setGameState('playing');
    setIsNotesMode(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const handleInput = (val) => {
    if (gameState !== 'playing' || !selectedCell) return;
    const { r, c } = selectedCell;
    if (original[r][c]) return;

    if (val === '') {
      // Erase
      const newBoard = board.map(row => [...row]);
      newBoard[r][c] = '';
      setBoard(newBoard);
      
      // Also clear notes if any
      const newNotes = notesBoard.map(row => [...row]);
      newNotes[r][c] = [];
      setNotesBoard(newNotes);
      return;
    }

    const strVal = val.toString();

    if (isNotesMode) {
      // Toggle note
      const newNotes = notesBoard.map(row => [...row]);
      const currentNotes = newNotes[r][c];
      if (currentNotes.includes(strVal)) {
        newNotes[r][c] = currentNotes.filter(n => n !== strVal);
      } else {
        newNotes[r][c] = [...currentNotes, strVal].sort();
      }
      setNotesBoard(newNotes);
      
      // Clear main board value if it exists when adding a note
      if (board[r][c] !== '') {
        const newBoard = board.map(row => [...row]);
        newBoard[r][c] = '';
        setBoard(newBoard);
      }
    } else {
      // Normal input
      const newBoard = board.map(row => [...row]);
      newBoard[r][c] = strVal;
      setBoard(newBoard);
      checkWin(newBoard);
    }
  };

  const handleHint = () => {
    if (gameState !== 'playing' || !selectedCell) return;
    const { r, c } = selectedCell;
    if (original[r][c]) return;
    if (board[r][c] === solution[r][c]) return; // Already correct

    // Give hint (fill with correct answer)
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = solution[r][c];
    setBoard(newBoard);
    
    // Clear notes for this cell
    const newNotes = notesBoard.map(row => [...row]);
    newNotes[r][c] = [];
    setNotesBoard(newNotes);
    
    checkWin(newBoard);
  };

  const checkWin = async (currentBoard) => {
    for (let i = 0; i < 9; i++)
      for (let j = 0; j < 9; j++)
        if (currentBoard[i][j] === '' || currentBoard[i][j] !== solution[i][j]) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('finished'); setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('game_scores').insert({
          user_id: user.id, game_type: 'puzzle', score: 100,
          detail: { duration_sec: elapsed, difficulty, completed: true }
        });
      }
    } catch (err) { console.error("Failed to save score", err); }
    finally { setIsSaving(false); }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing' || !selectedCell) return;
      if (e.key >= '1' && e.key <= '9') handleInput(e.key);
      else if (e.key === 'Backspace' || e.key === 'Delete') handleInput('');
      else if (e.key === 'ArrowUp') setSelectedCell(p => p.r > 0 ? { r: p.r-1, c: p.c } : p);
      else if (e.key === 'ArrowDown') setSelectedCell(p => p.r < 8 ? { r: p.r+1, c: p.c } : p);
      else if (e.key === 'ArrowLeft') setSelectedCell(p => p.c > 0 ? { r: p.r, c: p.c-1 } : p);
      else if (e.key === 'ArrowRight') setSelectedCell(p => p.c < 8 ? { r: p.r, c: p.c+1 } : p);
      else if (e.key.toLowerCase() === 'n') setIsNotesMode(prev => !prev);
      else if (e.key.toLowerCase() === 'h') handleHint();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, selectedCell, board, isNotesMode, notesBoard]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const BOX_COLORS = {
    0: '#F5EEDD', 1: '#F8D7DA', 2: '#D6E4F0',
    3: '#D6E4F0', 4: '#F8D7DA', 5: '#D1ECE2',
    6: '#C5E4DA', 7: '#FADCC8', 8: '#FADCC8',
  };

  const PAD_COLORS = [
    '#F5B7B1', '#F5CBA7', '#FDF2B3', '#A3E4D7', '#AED6F1',
    '#FADBD8', '#ABEBC6', '#A9CCE3', '#F1948A',
  ];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: '#EFF6F5', fontFamily: "'Nunito', sans-serif" }}
    >
      {/* 풀스크린 배경 이미지 */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: 'url(/assets/games/sudoku_bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* 스마트폰 프레임 (Phone Frame) */}
      <div 
        className="relative z-10 w-full max-w-[420px] h-[100dvh] md:h-[90dvh] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden bg-[#FDFCF4]"
        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 12px rgba(255,255,255,0.7)' }}
      >
        
        {/* 헤더 및 상단 배경 (파란색 #D6EAF8) */}
        <div className="bg-[#D6EAF8] px-4 py-4 shrink-0 rounded-b-[2rem] shadow-sm relative z-20">
          <header className="flex items-center justify-between mb-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-slate-500 hover:bg-white/40 rounded-full transition-colors flex items-center gap-1 font-bold text-sm"
            >
              <ArrowLeft className="w-5 h-5" /> CarePulse
            </button>
            {gameState === 'playing' && (
              <button
                onClick={() => setGameState('intro')}
                className="text-[#66B2B2] font-bold flex items-center gap-1 text-sm bg-white/50 px-3 py-1.5 rounded-full hover:bg-white/80 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> 리셋
              </button>
            )}
          </header>

          {/* 타이틀 */}
          <div className="flex flex-col items-center pb-2">
            <div className="flex items-center gap-2">
              <Brain className="w-7 h-7 text-[#F1948A]" />
              <div className="flex flex-col">
                <span className="text-[#66B2B2] text-xs font-black tracking-widest uppercase">Brain Health</span>
                <h2 className="text-xl font-black text-[#2C3E50] tracking-wide uppercase leading-tight">스도쿠</h2>
              </div>
            </div>
          </div>
        </div>

        {/* 본문 콘텐츠 영역 */}
        <main className="flex-1 flex flex-col items-center p-4 w-full overflow-y-auto overflow-x-hidden relative z-10 bg-[#FDFCF4] -mt-6 pt-10">

          {/* ========== 인트로 ========== */}
          {gameState === 'intro' && (
            <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
              <div className="w-48 h-48 mb-8 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white bg-white">
                <img src="/assets/games/sudoku.png" alt="스도쿠" className="w-full h-full object-cover" />
              </div>
              <p className="text-[#7F8C8D] text-sm mb-12 text-center px-4 font-bold leading-relaxed">
                논리력 향상을 위한 두뇌 훈련 게임입니다.<br/>원하시는 난이도를 선택해 시작하세요.
              </p>
              <div className="flex flex-col gap-4 w-full px-6">
                <button onClick={() => initGame('easy')} className="w-full py-4 rounded-full text-lg font-black shadow-sm border-2 border-white transition-transform active:scale-95" style={{ backgroundColor: '#D1ECE2', color: '#117864' }}>쉬움 (Easy)</button>
                <button onClick={() => initGame('medium')} className="w-full py-4 rounded-full text-lg font-black shadow-sm border-2 border-white transition-transform active:scale-95" style={{ backgroundColor: '#FADCC8', color: '#D35400' }}>보통 (Medium)</button>
                <button onClick={() => initGame('hard')} className="w-full py-4 rounded-full text-lg font-black shadow-sm border-2 border-white transition-transform active:scale-95" style={{ backgroundColor: '#F8D7DA', color: '#900C3F' }}>어려움 (Hard)</button>
              </div>
            </div>
          )}

          {/* ========== 게임 플레이 ========== */}
          {gameState === 'playing' && (
            <div className="w-full flex flex-col items-center animate-in fade-in duration-500 max-w-[340px]">
              
              {/* Level / Timer 바 */}
              <div className="w-full flex justify-between items-center px-1 mb-4 text-[#5D6D7E] text-sm font-bold">
                <span>
                  Level: {difficulty === 'easy' ? '쉬움' : difficulty === 'medium' ? '보통' : '어려움'}
                </span>
                <span className="flex items-center gap-1 font-mono bg-white px-3 py-1 rounded-full shadow-sm">
                  <Clock className="w-4 h-4 text-[#F1948A]" /> {formatTime(elapsed)}
                </span>
              </div>

              {/* ===== 스도쿠 보드 ===== */}
              <div
                className="w-full rounded-[1.5rem] overflow-hidden shadow-md mb-8 relative"
                style={{ border: '4px solid #7CC5B8', backgroundColor: '#7CC5B8' }}
              >
                {/* 배경 워터마크 효과 (선택적) */}
                <div className="w-full aspect-square grid grid-rows-3 gap-[3px] p-[2px]">
                  {[0, 1, 2].map(boxRow => (
                    <div key={boxRow} className="grid grid-cols-3 gap-[3px]">
                      {[0, 1, 2].map(boxCol => {
                        const boxIdx = boxRow * 3 + boxCol;
                        const bgColor = BOX_COLORS[boxIdx];
                        return (
                          <div
                            key={boxCol}
                            className="grid grid-rows-3 grid-cols-3 gap-[1px] rounded-md overflow-hidden"
                            style={{ backgroundColor: '#B8D8D0' }}
                          >
                            {[0, 1, 2].map(innerRow => 
                              [0, 1, 2].map(innerCol => {
                                const r = boxRow * 3 + innerRow;
                                const c = boxCol * 3 + innerCol;
                                const cell = board[r][c];
                                const notes = notesBoard[r][c];
                                const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                                const isSameValue = cell !== '' && selectedCell && board[selectedCell.r]?.[selectedCell.c] === cell && !isSelected;
                                const isOriginal = original[r][c];
                                const isError = !isOriginal && cell !== '' && cell !== solution[r][c];

                                let textColor = '#2C3E50'; 
                                if (isSelected) textColor = '#B8860B'; 
                                else if (!isOriginal && isError) textColor = '#E74C3C'; 
                                else if (!isOriginal) textColor = '#AF7AC5'; 

                                let cellBg = bgColor;
                                if (isSelected) cellBg = '#F5D76E';
                                else if (isSameValue) cellBg = '#FFFACD';

                                return (
                                  <div
                                    key={`${r}-${c}`}
                                    onClick={() => setSelectedCell({ r, c })}
                                    className="flex items-center justify-center cursor-pointer select-none transition-all duration-150 relative"
                                    style={{
                                      backgroundColor: cellBg,
                                      boxShadow: isSelected ? 'inset 0 0 0 2px #DAA520' : 'none',
                                    }}
                                  >
                                    {/* 큰 숫자 렌더링 */}
                                    {cell !== '' ? (
                                      <span
                                        className="text-2xl font-black"
                                        style={{ color: textColor, fontFamily: "'Nunito', sans-serif" }}
                                      >
                                        {cell}
                                      </span>
                                    ) : (
                                      /* 노트(작은 숫자) 렌더링 */
                                      notes.length > 0 && (
                                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-0.5">
                                          {[1,2,3,4,5,6,7,8,9].map(n => (
                                            <div key={n} className="flex items-center justify-center leading-none">
                                              {notes.includes(n.toString()) && (
                                                <span className="text-[10px] sm:text-xs font-bold text-[#7F8C8D]">
                                                  {n}
                                                </span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* ===== 원형 숫자 키패드 ===== */}
              <div className="w-full flex flex-col items-center gap-4">
                {/* 1줄: 1 2 3 4 5 */}
                <div className="flex justify-between w-full">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      onClick={() => handleInput(num)}
                      className="w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shadow-sm transition-transform active:scale-90 border-2 border-white/80 hover:brightness-95"
                      style={{ backgroundColor: PAD_COLORS[num - 1], color: '#2C3E50' }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                {/* 2줄: 6 7 8 9 */}
                <div className="flex justify-center gap-4 w-full px-8">
                  {[6, 7, 8, 9].map(num => (
                    <button
                      key={num}
                      onClick={() => handleInput(num)}
                      className="w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shadow-sm transition-transform active:scale-90 border-2 border-white/80 hover:brightness-95"
                      style={{ backgroundColor: PAD_COLORS[num - 1], color: '#2C3E50' }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* ===== 컨트롤 버튼 (힌트 / 지우개 / 노트) ===== */}
              <div className="flex justify-center gap-8 w-full mt-6">
                {/* 힌트 버튼 */}
                <button
                  onClick={handleHint}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-200 transition-transform active:scale-90 group-hover:bg-[#FFFACD]">
                    <Lightbulb className="w-5 h-5 text-[#F39C12]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#7F8C8D]">Hint</span>
                </button>
                
                {/* 지우개 버튼 */}
                <button
                  onClick={() => handleInput('')}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-200 transition-transform active:scale-90 group-hover:bg-slate-50">
                    <Eraser className="w-5 h-5 text-[#34495E]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#7F8C8D]">Erase</span>
                </button>

                {/* 노트 버튼 */}
                <button
                  onClick={() => setIsNotesMode(!isNotesMode)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm border transition-transform active:scale-90 ${
                    isNotesMode 
                      ? 'bg-[#34495E] border-[#2C3E50]' 
                      : 'bg-white border-slate-200 group-hover:bg-slate-50'
                  }`}>
                    <PenLine className={`w-5 h-5 ${isNotesMode ? 'text-white' : 'text-[#34495E]'}`} />
                  </div>
                  <span className={`text-[11px] font-bold ${isNotesMode ? 'text-[#34495E]' : 'text-[#7F8C8D]'}`}>
                    Notes {isNotesMode ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

            </div>
          )}
        </main>
      </div>

      {/* ========== 완료 모달 ========== */}
      {gameState === 'finished' && (
        <div className="fixed inset-0 bg-[#2C3E50]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-[2rem] bg-[#D1ECE2] flex items-center justify-center mb-6 shadow-inner rotate-12">
              <Trophy className="w-12 h-12 text-[#117864] -rotate-12" />
            </div>
            <h2 className="text-3xl font-black text-[#2C3E50] mb-2 tracking-tight">Clear!</h2>
            <p className="text-[#7F8C8D] mb-8 font-bold">훌륭합니다! 퍼즐을 완성하셨네요.</p>
            
            <div className="w-full bg-[#FDFCF4] border-2 border-[#E5E8E8] rounded-2xl p-4 mb-8 flex justify-around">
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
              <div className="flex items-center justify-center w-full py-4 rounded-full bg-[#F2F4F4] text-[#7F8C8D] font-bold">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> 점수 기록 중...
              </div>
            ) : (
              <div className="w-full flex flex-col gap-3">
                <button onClick={() => setGameState('intro')} className="w-full text-white font-black text-lg py-4 rounded-full shadow-md transition-transform active:scale-95 bg-[#66B2B2] hover:bg-[#529595]">
                  한 판 더 하기
                </button>
                <button onClick={() => navigate('/prevention')} className="w-full bg-white text-[#7F8C8D] font-black text-lg py-4 rounded-full border-2 border-[#E5E8E8] transition-transform active:scale-95">
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
