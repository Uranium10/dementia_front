import { useState, useEffect, useCallback } from 'react';

// API 통신을 위한 엔드포인트 Base URL
const API_BASE_URL = import.meta.env.VITE_CHATBOT_SERVER || 'http://127.0.0.1:8000';

export default function useDailyCheckin(session) {
  // 상태: 'idle' | 'loading' | 'not_done' | 'done' | 'error'
  const [status, setStatus] = useState('idle');
  const [todayCheckin, setTodayCheckin] = useState(null);

  const fetchTodayCheckin = useCallback(async () => {
    if (!session?.access_token) return;

    setStatus('loading');
    try {
      const response = await fetch(`${API_BASE_URL}/api/checkin/today`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch today checkin');
      }

      const data = await response.json();
      if (data.checked_in) {
        setTodayCheckin(data.checkin);
        setStatus('done');
      } else {
        setTodayCheckin(null);
        setStatus('not_done');
      }
    } catch (error) {
      console.error('Error fetching daily checkin:', error);
      setStatus('error');
    }
  }, [session?.access_token]);

  // 페이지 마운트 시 1회 호출
  useEffect(() => {
    if (session) {
      fetchTodayCheckin();
    }
  }, [session, fetchTodayCheckin]);

  const refresh = () => {
    fetchTodayCheckin();
  };

  const sendTurn = async (messages) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ messages })
      });

      if (response.status === 409) {
        // 이미 탭이 여러개 열려있거나 다른 기기에서 완료한 경우
        await refresh();
        return { type: 'complete' }; // 프론트에서는 에러가 아닌 완료 상태로 넘어가게 처리
      }

      if (!response.ok) {
        throw new Error('Failed to send checkin turn');
      }

      const data = await response.json();

      if (data.type === 'complete') {
        setStatus('done');
        setTodayCheckin({
          summary: data.summary,
          tone: data.tone,
          concern_note: data.concern_note,
          observations: data.observations,
          // 완료된 시점의 임시 날짜 (백엔드에 의존하지만, 즉시 반영 위해)
          checkin_date: new Date().toISOString().split('T')[0]
        });
      }

      return data;
    } catch (error) {
      console.error('Error sending turn:', error);
      // 모달 내에서는 에러를 던져 UI에서 재시도 유도
      throw error;
    }
  };

  return {
    status,
    todayCheckin,
    refresh,
    sendTurn
  };
}
