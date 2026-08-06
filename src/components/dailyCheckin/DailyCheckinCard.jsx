import React, { useState } from 'react';
import useDailyCheckin from '../../hooks/useDailyCheckin';
import DailyCheckinModal from './DailyCheckinModal';
import { MessageCircle, CheckCircle2 } from 'lucide-react';

// 톤 매핑 표 (가이드 5-3절)
const TONE_MAP = {
  reassure: { label: '안심', colors: 'bg-green-50 text-green-700' },
  neutral: { label: '보통', colors: 'bg-slate-100 text-slate-600' },
  observe: { label: '관찰 권함', colors: 'bg-amber-50 text-amber-700' },
  suggest_consult: { label: '상담 권유', colors: 'bg-amber-100 text-amber-800' },
};

// 완료 시각을 "오후 3:12" 형태로 브라우저 로컬 타임존 기준 표시한다.
// (toLocaleTimeString은 별도 UTC 계산 없이 시스템 타임존을 그대로 쓰므로,
//  게임 점수판에서 겪었던 자정 근처 날짜 어긋남 문제가 애초에 발생하지 않는다)
function formatCompletedTime(isoString) {
  if (!isoString) return null;
  try {
    return new Date(isoString).toLocaleTimeString('ko-KR', {
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch {
    return null;
  }
}

export default function DailyCheckinCard({ session }) {
  const { status, todayCheckin, refresh, sendTurn } = useDailyCheckin(session);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 상위(PreventionPage)에서 session 이 있을 때만 렌더링되므로 별도 로그인 체크는 하지 않음

  // status에 따른 배경 카드 내용만 결정한다. 모달은 이 분기 밖에서 항상 트리에 남겨,
  // 토큰 자동 갱신 등으로 status가 흔들려도(예: 'not_done' -> 'loading') 대화 중인
  // 모달이 강제로 언마운트되며 조용히 사라지는 일이 없게 한다.
  let content;

  if (status === 'loading' || status === 'idle') {
    content = <div className="bg-slate-200 animate-pulse rounded-3xl h-[160px] w-full" />;
  } else if (status === 'error') {
    content = (
      <section className="bg-white rounded-3xl shadow-sm p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-slate-100 p-2 rounded-xl text-slate-400">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">오늘의 대화 정보를 불러오지 못했어요.</h3>
            <p className="text-sm text-slate-500 mt-1">네트워크 상태를 확인하고 다시 시도해 보세요.</p>
          </div>
        </div>
        <button
          onClick={refresh}
          className="bg-slate-100 text-slate-600 px-5 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors shrink-0"
        >
          다시 시도
        </button>
      </section>
    );
  } else if (status === 'done' && todayCheckin) {
    const toneInfo = TONE_MAP[todayCheckin.tone] || TONE_MAP['neutral'];
    // 방금 완료한 경우(completedAt 있음)만 시각을 보여준다. 새로고침 후 서버에서
    // 받아온 값은 날짜만 있고 정확한 시각이 없으므로, 없는 시각을 지어내지 않는다.
    const completedTime = formatCompletedTime(todayCheckin.completedAt);

    content = (
      <section className="bg-white rounded-3xl shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="bg-green-500 p-2 rounded-xl text-white shadow-sm shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                오늘의 체크를 완료했어요!
              </h3>
              <span className={`inline-flex px-2 py-0.5 rounded font-bold text-[11px] ${toneInfo.colors} w-fit`}>
                {toneInfo.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 ml-auto md:ml-0 mt-4 md:mt-0">
          <div className="text-xs text-slate-400 font-medium">
            {completedTime ? `오늘 ${completedTime} 완료` : '오늘 완료'}
          </div>
          <button 
            onClick={() => navigate('/daily-checkin-report')}
            className="text-blue-600 font-bold text-sm hover:underline"
          >
            자세히 보기
          </button>
        </div>
      </section>
    );
  } else {
    // status === 'not_done'
    content = (
      <section className="bg-white rounded-3xl shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-sm shrink-0">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">아직 오늘의 체크를 하지 않으셨어요!</h3>
            <p className="text-sm text-slate-600 mt-1">짧은 대화로 오늘 하루를 가볍게 기록해보세요.</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors whitespace-nowrap shadow-sm mt-4 md:mt-0 w-full md:w-auto"
        >
          오늘의 대화 시작하기
        </button>
      </section>
    );
  }

  return (
    <>
      {content}
      {/* status 분기와 무관하게 항상 렌더링. isModalOpen(사용자 조작)만이 표시 여부를 결정하고,
          내부적으로 AnimatePresence가 실제 마운트/언마운트와 진입·퇴장 애니메이션을 담당한다. */}
      <DailyCheckinModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sendTurn={sendTurn}
      />
    </>
  );
}
