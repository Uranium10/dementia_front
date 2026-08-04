import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSudoku } from 'sudoku-gen';
import { ArrowLeft, Clock, Trophy, Loader2, RefreshCw, Eraser, Brain } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function SudokuPage() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('intro');
  const [board, setBoard] = useState(null);
  const [original, setOriginal] = useState(null);
  const [solution, setSolution] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [elapsed, setElapsed] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef(null);

  const initGame = (diff) => {
    setDifficulty(diff);
    const puzzle = getSudoku(diff);
    const b = [], o = [], s = [];
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
    setBoard(b); setOriginal(o); setSolution(s);
    setSelectedCell(null); setElapsed(0); setGameState('playing');
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, selectedCell, board]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // sudoku.png에서 추출한 정확한 3x3 박스별 파스텔 색상
  const BOX_COLORS = {
    0: '#F5EEDD', // 크림/베이지 (좌상)
    1: '#F8D7DA', // 연분홍 (중상)
    2: '#D6E4F0', // 연파랑 (우상)
    3: '#D6E4F0', // 연파랑 (좌중)
    4: '#F8D7DA', // 연분홍 (중중)
    5: '#D1ECE2', // 연민트 (우중)
    6: '#C5E4DA', // 민트/틸 (좌하)
    7: '#FADCC8', // 살구/피치 (중하)
    8: '#FADCC8', // 살구/피치 (우하)
  };

  // sudoku.png에서 추출한 숫자 키패드 원형 색상
  const PAD_COLORS = [
    '#F5B7B1', '#F5CBA7', '#FDF2B3', '#A3E4D7', '#AED6F1',
    '#FADBD8', '#ABEBC6', '#A9CCE3', '#F1948A',
  ];

  return (
    <div
      className="min-h-screen flex flex-col font-sans relative"
      style={{ backgroundColor: '#EFF6F5' }}
    >
      {/* ===== 풀스크린 배경 이미지 (sudoku.png 뒤의 장식 블롭과 동일) ===== */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: 'url(/assets/games/sudoku_bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* ===== 콘텐츠 영역 ===== */}
      <div className="relative z-10 flex flex-col min-h-screen pb-20">
        
        {/* 헤더 */}
        <header className="px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-slate-500 hover:bg-white/60 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          {gameState === 'playing' && (
            <button
              onClick={() => setGameState('intro')}
              className="text-[#7CC5B8] font-bold flex items-center gap-1 text-sm hover:opacity-70"
            >
              <RefreshCw className="w-4 h-4" /> 난이도 변경
            </button>
          )}
        </header>

        <main className="flex-1 flex flex-col items-center justify-start px-4 max-w-md mx-auto w-full pt-2">

          {/* ========== 인트로 ========== */}
          {gameState === 'intro' && (
            <div className="w-full flex flex-col items-center mt-4">
              <div className="w-52 h-52 mb-8 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white bg-white">
                <img src="/assets/games/sudoku.png" alt="스도쿠" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-6 h-6 text-[#F1948A]" />
                <h2 className="text-2xl font-black text-[#2C3E50] tracking-wide">두뇌 건강: 스도쿠</h2>
              </div>
              <p className="text-[#7F8C8D] text-sm mb-12 text-center px-4 font-medium leading-relaxed">
                논리력 향상을 위한 두뇌 훈련 게임입니다.<br/>원하시는 난이도를 선택해 시작하세요.
              </p>
              <div className="flex flex-col gap-4 w-full px-6">
                <button onClick={() => initGame('easy')} className="w-full py-4 rounded-full text-lg font-black shadow-sm border-2 border-white transition-transform active:scale-95" style={{ backgroundColor: '#D1ECE2', color: '#117864' }}>쉬움</button>
                <button onClick={() => initGame('medium')} className="w-full py-4 rounded-full text-lg font-black shadow-sm border-2 border-white transition-transform active:scale-95" style={{ backgroundColor: '#FADCC8', color: '#D35400' }}>보통</button>
                <button onClick={() => initGame('hard')} className="w-full py-4 rounded-full text-lg font-black shadow-sm border-2 border-white transition-transform active:scale-95" style={{ backgroundColor: '#F8D7DA', color: '#900C3F' }}>어려움</button>
              </div>
            </div>
          )}

          {/* ========== 게임 플레이 ========== */}
          {gameState === 'playing' && (
            <div className="w-full flex flex-col items-center">

              {/* 타이틀 (sudoku.png 상단 "BRAIN HEALTH: SUDOKU CHALLENGE" 재현) */}
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-6 h-6 text-[#F1948A]" />
                <h2 className="text-xl font-black text-[#2C3E50] tracking-wide">두뇌 건강: 스도쿠</h2>
              </div>

              {/* Level / Timer 바 (sudoku.png 참조) */}
              <div className="w-full flex justify-between items-center px-1 mb-4 text-[#5D6D7E] text-sm font-semibold">
                <span>
                  Level: {difficulty === 'easy' ? '쉬움' : difficulty === 'medium' ? '보통' : '어려움'}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-4 h-4" /> {formatTime(elapsed)}
                </span>
              </div>

              {/* ===== 스도쿠 보드 (sudoku.png 완벽 재현) ===== */}
              <div
                className="w-full rounded-2xl overflow-hidden shadow-lg mb-8"
                style={{ border: '4px solid #7CC5B8', backgroundColor: '#7CC5B8' }}
              >
                {/* 9x9 grid - gap으로 틸 색 격자선 구현 */}
                <div className="w-full aspect-square grid grid-rows-3 gap-[3px] p-[3px]">
                  {[0, 1, 2].map(boxRow => (
                    <div key={boxRow} className="grid grid-cols-3 gap-[3px]">
                      {[0, 1, 2].map(boxCol => {
                        const boxIdx = boxRow * 3 + boxCol;
                        const bgColor = BOX_COLORS[boxIdx];
                        return (
                          <div
                            key={boxCol}
                            className="grid grid-rows-3 grid-cols-3 gap-[1px] rounded-sm overflow-hidden"
                            style={{ backgroundColor: '#B8D8D0' }}
                          >
                            {[0, 1, 2].map(innerRow => 
                              [0, 1, 2].map(innerCol => {
                                const r = boxRow * 3 + innerRow;
                                const c = boxCol * 3 + innerCol;
                                const cell = board[r][c];
                                const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                                const isSameValue = cell !== '' && selectedCell && board[selectedCell.r]?.[selectedCell.c] === cell && !isSelected;
                                const isOriginal = original[r][c];
                                const isError = !isOriginal && cell !== '' && cell !== solution[r][c];

                                // 텍스트 색상 (sudoku.png 참고)
                                let textColor = '#2C3E50'; // 고정 숫자 = 진한 회색
                                if (isSelected) textColor = '#B8860B'; // 선택 시 골드
                                else if (!isOriginal && isError) textColor = '#E74C3C'; // 오류 = 빨강
                                else if (!isOriginal) textColor = '#AF7AC5'; // 사용자 입력 = 연보라

                                // 셀 배경 (sudoku.png 참고: 선택 셀은 밝은 금색)
                                let cellBg = bgColor;
                                if (isSelected) cellBg = '#F5D76E';
                                else if (isSameValue) cellBg = '#FFFACD';

                                return (
                                  <div
                                    key={`${r}-${c}`}
                                    onClick={() => setSelectedCell({ r, c })}
                                    className="flex items-center justify-center cursor-pointer select-none transition-all duration-150"
                                    style={{
                                      backgroundColor: cellBg,
                                      boxShadow: isSelected ? 'inset 0 0 0 2px #DAA520' : 'none',
                                    }}
                                  >
                                    <span
                                      className="text-xl sm:text-2xl font-semibold"
                                      style={{
                                        color: textColor,
                                        fontFamily: "'Georgia', serif",
                                      }}
                                    >
                                      {cell}
                                    </span>
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

              {/* ===== 원형 숫자 키패드 (sudoku.png 하단 참조) ===== */}
              <div className="w-full flex flex-col items-center gap-4 max-w-[340px]">
                {/* 1줄: 1 2 3 4 5 */}
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      onClick={() => handleInput(num)}
                      className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shadow-sm transition-transform active:scale-90 border-2 border-white/80"
                      style={{
                        backgroundColor: PAD_COLORS[num - 1],
                        color: '#2C3E50',
                        fontFamily: "'Georgia', serif",
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                {/* 2줄: 6 7 8 9 + 지우기 */}
                <div className="flex gap-4">
                  {[6, 7, 8, 9].map(num => (
                    <button
                      key={num}
                      onClick={() => handleInput(num)}
                      className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shadow-sm transition-transform active:scale-90 border-2 border-white/80"
                      style={{
                        backgroundColor: PAD_COLORS[num - 1],
                        color: '#2C3E50',
                        fontFamily: "'Georgia', serif",
                      }}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={() => handleInput('')}
                    className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm transition-transform active:scale-90 border-2 border-slate-200"
                  >
                    <Eraser className="w-6 h-6 text-[#7F8C8D]" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========== 완료 모달 ========== */}
      {gameState === 'finished' && (
        <div className="fixed inset-0 bg-[#2C3E50]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-inner"
              style={{ backgroundColor: '#D1ECE2' }}
            >
              <Trophy className="w-12 h-12" style={{ color: '#117864' }} />
            </div>
            <h2 className="text-3xl font-black text-[#2C3E50] mb-2 tracking-tight">퍼즐 완성!</h2>
            <p className="text-[#7F8C8D] mb-8 font-medium">대단해요! 두뇌가 한결 맑아지셨을 거예요.</p>
            <div
              className="w-full rounded-2xl p-5 mb-8 flex justify-around"
              style={{ backgroundColor: '#F9F9F4', border: '2px solid #E5E8E8' }}
            >
              <div className="text-center">
                <p className="text-xs font-bold text-[#AAB7B8] mb-1">난이도</p>
                <p className="text-lg font-black text-[#2C3E50]">{difficulty === 'easy' ? '쉬움' : difficulty === 'medium' ? '보통' : '어려움'}</p>
              </div>
              <div className="w-0.5 rounded-full" style={{ backgroundColor: '#E5E8E8' }}></div>
              <div className="text-center">
                <p className="text-xs font-bold text-[#AAB7B8] mb-1">소요 시간</p>
                <p className="text-lg font-black text-[#2C3E50] font-mono">{formatTime(elapsed)}</p>
              </div>
            </div>
            {isSaving ? (
              <div className="flex items-center justify-center w-full py-4 rounded-full" style={{ backgroundColor: '#F2F4F4', color: '#7F8C8D' }}>
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> 점수 기록 중...
              </div>
            ) : (
              <div className="w-full flex flex-col gap-3">
                <button onClick={() => setGameState('intro')} className="w-full text-white font-black text-lg py-4 rounded-full shadow-md transition-transform active:scale-95" style={{ backgroundColor: '#7CC5B8' }}>
                  한 판 더 하기
                </button>
                <button onClick={() => navigate('/prevention')} className="w-full bg-white text-[#7F8C8D] font-black text-lg py-4 rounded-full transition-transform active:scale-95" style={{ border: '2px solid #E5E8E8' }}>
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
