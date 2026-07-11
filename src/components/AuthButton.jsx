import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, LogOut, RefreshCcw } from 'lucide-react';

export default function AuthButton() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
  };

  if (loading) {
    return <div className="w-20 h-9 bg-slate-200 animate-pulse rounded-full"></div>;
  }

  if (!session) {
    return (
      <button
        onClick={handleSignIn}
        className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
      >
        로그인
      </button>
    );
  }

  const user = session?.user;
  const metadata = user?.user_metadata || {};
  const fullName = metadata?.full_name || metadata?.name || '사용자';
  const avatarUrl = metadata?.avatar_url || metadata?.picture;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-full hover:bg-slate-50 transition-colors shadow-md text-slate-800"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="profile" className="w-7 h-7 rounded-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
            {fullName.charAt(0)}
          </div>
        )}
        <span className="text-sm font-bold">{fullName}님</span>
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <p className="text-sm font-bold text-slate-800 truncate">{fullName}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email || '이메일 없음'}</p>
          </div>
          <div className="py-2">
            <button
              onClick={() => {
                setMenuOpen(false);
                handleSignIn();
              }}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors font-medium"
            >
              계정 전환
            </button>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
            >
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
