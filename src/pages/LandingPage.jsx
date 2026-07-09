import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, HeartPulse, Activity, Lock, ArrowRight, ShieldCheck, FileText, Stethoscope, ClipboardList } from 'lucide-react';
// 기존의 체크무늬 문제가 있던 AI 이미지는 사용하지 않고, 고해상도 벡터 아이콘 컴포지션으로 완벽하게 대체합니다.

/**
 * LandingPage 컴포넌트
 * - 사용자가 가장 처음 만나게 되는 메인 화면입니다.
 * - '치매 진단'과 '예방 가이드' 두 가지 핵심 기능 중 하나를 선택할 수 있는 대형 Split(분할) 레이아웃을 제공합니다.
 */
export default function LandingPage() {
  // 화면 이동(라우팅)을 제어하는 React Router의 훅입니다.
  // 이 훅을 호출하여 navigate 함수를 얻고, navigate('/경로') 형식으로 사용합니다.
  const navigate = useNavigate();

  return (
    // 최상위 래퍼: 최소 높이를 화면 전체(min-h-screen)로 잡고, 배경은 연한 회색(bg-slate-50)으로 깔끔하게 설정합니다.
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-200">
      
      {/* 1. 상단 글로벌 네비게이션 헤더 (GNB) */}
      <header className="bg-white border-b border-slate-200 shadow-sm relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer">
            {/* 로고 아이콘 영역: 파란 배경에 펄스(깜빡임) 효과를 주어 생동감을 더합니다. */}
            <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center">
              <Brain className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none m-0">치매정보알리미</h1>
              <p className="text-[11px] text-blue-600 mt-1 font-bold tracking-wider uppercase">치매케어 포털</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-500">
            <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors">서비스 소개</a>
            <a href="#" className="hover:text-slate-800 transition-colors">이용 가이드</a>
            <a href="#" className="hover:text-slate-800 transition-colors flex items-center gap-1.5"><ShieldCheck className="w-4 h-4"/>개인정보처리방침</a>
          </nav>
        </div>
      </header>

      {/* 2. 메인 콘텐츠 영역 (Hero 텍스트 + 선택 레이아웃) */}
      <main className="flex-1 flex flex-col w-full pb-20">
        
        {/* 서비스 핵심 문구를 보여주는 Hero 섹션 */}
        <div className="py-20 text-center px-4 max-w-3xl mx-auto relative z-40">
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold mb-6">
            <Activity className="w-3.5 h-3.5" />
            <span>치매 의심 환자 보호자를 위한 맞춤형 상담</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight">
            불안한 마음을 덜어드리는<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">따뜻한 AI 치매 가이드</span>
          </h2>
          <p className="mt-8 text-slate-500 text-lg leading-relaxed font-medium">
            치매안심센터, 국가 정책, 간이 자가진단까지.<br/>
            어르신의 상태에 맞춘 적절한 대처 방안과 예방 수칙을 안내해 드립니다.
          </p>
        </div>

        {/* 3. 진단 / 예방 분할 선택 레이아웃 (Diagonal Split) */}
        {/* 여백 개선: max-w-7xl로 좌우 폭을 넓게 쓰고, 높이를 650px로 시원하게 키웠습니다. */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex w-full h-[650px] rounded-[2.5rem] overflow-hidden shadow-2xl relative bg-white border border-slate-200">
            
            {/* --- 왼쪽 패널: 치매 진단 및 상담 (Active) --- */}
            {/* 클릭 시 navigate('/prompt')가 실행되어 프롬프트 페이지로 넘어갑니다. */}
            <div 
              onClick={() => navigate('/prompt')}
              className="relative flex-1 bg-gradient-to-br from-blue-600 to-indigo-700 slant-left hover:flex-[1.2] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group cursor-pointer z-10 shadow-[8px_0_20px_rgba(0,0,0,0.15)]"
            >
              {/* 패널 내부 컨텐츠 정렬을 위한 래퍼 */}
              <div className="w-full sm:w-[80%] h-full flex flex-col items-center justify-center p-10 mx-auto transition-transform duration-700 group-hover:scale-[1.02] group-hover:-translate-y-2">
                
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
                
                <h3 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                  <FileText className="w-10 h-10 opacity-90" />
                  치매 상담 및 진단
                </h3>
                {/* 텍스트 줄바꿈 및 여백을 넉넉히 주어 가독성을 높였습니다. */}
                <p className="text-blue-100 mt-6 font-medium text-center max-w-md text-lg opacity-80 group-hover:opacity-100 transition-opacity duration-700 leading-relaxed">
                  AI 챗봇을 통한 간이 자가진단 및 거주 지역의 치매안심센터 서비스망을 확인하세요.
                </p>
                
                {/* 호버 시(마우스를 올렸을 때) 아래에서 부드럽게 나타나는 액션 버튼 */}
                <div className="mt-10 flex items-center gap-2 text-blue-700 font-bold bg-white px-8 py-3.5 rounded-full opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100 shadow-xl hover:bg-blue-50">
                  진단 시작하기 <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
            
            {/* --- 오른쪽 패널: 예방 가이드 (Disabled / 준비 중) --- */}
            {/* -ml-[150px]: 왼쪽의 사선 모양(slant-left)에 맞물리도록 왼쪽 마진을 당겨 빈틈을 없앱니다. */}
            <div className="relative flex-1 bg-slate-50 slant-right transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] -ml-[150px] z-0 group grayscale-[0.85] hover:grayscale-[0.6] opacity-90 cursor-not-allowed">
              
              {/* 비활성화 상태를 시각적으로 강조하는 오버레이 (Hover 시 나타남) */}
              <div className="absolute inset-0 bg-slate-200/50 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                 <span className="bg-slate-800 text-white px-8 py-3.5 rounded-full font-bold shadow-2xl flex items-center gap-2.5 text-sm ring-4 ring-slate-800/20">
                   <Lock className="w-4.5 h-4.5" /> 
                   다음 단계(예방 프로젝트)에서 오픈됩니다
                 </span>
              </div>
              
              {/* 시각적 오프셋(-ml-150px)을 상쇄하기 위해 내용물을 오른쪽(ml-150px)으로 밀어 중앙을 맞춥니다. */}
              <div className="w-full sm:w-[80%] h-full flex flex-col items-center justify-center p-10 mx-auto ml-[75px] sm:ml-[150px] transition-transform duration-700 group-hover:scale-[0.98] opacity-60">
                
                {/* 미감 개선: 오른쪽 역시 SVG 아이콘 기반의 모던한 컴포지션으로 대체 */}
                <div className="relative bg-white p-10 rounded-full border border-slate-200 mb-10 shadow-md flex items-center justify-center w-48 h-48">
                  <Brain className="w-24 h-24 text-slate-400 drop-shadow-sm relative z-10" />
                  <HeartPulse className="w-12 h-12 text-slate-300 absolute top-8 right-8" />
                </div>
                
                <h3 className="text-4xl font-extrabold text-slate-500 tracking-tight flex items-center gap-3">
                  <HeartPulse className="w-10 h-10 opacity-70" />
                  인지 능력 예방 가이드
                </h3>
                <p className="text-slate-400 mt-6 font-medium text-center max-w-md text-lg leading-relaxed">
                  치매 예방을 위한 신체 운동, 두뇌 학습 가이드 및 생활 습관 개선 프로그램을 제공합니다.
                </p>
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
            <a href="#" className="hover:text-slate-600 transition-colors">이용약관</a>
            <a href="#" className="hover:text-slate-600 transition-colors">개인정보취급방침</a>
            <a href="#" className="hover:text-slate-600 transition-colors">고객센터</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
