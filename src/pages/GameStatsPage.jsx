import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, Brain, TrendingDown, Clock, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function GameStatsPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 세션 가져오기
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        setLoading(false);
        setError('로그인이 필요합니다.');
      }
    });
  }, []);

  useEffect(() => {
    if (session) {
      fetchGameStats(session.user.id);
    }
  }, [session]);

  const fetchGameStats = async (userId) => {
    setLoading(true);
    try {
      // 최근 30일 데이터 가져오기
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateString = thirtyDaysAgo.toISOString().split('T')[0];

      const { data, error: fetchError } = await supabase
        .from('game_scores')
        .select('play_date, detail')
        .eq('user_id', userId)
        .eq('game_type', 'puzzle')
        .gte('play_date', dateString)
        .order('play_date', { ascending: true });

      if (fetchError) throw fetchError;

      // JS에서 날짜별 최고기록(최단 시간) 집계
      const dailyBest = {};
      data.forEach(row => {
        const date = row.play_date;
        const duration = row.detail?.duration_sec;
        
        if (duration !== undefined && duration !== null) {
          if (!dailyBest[date] || duration < dailyBest[date]) {
            dailyBest[date] = duration;
          }
        }
      });

      // 차트 데이터 포맷으로 변환
      const formattedData = Object.keys(dailyBest)
        .sort((a, b) => a.localeCompare(b))
        .map(date => {
          // 날짜 포맷 (예: 08-04)
          const [yyyy, mm, dd] = date.split('-');
          return {
            date: `${mm}-${dd}`,
            fullDate: date,
            duration: dailyBest[date]
          };
        });

      setChartData(formattedData);
    } catch (err) {
      console.error(err);
      setError('기록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}분 ${s}초`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100">
          <p className="font-bold text-slate-700 mb-1">{payload[0].payload.fullDate}</p>
          <p className="text-[#66B2B2] font-black">
            <span className="text-sm font-normal text-slate-500 mr-2">최단 기록:</span>
            {formatTime(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#FDFCF4] pb-20 font-sans">
      {/* ── 상단 헤더 ── */}
      <div className="bg-[#D6EAF8] px-4 pt-4 pb-8 shrink-0 relative z-0 rounded-b-[2.5rem] shadow-sm">
        <div className="relative flex items-center justify-between h-8 max-w-4xl mx-auto">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-[#F1948A]" />
              <h2 className="text-xl font-black text-[#2C3E50] tracking-wide">내 게임 통계</h2>
            </div>
          </div>
          <button onClick={() => navigate(-1)}
            className="relative z-10 flex items-center gap-1 text-slate-600 font-bold text-sm hover:bg-white/40 px-3 py-1.5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" /> 뒤로
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4 relative z-10">
        
        {loading ? (
          <div className="bg-white rounded-3xl p-10 shadow-sm text-center flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-8 h-8 border-4 border-[#D6EAF8] border-t-[#66B2B2] rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-bold">기록을 불러오는 중입니다...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-10 shadow-sm text-center flex flex-col items-center justify-center min-h-[300px]">
            <AlertCircle className="w-12 h-12 text-[#F1948A] mb-4" />
            <p className="text-slate-600 font-bold mb-4">{error}</p>
            {!session && (
              <button onClick={() => navigate('/profile')} className="px-6 py-2 bg-[#66B2B2] text-white rounded-full font-bold shadow-md hover:bg-[#539999] transition-colors">
                로그인 페이지로
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* 요약 카드 */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-50 flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-[#E8F8F5] flex items-center justify-center shrink-0">
                <Clock className="w-8 h-8 text-[#1ABC9C]" />
              </div>
              <div>
                <h3 className="text-slate-500 font-bold text-sm mb-1">스도쿠 (퍼즐)</h3>
                <p className="text-slate-800 font-black text-2xl">
                  {chartData.length > 0 ? "꾸준히 시간을 단축하고 계시네요!" : "아직 스도쿠 플레이 기록이 없습니다."}
                </p>
                <p className="text-slate-400 text-xs mt-1">※ 스도쿠는 문제를 푸는 데 걸린 시간(초)이 짧을수록 좋습니다.</p>
              </div>
            </div>

            {/* 차트 영역 */}
            {chartData.length > 0 && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-[#3498DB]" />
                    최근 30일 기록 추이 (소요 시간)
                  </h3>
                </div>
                
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2F4F4" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#95A5A6', fontWeight: 600 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#95A5A6', fontWeight: 600 }}
                        tickFormatter={(val) => `${Math.floor(val/60)}분`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="duration" 
                        stroke="#66B2B2" 
                        strokeWidth={4} 
                        dot={{ r: 5, fill: '#66B2B2', stroke: '#FFF', strokeWidth: 2 }}
                        activeDot={{ r: 7, fill: '#1ABC9C', stroke: '#FFF', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            
            {/* 데이터가 없을 때 안내 */}
            {chartData.length === 0 && (
              <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-50 text-center">
                <p className="text-slate-500 font-medium mb-6">스도쿠 게임을 플레이하고 첫 기록을 남겨보세요!</p>
                <button onClick={() => navigate('/game/sudoku')} className="px-6 py-3 bg-[#D6EAF8] text-[#2980B9] rounded-full font-black hover:bg-[#AED6F1] transition-colors shadow-sm">
                  스도쿠 하러 가기
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
