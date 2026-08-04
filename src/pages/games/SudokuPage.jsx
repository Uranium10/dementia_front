import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSudoku } from 'sudoku-gen';
import {
  ArrowLeft, Clock, Trophy, Loader2, RefreshCw,
  Eraser, Brain, Lightbulb, PenLine, AlertTriangle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function SudokuPage() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('intro');
  const [board, setBoard] = useState(null);
  const [original, setOriginal] = useState(null);
  const [solution, setSolution] = useState(null);
  const [notesBoard, setNotesBoard] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [elapsed, setElapsed] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isNotesMode, setIsNotesMode] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [mistakes, setMistakes] = useState(0);
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
    setSelectedCell(null); setElapsed(0);
    setHintsUsed(0); setMistakes(0);
    setGameState('playing');
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
      const newBoard = board.map(row => [...row]);
      newBoard[r][c] = '';
      setBoard(newBoard);
      const newNotes = notesBoard.map(row => [...row]);
      newNotes[r][c] = [];
      setNotesBoard(newNotes);
      return;
    }

    const strVal = val.toString();

    if (isNotesMode) {
      const newNotes = notesBoard.map(row => [...row]);
      const cur = newNotes[r][c];
      newNotes[r][c] = cur.includes(strVal) ? cur.filter(n => n !== strVal) : [...cur, strVal].sort();
      setNotesBoard(newNotes);
      if (board[r][c] !== '') {
        const nb = board.map(row => [...row]);
        nb[r][c] = '';
        setBoard(nb);
      }
    } else {
      const newBoard = board.map(row => [...row]);
      newBoard[r][c] = strVal;
      setBoard(newBoard);

      // 숫자가 배치되면 해당 행, 열, 3x3 박스에 있는 동일한 노트 숫자 제거
      const newNotes = notesBoard.map(row => [...row]);
      for (let i = 0; i < 9; i++) {
        newNotes[r][i] = newNotes[r][i].filter(n => n !== strVal);
        newNotes[i][c] = newNotes[i][c].filter(n => n !== strVal);
      }
      const startR = Math.floor(r / 3) * 3;
      const startC = Math.floor(c / 3) * 3;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          newNotes[startR + i][startC + j] = newNotes[startR + i][startC + j].filter(n => n !== strVal);
        }
      }
      newNotes[r][c] = []; // 해당 칸의 노트 전체 초기화
      setNotesBoard(newNotes);

      if (strVal !== solution[r][c]) {
        const nm = mistakes + 1;
        setMistakes(nm);
        if (nm >= 4) {
          if (timerRef.current) clearInterval(timerRef.current);
          setGameState('gameover');
        }
      } else {
        checkWin(newBoard);
      }
    }
  };

  const handleHint = () => {
    if (gameState !== 'playing' || !selectedCell || hintsUsed >= 4) return;
    const { r, c } = selectedCell;
    if (original[r][c] || board[r][c] === solution[r][c]) return;
    setHintsUsed(prev => prev + 1);
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = solution[r][c];
    setBoard(newBoard);
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
        const scoreValue = difficulty === 'easy' ? 100 : difficulty === 'medium' ? 200 : 300;
        await supabase.from('game_scores').insert({
          user_id: user.id, game_type: 'puzzle', score: scoreValue,
          detail: { duration_sec: elapsed, difficulty, completed: true }
        });
      }
    } catch (err) { console.error(err); }
    finally { setIsSaving(false); }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (gameState !== 'playing' || !selectedCell) return;
      if (e.key >= '1' && e.key <= '9') handleInput(e.key);
      else if (e.key === 'Backspace' || e.key === 'Delete') handleInput('');
      else if (e.key === 'ArrowUp') setSelectedCell(p => p.r > 0 ? { r: p.r - 1, c: p.c } : p);
      else if (e.key === 'ArrowDown') setSelectedCell(p => p.r < 8 ? { r: p.r + 1, c: p.c } : p);
      else if (e.key === 'ArrowLeft') setSelectedCell(p => p.c > 0 ? { r: p.r, c: p.c - 1 } : p);
      else if (e.key === 'ArrowRight') setSelectedCell(p => p.c < 8 ? { r: p.r, c: p.c + 1 } : p);
      else if (e.key.toLowerCase() === 'n') setIsNotesMode(prev => !prev);
      else if (e.key.toLowerCase() === 'h') handleHint();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState, selectedCell, board, isNotesMode, notesBoard, mistakes, hintsUsed]);

  const formatTime = (sec) => `${Math.floor(sec/60).toString().padStart(2,'0')}:${(sec%60).toString().padStart(2,'0')}`;

  const getCompletedCounts = () => {
    const c = {};
    for (let i = 1; i <= 9; i++) c[i.toString()] = 0;
    if (!board || !solution) return c;
    for (let r = 0; r < 9; r++)
      for (let col = 0; col < 9; col++)
        if (board[r][col] !== '' && board[r][col] === solution[r][col])
          c[board[r][col]]++;
    return c;
  };
  const completedCounts = getCompletedCounts();

  const BOX_COLORS = {
    0: '#F5EEDD', 1: '#F8D7DA', 2: '#D6E4F0',
    3: '#D6E4F0', 4: '#F8D7DA', 5: '#D1ECE2',
    6: '#C5E4DA', 7: '#FADCC8', 8: '#FADCC8',
  };
  const PAD_COLORS = ['#F5B7B1','#F5CBA7','#FDF2B3','#A3E4D7','#AED6F1','#FADBD8','#ABEBC6','#A9CCE3','#F1948A'];

  return (
    <div
      className="h-[100dvh] flex flex-col items-center justify-center overflow-hidden relative p-3 sm:p-4"
      style={{ backgroundColor: '#EFF6F5', fontFamily: "'Nunito', sans-serif" }}
    >
      {/* 배경 이미지 */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{ backgroundImage: 'url(/assets/games/sudoku_bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      />

      {/* 스마트폰 프레임 — 하나의 라운드 보더 박스 (overflow: hidden, 그림자, 테두리) */}
      <div
        className="relative z-10 w-full max-w-[440px] h-full max-h-[820px] rounded-[2rem] sm:rounded-[2.5rem] flex flex-col overflow-hidden bg-[#FDFCF4] border-[6px] sm:border-[8px] border-[#AED6F1]"
        style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 8px rgba(255,255,255,0.7)' }}
      >
        {/* ── 상단 헤더 (타이틀 한 줄 배치 및 z-index 아래로) ── */}
        <div className="bg-[#D6EAF8] px-4 pt-3 pb-6 shrink-0 z-0 relative">
          <div className="relative flex items-center justify-between h-8">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#F1948A]" />
                <h2 className="text-lg font-black text-[#2C3E50] tracking-wide uppercase">스도쿠</h2>
              </div>
            </div>
            <button onClick={() => {
                if (gameState === 'intro') navigate('/prevention');
                else setGameState('intro');
              }}
              className="relative z-10 flex items-center gap-1 text-slate-500 font-bold text-sm hover:bg-white/40 px-2 py-1 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" /> 이전
            </button>
            {gameState === 'playing' ? (
              <button onClick={() => setGameState('intro')}
                className="relative z-10 text-[#66B2B2] font-bold flex items-center gap-1 text-sm bg-white/50 px-3 py-1.5 rounded-full hover:bg-white/80 transition-colors">
                <RefreshCw className="w-4 h-4" /> 리셋
              </button>
            ) : (
              <div className="w-16"></div>
            )}
          </div>
        </div>

        {/* ── 메인 콘텐츠 랩핑 (그림자 제거, 라운드 약간 줄임) ── */}
        <div className="flex-1 flex flex-col bg-[#FDFCF4] rounded-t-[0.8rem] relative z-10 -mt-4 overflow-hidden">
        {/* ── 인트로 화면 ── */}
        {gameState === 'intro' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
            <div className="w-44 h-44 mb-6 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white bg-white">
              <img src="/assets/games/sudoku.png" alt="스도쿠" className="w-full h-full object-cover" />
            </div>
            <p className="text-[#7F8C8D] text-base mb-8 text-center font-bold leading-relaxed">
              논리력 향상을 위한 두뇌 훈련 게임입니다.<br />원하시는 난이도를 선택해 시작하세요.
            </p>
            <div className="flex flex-col gap-4 w-full">
              <button onClick={() => initGame('easy')} className="w-full py-5 rounded-full text-xl font-black shadow-sm border-2 border-white active:scale-95 transition-transform" style={{ backgroundColor: '#D1ECE2', color: '#117864' }}>쉬움 (Easy)</button>
              <button onClick={() => initGame('medium')} className="w-full py-5 rounded-full text-xl font-black shadow-sm border-2 border-white active:scale-95 transition-transform" style={{ backgroundColor: '#FADCC8', color: '#D35400' }}>보통 (Medium)</button>
              <button onClick={() => initGame('hard')} className="w-full py-5 rounded-full text-xl font-black shadow-sm border-2 border-white active:scale-95 transition-transform" style={{ backgroundColor: '#F8D7DA', color: '#900C3F' }}>어려움 (Hard)</button>
            </div>
          </div>
        )}

        {/* ── 게임 플레이 화면 ── */}
        {gameState === 'playing' && (
          <div className="flex-1 flex flex-col items-center min-h-0 px-3 pt-2 pb-2">

            {/* 상태 바 (Level, 시간, 실수 한 줄로) */}
            <div className="w-full flex items-center justify-between mb-2 px-1 shrink-0">
              <span className="text-sm font-bold text-[#5D6D7E]">
                {difficulty === 'easy' ? '쉬움' : difficulty === 'medium' ? '보통' : '어려움'}
              </span>
              <span className="text-sm font-bold text-[#E74C3C]">실수 {mistakes}/4</span>
              <span className="flex items-center gap-1 font-mono text-sm font-bold bg-white px-3 py-1 rounded-full shadow-sm text-[#5D6D7E]">
                <Clock className="w-3.5 h-3.5 text-[#F1948A]" /> {formatTime(elapsed)}
              </span>
            </div>

            {/* 스도쿠 보드 — flex-1로 남은 공간 최대 활용 */}
            <div className="w-full flex-1 min-h-0 mb-2">
              <div
                className="w-full h-full rounded-[1.2rem] overflow-hidden"
                style={{ border: '3px solid #7CC5B8', backgroundColor: '#7CC5B8' }}
              >
                <div className="w-full h-full grid grid-rows-3 gap-[3px] p-[2px]">
                  {[0, 1, 2].map(boxRow => (
                    <div key={boxRow} className="grid grid-cols-3 gap-[3px] min-h-0">
                      {[0, 1, 2].map(boxCol => {
                        const boxIdx = boxRow * 3 + boxCol;
                        return (
                          <div key={boxCol} className="grid grid-rows-3 grid-cols-3 gap-[1px] rounded-sm overflow-hidden"
                            style={{ backgroundColor: '#B8D8D0' }}>
                            {[0,1,2].map(ir => [0,1,2].map(ic => {
                              const r = boxRow*3+ir, c = boxCol*3+ic;
                              const cell = board[r][c];
                              const notes = notesBoard[r][c];
                              const isSel = selectedCell?.r === r && selectedCell?.c === c;
                              const isSameVal = cell !== '' && selectedCell && board[selectedCell.r]?.[selectedCell.c] === cell && !isSel;
                              const isOrig = original[r][c];
                              const isErr = !isOrig && cell !== '' && cell !== solution[r][c];

                              let textColor = '#2C3E50';
                              if (isSel) textColor = '#B8860B';
                              else if (isErr) textColor = '#E74C3C';
                              else if (!isOrig && cell !== '') textColor = '#AF7AC5';

                              let cellBg = BOX_COLORS[boxIdx];
                              if (isSel) cellBg = '#F5D76E';
                              else if (isSameVal) cellBg = '#FFFACD';

                              return (
                                <div key={`${r}-${c}`} onClick={() => setSelectedCell({r, c})}
                                  className="flex items-center justify-center cursor-pointer select-none transition-colors duration-100 relative"
                                  style={{ backgroundColor: cellBg, boxShadow: isSel ? 'inset 0 0 0 2px #DAA520' : 'none' }}>
                                  {cell !== '' ? (
                                    <span className="text-xl sm:text-2xl font-black leading-none"
                                      style={{ color: textColor }}>
                                      {cell}
                                    </span>
                                  ) : notes.length > 0 ? (
                                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-0.5">
                                      {[1,2,3,4,5,6,7,8,9].map(n => (
                                        <div key={n} className="flex items-center justify-center">
                                          {notes.includes(n.toString()) && (
                                            <span className="text-[9px] sm:text-[11px] font-bold text-[#7F8C8D] leading-none">{n}</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            }))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 숫자 키패드 */}
            <div className="w-full shrink-0 mb-2">
              <div className="flex justify-between mb-2 px-1">
                {[1,2,3,4,5].map(num => (
                  <button key={num} onClick={() => handleInput(num)}
                    disabled={completedCounts[num.toString()] === 9}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-black text-xl sm:text-2xl shadow-sm transition-all border-2 border-white/80 ${completedCounts[num.toString()] === 9 ? 'opacity-30 cursor-not-allowed' : 'active:scale-90'}`}
                    style={{ backgroundColor: PAD_COLORS[num-1], color: '#2C3E50' }}>
                    {num}
                  </button>
                ))}
              </div>
              <div className="flex justify-center gap-4 px-6">
                {[6,7,8,9].map(num => (
                  <button key={num} onClick={() => handleInput(num)}
                    disabled={completedCounts[num.toString()] === 9}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-black text-xl sm:text-2xl shadow-sm transition-all border-2 border-white/80 ${completedCounts[num.toString()] === 9 ? 'opacity-30 cursor-not-allowed' : 'active:scale-90'}`}
                    style={{ backgroundColor: PAD_COLORS[num-1], color: '#2C3E50' }}>
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* 컨트롤 버튼 (힌트 / 지우기 / 노트) */}
            <div className="flex justify-center gap-8 w-full shrink-0">
              <button onClick={handleHint} disabled={hintsUsed >= 4}
                className={`flex flex-col items-center gap-0.5 group ${hintsUsed >= 4 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-200 active:scale-90 transition-transform group-hover:bg-[#FFFACD] relative">
                  <Lightbulb className="w-5 h-5 text-[#F39C12]" />
                  <div className="absolute -top-1.5 -right-1.5 bg-[#E74C3C] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border border-white">
                    {4 - hintsUsed}
                  </div>
                </div>
                <span className="text-xs font-bold text-[#7F8C8D]">힌트</span>
              </button>

              <button onClick={() => handleInput('')} className="flex flex-col items-center gap-0.5 group">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-200 active:scale-90 transition-transform group-hover:bg-slate-50">
                  <Eraser className="w-5 h-5 text-[#34495E]" />
                </div>
                <span className="text-xs font-bold text-[#7F8C8D]">지우기</span>
              </button>

              <button onClick={() => setIsNotesMode(!isNotesMode)} className="flex flex-col items-center gap-0.5 group">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm border active:scale-90 transition-transform ${isNotesMode ? 'bg-[#34495E] border-[#2C3E50]' : 'bg-white border-slate-200 group-hover:bg-slate-50'}`}>
                  <PenLine className={`w-5 h-5 ${isNotesMode ? 'text-white' : 'text-[#34495E]'}`} />
                </div>
                <span className={`text-xs font-bold ${isNotesMode ? 'text-[#34495E]' : 'text-[#7F8C8D]'}`}>
                  노트 {isNotesMode ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

          </div>
        )}
        </div>
      </div>

      {/* ── 게임 오버 모달 ── */}
      {gameState === 'gameover' && (
        <div className="fixed inset-0 bg-[#2C3E50]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-[1.5rem] bg-[#FADBD8] flex items-center justify-center mb-5 shadow-inner">
              <AlertTriangle className="w-10 h-10 text-[#E74C3C]" />
            </div>
            <h2 className="text-3xl font-black text-[#2C3E50] mb-2">Game Over</h2>
            <p className="text-[#7F8C8D] mb-8 font-bold text-base">실수를 4번 하셨습니다.<br/>다시 도전해볼까요?</p>
            <div className="w-full flex flex-col gap-3">
              <button onClick={() => setGameState('intro')} className="w-full text-white font-black text-xl py-4 rounded-full bg-[#E74C3C] hover:bg-[#C0392B] shadow-md active:scale-95 transition-all">다시 시작</button>
              <button onClick={() => navigate('/game-stats')} className="w-full bg-slate-100 text-[#34495E] font-black text-xl py-4 rounded-full border-2 border-slate-200 active:scale-95 transition-all hover:bg-slate-200">통계 확인하기</button>
              <button onClick={() => navigate('/prevention')} className="w-full bg-white text-[#7F8C8D] font-black text-xl py-4 rounded-full border-2 border-[#E5E8E8] active:scale-95 transition-all">목록으로</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 클리어 모달 ── */}
      {gameState === 'finished' && (
        <div className="fixed inset-0 bg-[#2C3E50]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-[1.5rem] bg-[#D1ECE2] flex items-center justify-center mb-5 shadow-inner rotate-12">
              <Trophy className="w-10 h-10 text-[#117864] -rotate-12" />
            </div>
            <h2 className="text-3xl font-black text-[#2C3E50] mb-2">Clear!</h2>
            <p className="text-[#7F8C8D] mb-6 font-bold">훌륭합니다! 퍼즐을 완성하셨네요.</p>
            <div className="w-full bg-[#FDFCF4] border-2 border-[#E5E8E8] rounded-2xl p-4 mb-6 flex justify-around">
              <div className="text-center">
                <p className="text-xs font-bold text-[#AAB7B8] mb-1">난이도</p>
                <p className="text-lg font-black text-[#2C3E50]">{difficulty === 'easy' ? '쉬움' : difficulty === 'medium' ? '보통' : '어려움'}</p>
              </div>
              <div className="w-0.5 bg-[#E5E8E8]" />
              <div className="text-center">
                <p className="text-xs font-bold text-[#AAB7B8] mb-1">소요 시간</p>
                <p className="text-lg font-black text-[#2C3E50] font-mono">{formatTime(elapsed)}</p>
              </div>
            </div>
            {isSaving ? (
              <div className="flex items-center justify-center w-full py-4 rounded-full bg-[#F2F4F4] text-[#7F8C8D] font-bold">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> 기록 저장 중...
              </div>
            ) : (
              <div className="w-full flex flex-col gap-3">
                <button onClick={() => setGameState('intro')} className="w-full text-white font-black text-xl py-4 rounded-full bg-[#66B2B2] hover:bg-[#529595] shadow-md active:scale-95 transition-all">한 판 더</button>
                <button onClick={() => navigate('/game-stats')} className="w-full bg-slate-100 text-[#34495E] font-black text-xl py-4 rounded-full border-2 border-slate-200 active:scale-95 transition-all hover:bg-slate-200">통계 확인하기</button>
                <button onClick={() => navigate('/prevention')} className="w-full bg-white text-[#7F8C8D] font-black text-xl py-4 rounded-full border-2 border-[#E5E8E8] active:scale-95 transition-all">목록으로</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
