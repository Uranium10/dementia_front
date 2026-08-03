import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Brain, HeartPulse, Activity, Lock, ArrowRight, ShieldCheck, FileText, Stethoscope, ClipboardList } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import LoginModal from '../components/LoginModal';

/**
 * LandingPage 컴포넌트
 * - 사용자가 가장 처음 만나게 되는 메인 화면입니다.
 * - '치매 진단'과 '예방 가이드' 두 가지 핵심 기능 중 하나를 선택할 수 있는 대형 Split(분할) 레이아웃을 제공합니다.
 */
export default function LandingPage() {
  const navigate = useNavigate();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsLoginModalOpen(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleConsultClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      navigate('/prompt');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-200">
      {/* 2. 메인 콘텐츠 영역 (Hero 텍스트 + 선택 레이아웃) */}
      <main className="flex-1 flex flex-col w-full pb-20" id="hero">
        {/* 서비스 핵심 문구를 보여주는 Hero 섹션 */}
        <div className="py-20 text-center px-4 max-w-3xl mx-auto relative z-40">
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold mb-6">
            <Activity className="w-3.5 h-3.5" />
            <span>치매 의심 환자 보호자를 위한 맞춤형 상담</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight">
            불안한 마음을 덜어드리는<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">따뜻한 AI 치매 가이드</span>
          </h2>
          <p className="mt-8 text-slate-500 text-lg leading-relaxed font-medium">
            치매안심센터, 국가 정책, 간이 자가진단까지.<br />
            어르신의 상태에 맞춘 적절한 대처 방안과 예방 수칙을 안내해 드립니다.
          </p>
        </div>

        {/* 3. 진단 / 예방 분할 선택 레이아웃 (Diagonal Split) */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex w-full h-[650px] rounded-[2.5rem] overflow-hidden shadow-2xl relative bg-white border border-slate-200">
            {/* --- 왼쪽 패널: 치매 진단 및 상담 (Active) --- */}
            <div
              onClick={handleConsultClick}
              className="relative flex-1 min-w-0 bg-gradient-to-br from-blue-600 to-indigo-700 slant-left hover:flex-[1.2] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group cursor-pointer z-10 shadow-[8px_0_20px_rgba(0,0,0,0.15)]"
            >
              {/* 패널 내부 컨텐츠 정렬을 위한 래퍼 (사선 영역을 제외한 곳의 완벽한 중앙 정렬을 위해 padding 조절) */}
              <div className="w-full h-full flex flex-col items-center justify-center pl-[34px] pr-[65px] sm:pr-[140px] pt-24 pb-6 transition-transform duration-700 group-hover:scale-[1.02] group-hover:-translate-y-2">

                {/* 
                  [미감 개선] 깨진 이미지 대신 CSS Glassmorphism과 아이콘을 활용한 커스텀 그래픽 
                  - backdrop-blur: 반투명 유리 효과
                  - bg-white/10: 흰색 바탕에 10% 투명도 부여 
                */}
                <div className="relative bg-white/10 backdrop-blur-md p-10 rounded-full border border-white/20 mb-10 shadow-2xl transition-transform duration-700 group-hover:scale-105 group-hover:rotate-3 flex items-center justify-center w-48 h-48">
                  {/* 빛 번짐(Glow) 효과를 위한 백그라운드 원형 블러 */}
                  <div className="absolute inset-0 bg-blue-400 opacity-20 blur-2xl rounded-full"></div>
                  {/* 메인 아이콘 */}
                  <Stethoscope className="w-24 h-24 text-white drop-shadow-xl relative z-10" />
                  <ClipboardList className="w-12 h-12 text-blue-200 absolute bottom-6 right-6 drop-shadow-lg opacity-80" />
                </div>

                <h3 className="text-4xl font-extrabold text-white tracking-tight text-center whitespace-nowrap">
                  치매 상담 및 안내
                </h3>
                {/* 세부 설명은 항상 보이되, 호버 전에는 맞닿는 오른쪽 경계면만 블러 처리됩니다. */}
                <div className="w-full mt-6 overflow-hidden [mask-image:linear-gradient(to_right,black_85%,transparent)] group-hover:[mask-image:none] transition-all">
                  <p className="text-blue-100 font-medium text-center text-lg whitespace-nowrap opacity-80 leading-relaxed transition-opacity duration-500 group-hover:opacity-100">
                    AI 챗봇을 통한 간이 자가진단 및 거주 지역의<br /> 치매안심센터 서비스망을 확인하세요.
                  </p>
                </div>

                {/* 호버 시(마우스를 올렸을 때) 아래에서 부드럽게 나타나는 액션 버튼 */}
                <div className="mt-10 flex items-center gap-2 text-blue-700 font-bold bg-white px-8 py-3.5 rounded-full opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100 shadow-xl hover:bg-blue-50">
                  진단 시작하기 <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* --- 오른쪽 패널: 예방 가이드 --- */}
            {/* -ml-[150px]: 왼쪽의 사선 모양(slant-left)에 맞물리도록 왼쪽 마진을 당겨 빈틈을 없앱니다. */}
            <div 
              onClick={() => navigate('/prevention')}
              className="relative flex-1 min-w-0 bg-slate-50 slant-right transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] -ml-[150px] z-0 group hover:bg-slate-100 hover:flex-[1.2] cursor-pointer"
            >

              {/* 시각적 오프셋(-ml-150px)을 상쇄하기 위해 내용물을 오른쪽(pl-150px)으로 밀어 완벽한 대칭 중앙을 맞춥니다. */}
              <div className="w-full h-full flex flex-col items-center justify-center pr-[34px] pl-[65px] sm:pl-[140px] pt-24 pb-6 transition-transform duration-700 group-hover:scale-[0.98]">

                {/* 미감 개선: 오른쪽 역시 SVG 아이콘 기반의 모던한 컴포지션으로 대체 */}
                <div className="relative bg-white p-10 rounded-full border border-slate-200 mb-10 shadow-md flex items-center justify-center w-48 h-48 group-hover:shadow-lg transition-shadow">
                  <Brain className="w-24 h-24 text-blue-400 drop-shadow-sm relative z-10 transition-colors group-hover:text-blue-500" />
                  <HeartPulse className="w-12 h-12 text-pink-300 absolute top-8 right-8 transition-colors group-hover:text-pink-400" />
                </div>

                <h3 className="text-4xl font-extrabold text-slate-700 tracking-tight text-center transition-colors group-hover:text-slate-800">
                  인지 능력 예방 가이드
                </h3>
                {/* 세부 설명은 항상 보이되, 호버 전에는 맞닿는 왼쪽 경계면만 블러 처리됩니다. */}
                <div className="w-full mt-6 overflow-hidden [mask-image:linear-gradient(to_left,black_85%,transparent)] group-hover:[mask-image:none] transition-all">
                  <p className="text-slate-500 font-medium text-center text-lg whitespace-nowrap leading-relaxed transition-opacity duration-500">
                    치매 예방을 위한 신체 운동, 두뇌 학습 가이드 및<br /> 생활 습관 개선 프로그램을 제공합니다.
                  </p>
                </div>

                {/* 호버 시(마우스를 올렸을 때) 아래에서 부드럽게 나타나는 액션 버튼 */}
                <div className="mt-10 flex items-center gap-2 text-blue-700 font-bold bg-white px-8 py-3.5 rounded-full opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100 shadow-xl hover:bg-blue-50">
                  가이드 보기 <ArrowRight className="w-5 h-5" />
                </div>
              </div>

            </div>

          </div>
        </div>
      </main>

      {/* 4. 푸터(Footer) 바닥글 영역 */}
      <footer className="bg-white border-t border-slate-200 py-10 relative z-50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-sm text-slate-400 font-medium space-y-4 md:space-y-0">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-slate-300" />
            <span>© 2026 치매정보알리미. All rights reserved.</span>
          </div>
          <div className="flex space-x-8">
            <Link to="/guide" className="hover:text-slate-600 transition-colors">이용약관</Link>
            <Link to="/privacy" className="hover:text-slate-600 transition-colors">개인정보처리방침</Link>
            <a href="#" className="hover:text-slate-600 transition-colors">고객센터</a>
          </div>
        </div>
      </footer>
      
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
}
