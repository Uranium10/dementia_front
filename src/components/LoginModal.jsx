import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginModal({ isOpen, onClose }) {
  const [view, setView] = useState('login'); // 'login' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setView('login');
    setEmail('');
    setPassword('');
    setErrorMsg('');
    setSuccessMsg('');
    onClose();
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });
    } catch (err) {
      console.error(err);
      setErrorMsg('구글 로그인에 실패했습니다.');
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // 로그인 성공 시 onClose(또는 페이지 새로고침) 처리됨 (onAuthStateChange 트리거)
        handleClose();
      } else if (view === 'signup') {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
        });
        if (error) throw error;
        
        if (data?.session) {
          // 세션이 반환되었다면 (이메일 인증이 꺼져 있는 경우) 즉시 로그인 성공
          handleClose();
        } else {
          // 이메일 인증이 켜져 있는 경우 안내 문구 표시
          setSuccessMsg('가입 완료! 이메일 인증 링크를 확인해 주세요.');
          setView('login');
        }
      } else if (view === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccessMsg('비밀번호 재설정 링크가 발송되었습니다. 이메일을 확인해 주세요.');
        setView('login');
      }
    } catch (err) {
      console.error(err);
      if (err.message.includes('Invalid login credentials')) {
        setErrorMsg('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else if (err.message.includes('User already registered')) {
        setErrorMsg('이미 가입된 이메일입니다.');
      } else {
        setErrorMsg(err.message || '인증 과정 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 백그라운드 오버레이 (클릭 시 닫힘) */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      
      {/* 모달 컨테이너 */}
      <div className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* 상단 장식 및 닫기 버튼 */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 z-0">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        </div>
        
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 본문 콘텐츠 */}
        <div className="relative z-10 px-8 pt-12 pb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {view === 'login' ? '다시 만나서 반가워요!' : 
               view === 'signup' ? '새로운 계정 만들기' : 
               '비밀번호 재설정'}
            </h2>
            <p className="text-blue-100 text-sm font-medium">
              {view === 'login' ? '치매정보알리미 서비스에 로그인하세요.' : 
               view === 'signup' ? '간단한 가입으로 서비스를 이용해 보세요.' : 
               '가입하신 이메일로 재설정 링크를 보내드립니다.'}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100/50">
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2 font-medium">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            
            {successMsg && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-start gap-2 font-medium">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-1">이메일</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="이메일을 입력하세요"
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all sm:text-sm"
                  />
                </div>
              </div>

              {view !== 'reset' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-xs font-bold text-slate-500">비밀번호</label>
                    {view === 'login' && (
                      <button 
                        type="button" 
                        onClick={() => { setView('reset'); setErrorMsg(''); setSuccessMsg(''); }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        비밀번호 찾기
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="비밀번호를 입력하세요"
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all sm:text-sm"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {loading ? '처리 중...' : (
                  view === 'login' ? '로그인' :
                  view === 'signup' ? '가입하기' : '재설정 링크 받기'
                )}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* 구분선 */}
            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm font-medium">
                <span className="px-3 bg-white text-slate-400">또는</span>
              </div>
            </div>

            {/* 구글 로그인 버튼 */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mt-6 w-full flex justify-center items-center gap-3 py-3 px-4 border border-slate-200 rounded-xl shadow-sm bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 disabled:opacity-70"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              구글 계정으로 시작하기
            </button>
            
            {/* 회원가입/로그인 전환 버튼 */}
            <div className="mt-6 text-center text-sm font-medium text-slate-500">
              {view === 'login' ? (
                <>계정이 없으신가요? <button onClick={() => { setView('signup'); setErrorMsg(''); setSuccessMsg(''); }} className="text-blue-600 hover:text-blue-800 font-bold ml-1 transition-colors">회원가입</button></>
              ) : (
                <>이미 계정이 있으신가요? <button onClick={() => { setView('login'); setErrorMsg(''); setSuccessMsg(''); }} className="text-blue-600 hover:text-blue-800 font-bold ml-1 transition-colors">로그인</button></>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
