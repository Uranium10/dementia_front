import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, UserCircle2, Calendar, CheckCircle2 } from 'lucide-react';

// 톤 매핑 정보 (실제 daily_checkins.tone 값 기준 — DailyCheckinCard.jsx와 동일 4개)
// 이전엔 need_attention/need_help/urgent라는, 실제로 저장되지 않는 이름을 써서
// neutral 외의 모든 tone(reassure/observe/suggest_consult)이 매핑 실패로
// 전부 "특별한 이슈 없음"으로 표시되던 버그가 있었다.
const TONE_MAP = {
  reassure: { label: '안심', colors: 'bg-green-100 text-green-700' },
  neutral: { label: '특별한 이슈 없음', colors: 'bg-slate-100 text-slate-600' },
  observe: { label: '관찰 권함', colors: 'bg-amber-100 text-amber-700' },
  suggest_consult: { label: '전문가 상담 권유', colors: 'bg-red-100 text-red-700' },
};

export default function DailyCheckinReportPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState({ displayName: '', avatarUrl: null });
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. 세션 가져오기
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('로그인이 필요합니다.');
      }
      setSession(session);

      // 2. 프로필 아바타 가져오기 (public url)
      const user = session.user;
      let avatarUrl = user.user_metadata?.avatar_url; // 구글 등 OAuth 기본 아바타
      
      // 만약 커스텀 아바타를 업로드했다면 avatars 버킷에서 가장 최신 파일을 조회
      const { data: files } = await supabase.storage.from('avatars').list(user.id, {
        limit: 1,
        sortBy: { column: 'created_at', order: 'desc' }
      });
      if (files && files.length > 0) {
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(`${user.id}/${files[0].name}`);
        avatarUrl = publicUrlData.publicUrl;
      }
      
      const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || '사용자';
      setProfile({ displayName, avatarUrl });

      // 3. 기록 가져오기 (최신순 정렬)
      const { data: checkinData, error: checkinError } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', user.id)
        .order('checkin_date', { ascending: false });

      if (checkinError) throw checkinError;
      setCheckins(checkinData || []);

    } catch (err) {
      console.error(err);
      setError(err.message || '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <div className="max-w-3xl mx-auto px-4 pt-8 space-y-8">
        
        {/* ── 상단 네비게이션 ── */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-slate-100 transition-colors text-slate-600 border border-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">오늘의 대화 보고서</h2>
        </div>

        {loading ? (
          <div className="bg-white rounded-[2rem] p-10 shadow-sm text-center flex flex-col items-center justify-center min-h-[350px] border border-slate-100">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-bold">기록을 불러오는 중입니다...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-[2rem] p-10 shadow-sm text-center flex flex-col items-center justify-center min-h-[350px] border border-slate-100">
            <p className="text-red-500 font-bold mb-4">{error}</p>
            {!session && (
              <button onClick={() => navigate('/profile')} className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold shadow-md hover:bg-blue-700 transition-colors">
                로그인 페이지로
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* ── 프로필 헤더 카드 ── */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex items-center gap-6">
              <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-4 border-blue-50 shadow-sm bg-slate-100 flex items-center justify-center">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle2 className="w-12 h-12 text-slate-400" />
                )}
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 mb-1">
                  {profile.displayName}님의<br />오늘의 대화 기록
                </h3>
                <p className="text-sm font-bold text-slate-400 flex items-center gap-1.5 mt-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  총 {checkins.length}일의 기록이 모였습니다
                </p>
              </div>
            </div>

            {/* ── 타임라인 리스트 ── */}
            <div className="space-y-4">
              {checkins.length > 0 ? (
                checkins.map((checkin) => {
                  const toneInfo = TONE_MAP[checkin.tone] || TONE_MAP['neutral'];
                  return (
                    <div key={checkin.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-slate-400" />
                          <span className="font-extrabold text-slate-700 text-lg">
                            {checkin.checkin_date}
                          </span>
                        </div>
                        <span className={`inline-flex px-2.5 py-1 rounded-md font-bold text-xs ${toneInfo.colors} w-fit`}>
                          {toneInfo.label}
                        </span>
                      </div>
                      
                      <div className="bg-slate-50 rounded-2xl p-4 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {checkin.summary}
                      </div>

                      {checkin.concern_note && (
                        <div className="mt-3 bg-amber-50/50 border border-amber-100/50 rounded-2xl p-4 text-sm text-amber-800 font-medium leading-relaxed">
                          <span className="font-bold mr-1">⚠️ 주의사항:</span>
                          {checkin.concern_note}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-slate-100">
                  <p className="text-slate-500 font-bold">아직 오늘의 대화 기록이 없습니다.</p>
                  <p className="text-sm text-slate-400 mt-2">메인 페이지에서 하루에 한 번 대화를 시작해 보세요!</p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
