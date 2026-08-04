import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import {
  ArrowLeft, Brain, TrendingDown, Clock, AlertCircle,
  Puzzle, Zap, Grid, Play, BookOpen, Trophy, Calendar
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const ICON_MAP = {
  Puzzle: Puzzle,
  Zap: Zap,
  Grid: Grid,
  Play: Play,
  BookOpen: BookOpen
};

const GAME_TYPES = [
  { 
    id: 'puzzle', 
    name: '스도쿠', 
    icon: 'Puzzle', 
    desc: '논리력과 집중력을 키우는 스도쿠 퍼즐', 
    type: 'time', 
    themeColor: '#3b82f6', 
    path: '/game/sudoku',
    unit: '초'
  },
  { 
    id: 'color_match', 
    name: '색깔 맞추기', 
    icon: 'Zap', 
    desc: '주의 억제력을 기르는 스트룹 색상 매칭 게임', 
    type: 'score', 
    themeColor: '#eab308', 
    path: '/game/color-match',
    unit: '점'
  },
];

export default function GameStatsPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [selectedGame, setSelectedGame] = useState('puzzle');
  const [allScores, setAllScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 세션 가져오기
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError || !session) {
        setError('로그인이 필요합니다.');
        setLoading(false);
      } else {
        setSession(session);
        fetchAllGameStats(session.user.id);
      }
    });
  }, []);

  const fetchAllGameStats = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      // 최근 30일 범위 날짜 계산
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateString = thirtyDaysAgo.toISOString().split('T')[0];

      // 한 번의 쿼리로 해당 유저의 30일간의 전체 게임 데이터 페칭
      const { data, error: fetchError } = await supabase
        .from('game_scores')
        .select('play_date, game_type, score, detail')
        .eq('user_id', userId)
        .gte('play_date', dateString)
        .order('play_date', { ascending: true });

      if (fetchError) throw fetchError;
      setAllScores(data || []);
    } catch (err) {
      console.error(err);
      setError('기록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const currentGame = useMemo(() => {
    return GAME_TYPES.find(g => g.id === selectedGame) || GAME_TYPES[0];
  }, [selectedGame]);

  // 현재 선택된 게임에 해당하는 데이터 필터링
  const filteredScores = useMemo(() => {
    return allScores.filter(score => score.game_type === selectedGame);
  }, [allScores, selectedGame]);

  // 주요 통계 요약 (총 플레이 횟수, 최고 기록)
  const statsSummary = useMemo(() => {
    const totalPlayCount = filteredScores.length;
    if (totalPlayCount === 0) {
      return { totalPlayCount, bestRecord: null };
    }

    const isTimeType = currentGame.type === 'time';

    if (isTimeType) {
      // 스도쿠의 경우 소요 시간 중 최소값(최단 완료 시간) 찾기
      let minDuration = Infinity;
      filteredScores.forEach(row => {
        const d = row.detail?.duration_sec;
        if (d !== undefined && d !== null) {
          if (d < minDuration) minDuration = d;
        }
      });
      return {
        totalPlayCount,
        bestRecord: minDuration === Infinity ? null : minDuration
      };
    } else {
      // 점수 기반 게임의 경우 최고 점수(최대값) 찾기
      let maxScore = -Infinity;
      filteredScores.forEach(row => {
        if (row.score !== undefined && row.score !== null) {
          if (row.score > maxScore) maxScore = row.score;
        }
      });
      return {
        totalPlayCount,
        bestRecord: maxScore === -Infinity ? null : maxScore
      };
    }
  }, [filteredScores, currentGame]);

  // 차트 렌더링에 적합한 데이터 포맷 가공 (하루에 여러번 했을 때의 대표값 적용)
  const chartData = useMemo(() => {
    const dailyBest = {};
    const isTimeType = currentGame.type === 'time';

    filteredScores.forEach(row => {
      const date = row.play_date;
      if (isTimeType) {
        const duration = row.detail?.duration_sec;
        if (duration !== undefined && duration !== null) {
          if (!dailyBest[date] || duration < dailyBest[date]) {
            dailyBest[date] = duration;
          }
        }
      } else {
        const score = row.score;
        if (score !== undefined && score !== null) {
          if (!dailyBest[date] || score > dailyBest[date]) {
            dailyBest[date] = score;
          }
        }
      }
    });

    return Object.keys(dailyBest)
      .sort((a, b) => a.localeCompare(b))
      .map(date => {
        const [yyyy, mm, dd] = date.split('-');
        return {
          date: `${mm}-${dd}`,
          fullDate: date,
          value: dailyBest[date]
        };
      });
  }, [filteredScores, currentGame]);

  // 표시용 포맷팅 함수들
  const formatValue = (val) => {
    if (val === null || val === undefined) return '-';
    if (currentGame.type === 'time') {
      const m = Math.floor(val / 60);
      const s = val % 60;
      return m > 0 ? `${m}분 ${s}초` : `${s}초`;
    }
    return `${val}${currentGame.unit}`;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100">
          <p className="text-xs text-slate-400 font-bold mb-1.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {dataPoint.fullDate}
          </p>
          <p className="font-black text-base" style={{ color: currentGame.themeColor }}>
            <span className="text-xs font-bold text-slate-500 mr-2">최고 기록:</span>
            {formatValue(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <div className="max-w-4xl mx-auto px-4 pt-8 space-y-6">
        
        {/* ── 상단 헤더 ── */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-slate-100 transition-colors text-slate-600 border border-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-xl shadow-sm">
              <Brain className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">내 두뇌 게임 통계</h2>
          </div>
        </div>

        {/* ── 게임 종류 선택 슬라이드 칩 ── */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {GAME_TYPES.map(game => {
            const Icon = ICON_MAP[game.icon] || Brain;
            const isSelected = selectedGame === game.id;
            return (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-extrabold whitespace-nowrap transition-all shadow-sm active:scale-95 ${
                  isSelected 
                    ? 'text-white' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
                style={isSelected ? { backgroundColor: game.themeColor, boxShadow: `0 8px 16px -4px ${game.themeColor}40` } : {}}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'animate-pulse' : 'text-slate-400'}`} />
                {game.name}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="bg-white rounded-[2rem] p-10 shadow-sm text-center flex flex-col items-center justify-center min-h-[350px] border border-slate-100">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-bold">기록을 집계하는 중입니다...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-[2rem] p-10 shadow-sm text-center flex flex-col items-center justify-center min-h-[350px] border border-slate-100">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-slate-600 font-bold mb-4">{error}</p>
            {!session && (
              <button onClick={() => navigate('/profile')} className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold shadow-md hover:bg-blue-700 transition-colors">
                로그인 페이지로
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* ── 요약 대시보드 카드 ── */}
            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all hover:shadow-md">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" 
                  style={{ backgroundColor: `${currentGame.themeColor}10` }}>
                  {React.createElement(ICON_MAP[currentGame.icon] || Brain, { 
                    className: "w-8 h-8", 
                    style: { color: currentGame.themeColor } 
                  })}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">GAME TYPE</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold text-white" style={{ backgroundColor: currentGame.themeColor }}>
                      {currentGame.type === 'time' ? '타임어택' : '점수형'}
                    </span>
                  </div>
                  <h3 className="text-slate-800 font-black text-xl tracking-tight">{currentGame.name}</h3>
                  <p className="text-slate-400 text-xs mt-1.5 font-medium">{currentGame.desc}</p>
                </div>
              </div>

              <div className="flex gap-8 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-8 shrink-0 w-full sm:w-auto">
                <div className="flex-1 sm:flex-initial">
                  <span className="text-xs text-slate-400 font-bold block mb-1">플레이 횟수</span>
                  <p className="text-2xl font-black text-slate-800 tabular-nums">
                    {statsSummary.totalPlayCount} <span className="text-xs font-bold text-slate-400">회</span>
                  </p>
                </div>
                <div className="flex-1 sm:flex-initial">
                  <span className="text-xs text-slate-400 font-bold block mb-1">개인 최고 기록</span>
                  <p className="text-2xl font-black tabular-nums" style={{ color: currentGame.themeColor }}>
                    {statsSummary.bestRecord !== null ? formatValue(statsSummary.bestRecord) : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* ── 차트 영역 ── */}
            {chartData.length > 0 ? (
              <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100 transition-all hover:shadow-md">
                <h3 className="font-extrabold text-base text-slate-700 flex items-center gap-2 mb-6">
                  <TrendingDown className="w-5 h-5" style={{ color: currentGame.themeColor }} />
                  최근 30일 기록 추이 ({currentGame.type === 'time' ? '소요 시간' : '점수'})
                </h3>
                
                <div className="w-full h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`gradient-${currentGame.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={currentGame.themeColor} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={currentGame.themeColor} stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }}
                        tickFormatter={(val) => {
                          if (currentGame.type === 'time') return `${Math.floor(val/60)}분`;
                          return val;
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={currentGame.themeColor} 
                        strokeWidth={3.5} 
                        fillOpacity={1} 
                        fill={`url(#gradient-${currentGame.id})`}
                        dot={{ r: 4, fill: currentGame.themeColor, stroke: '#FFF', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: currentGame.themeColor, stroke: '#FFF', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {currentGame.type === 'time' && (
                  <p className="text-slate-400 text-[11px] font-medium mt-4 text-center">
                    ※ 소요 시간이 짧을수록(그래프가 하향할수록) 두뇌 훈련 속도가 빨라진 것을 의미합니다.
                  </p>
                )}
              </div>
            ) : (
              /* ── 기록이 없을 때 안내 (플레이 유도) ── */
              <div className="bg-white rounded-[2rem] p-10 md:p-12 shadow-sm border border-slate-100 text-center flex flex-col items-center justify-center space-y-5">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center shadow-inner">
                  <Trophy className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-extrabold text-slate-800 text-lg">아직 기록이 존재하지 않습니다</h4>
                  <p className="text-slate-400 text-sm max-w-sm font-medium leading-relaxed">
                    {currentGame.name}을 플레이하여 두뇌 운동도 하고 기록도 차트로 관리해 보세요!
                  </p>
                </div>
                {currentGame.path ? (
                  <button 
                    onClick={() => navigate(currentGame.path)} 
                    className="px-8 py-3.5 text-white font-extrabold rounded-full transition-all active:scale-95 shadow-md shadow-blue-100 hover:brightness-105"
                    style={{ backgroundColor: currentGame.themeColor, boxShadow: `0 6px 20px -4px ${currentGame.themeColor}50` }}
                  >
                    {currentGame.name} 플레이하러 가기
                  </button>
                ) : (
                  <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-150 text-xs font-bold text-slate-500">
                    💡 이 게임은 곧 출시될 예정입니다. 준비 중이니 기대해주세요!
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

