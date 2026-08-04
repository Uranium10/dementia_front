import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { User, Lock, Trash2, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Password Change State
  const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete Account State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        navigate('/');
      } else {
        setSession(session);
      }
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!session) return null;

  const user = session.user;
  const metadata = user.user_metadata || {};
  const fullName = metadata.full_name || metadata.name || user.email.split('@')[0];
  const avatarUrl = metadata.avatar_url || metadata.picture;
  const isSocialLogin = !user.app_metadata?.providers?.includes('email');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('새 비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsChangingPassword(true);
    try {
      // Verify old password by signing in again
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });

      if (signInError) {
        setPasswordError('이전 비밀번호가 일치하지 않습니다.');
        setIsChangingPassword(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      
      if (updateError) throw updateError;

      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setIsPasswordSectionOpen(false), 2000);
    } catch (err) {
      setPasswordError(err.message || '비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError('');
    setIsDeleting(true);

    try {
      // 본인 확인 (소셜 vs 이메일)
      if (isSocialLogin) {
        if (deletePassword !== user.email) {
          setDeleteError('이메일이 일치하지 않습니다.');
          setIsDeleting(false);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: deletePassword,
        });

        if (signInError) {
          setDeleteError('비밀번호가 일치하지 않습니다.');
          setIsDeleting(false);
          return;
        }
      }

      // Backend API call to delete user using service role key
      const CHATBOT_SERVER = import.meta.env.VITE_CHATBOT_SERVER || 'http://localhost:8000';
      const response = await fetch(`${CHATBOT_SERVER}/api/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('회원 탈퇴 처리에 실패했습니다. 서버 관리자에게 문의해주세요.');
      }

      // Sign out and redirect
      await supabase.auth.signOut();
      navigate('/');
    } catch (err) {
      setDeleteError(err.message || '오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20 font-sans">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8 tracking-tight">계정 정보</h1>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 mb-6 transition-all hover:shadow-md">
          <div className="flex items-center gap-6 mb-8">
            {avatarUrl ? (
              <img src={avatarUrl} alt="profile" className="w-20 h-20 rounded-full object-cover shadow-sm border border-slate-100" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-3xl uppercase border border-blue-100 shadow-sm">
                {fullName.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{fullName}</h2>
              <p className="text-slate-500 mt-1">{user.email}</p>
            </div>
          </div>

          <hr className="border-slate-100 my-6" />

          {/* Password Change Section */}
          {!isSocialLogin ? (
            <div className="mb-2">
              <button 
                onClick={() => setIsPasswordSectionOpen(!isPasswordSectionOpen)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors text-left border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"><Lock className="w-5 h-5 text-slate-600" /></div>
                  <span className="font-bold text-slate-700">비밀번호 변경</span>
                </div>
                {isPasswordSectionOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>

              <div className={`overflow-hidden transition-all duration-300 ${isPasswordSectionOpen ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                <form onSubmit={handlePasswordChange} className="p-5 md:p-6 bg-white border border-slate-100 rounded-2xl space-y-5 shadow-sm">
                  {passwordError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {passwordError}
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 text-green-600 rounded-xl text-sm font-medium border border-green-100">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> 비밀번호가 성공적으로 변경되었습니다.
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">이전 비밀번호</label>
                    <input type="password" required value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">새 비밀번호</label>
                    <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">새 비밀번호 (확인)</label>
                    <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white" />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={isChangingPassword}
                    className="w-full py-3.5 mt-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {isChangingPassword ? '변경 중...' : '비밀번호 변경 완료'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="p-5 md:p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-600 leading-relaxed">
                구글 등 소셜 로그인으로 가입한 계정은 자체 비밀번호가 없습니다.<br/>
                보안 및 계정 관리는 해당 소셜 서비스 설정에서 진행해 주세요.
              </p>
            </div>
          )}
        </div>

        {/* Delete Account Button */}
        <div className="flex justify-end mt-8">
          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <Trash2 className="w-4 h-4" /> 회원 탈퇴
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 md:p-8 shadow-2xl relative">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">정말 탈퇴하시겠습니까?</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              회원을 탈퇴하면 계정과 관련된 모든 정보가 즉시 영구적으로 삭제되며, 다시 복구할 수 없습니다. 
              계속하시려면 {isSocialLogin ? '아래에 본인 이메일을 똑같이 입력해주세요.' : '계정 비밀번호를 입력해주세요.'}
            </p>
            
            <form onSubmit={handleDeleteAccount}>
              {deleteError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium mb-5 border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {deleteError}
                </div>
              )}
              
              <div className="mb-6">
                <input 
                  type={isSocialLogin ? 'email' : 'password'} 
                  required 
                  placeholder={isSocialLogin ? user.email : '현재 비밀번호 입력'}
                  value={deletePassword} 
                  onChange={e => setDeletePassword(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white" 
                />
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => { setIsDeleteModalOpen(false); setDeletePassword(''); setDeleteError(''); }}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  disabled={isDeleting || deletePassword.length === 0 || (isSocialLogin && deletePassword !== user.email)}
                  className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 shadow-sm shadow-red-200"
                >
                  {isDeleting ? '처리 중...' : '탈퇴 확인'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
