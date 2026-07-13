import React, { useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Brain, ShieldCheck } from 'lucide-react';
import AuthButton from './AuthButton';

/**
 * 공통 사이트 헤더 컴포넌트 (Global Navigation Bar)
 * - 슬라이딩 인디케이터(Sliding Indicator) 애니메이션 포함
 */
export default function Header() {
  const location = useLocation();
  const navRefs = useRef([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const navItems = [
    { path: '/', label: '서비스 소개' },
    { path: '/guide', label: '이용 가이드' },
    { path: '/reference', label: '데이터 출처' },
    { path: '/privacy', label: '개인정보처리방침', icon: <ShieldCheck className="w-4 h-4" /> }
  ];

  // 현재 선택된 메뉴의 위치(left)와 너비(width)를 계산하여 인디케이터 상태 업데이트
  const updateIndicator = () => {
    const activeIndex = navItems.findIndex(item => item.path === location.pathname);
    if (activeIndex !== -1 && navRefs.current[activeIndex]) {
      const activeElement = navRefs.current[activeIndex];
      setIndicatorStyle({
        left: activeElement.offsetLeft,
        width: activeElement.offsetWidth,
        opacity: 1
      });
    } else {
      setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
    }
  };

  useEffect(() => {
    // 폰트 로딩 및 렌더링 후 정확한 width/offset 측정을 위해 약간의 딜레이
    const timer = setTimeout(updateIndicator, 50);
    // 화면 크기가 바뀔 때마다 다시 계산
    window.addEventListener('resize', updateIndicator);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [location.pathname]);

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* 로고 영역 (클릭 시 홈으로 이동) */}
        <Link to="/" className="flex items-center space-x-3 cursor-pointer group">
          <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center transition-transform group-hover:scale-105">
            <Brain className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none m-0">치매정보알리미</h1>
            <p className="text-[11px] text-blue-600 mt-1 font-bold tracking-wider uppercase">치매케어 포털</p>
          </div>
        </Link>
        
        {/* 네비게이션 메뉴 및 로그인 버튼 */}
        <div className="flex items-center space-x-6 h-full">
          <nav className="relative hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-500 h-full">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  ref={(el) => (navRefs.current[index] = el)}
                  className={`flex items-center gap-1.5 h-full transition-colors duration-300 relative z-10 ${
                    isActive ? 'text-blue-600' : 'hover:text-slate-800'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
            
            {/* 슬라이딩 인디케이터 (주색 파란색) */}
            <div 
              className="absolute bottom-0 h-[3px] rounded-t-full bg-blue-600 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
                opacity: indicatorStyle.opacity
              }}
            />
          </nav>
          
          <div className="flex items-center h-full">
            <AuthButton />
          </div>
        </div>
        
      </div>
    </header>
  );
}
