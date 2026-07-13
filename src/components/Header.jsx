import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, ShieldCheck } from 'lucide-react';
import AuthButton from './AuthButton';

/**
 * 공통 사이트 헤더 컴포넌트 (Global Navigation Bar)
 * - 앱의 최상단에 고정되어 모든 메인 페이지(랜딩, 가이드, 약관 등)에서 공유됩니다.
 * - LandingPage.jsx에서 하드코딩되었던 부분을 분리하여 재사용성을 극대화했습니다.
 */
export default function Header() {
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
        <div className="flex items-center space-x-6">
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-500">
            <Link to="/" className="hover:text-blue-600 transition-colors">서비스 소개</Link>
            <Link to="/guide" className="hover:text-blue-600 transition-colors">이용 가이드</Link>
            <Link to="/reference" className="hover:text-blue-600 transition-colors">데이터 출처</Link>
            <Link to="/privacy" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />개인정보처리방침
            </Link>
          </nav>
          
          <AuthButton />
        </div>
        
      </div>
    </header>
  );
}
