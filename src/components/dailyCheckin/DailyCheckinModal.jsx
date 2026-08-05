import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, User, CheckCircle2 } from 'lucide-react';

const INITIAL_GREETING = {
  role: 'assistant',
  content: '안녕하세요! 오늘 하루는 어떠셨어요? 편하게 말씀해 주세요.'
};

// DailyCheckinCard가 이 컴포넌트를 항상 렌더링하고 isOpen으로만 표시를 토글한다
// (부모의 status 변화로 강제 언마운트되지 않게 하려는 의도 — DailyCheckinCard.jsx 참고).
// 그래서 "매일 초기화"는 언마운트 시점이 아니라, 매번 열리는 시점(isOpen: false -> true)에
// 대화 state를 직접 리셋하는 방식으로 구현한다.
export default function DailyCheckinModal({ isOpen, onClose, sendTurn }) {
  const [messages, setMessages] = useState([{ id: 'greeting', ...INITIAL_GREETING }]);
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const messagesEndRef = useRef(null);

  // 열릴 때마다 새 대화로 초기화
  useEffect(() => {
    if (isOpen) {
      setMessages([{ id: 'greeting', ...INITIAL_GREETING }]);
      setInputText('');
      setIsSubmitting(false);
      setIsCompleted(false);
    }
  }, [isOpen]);

  // 스크롤 맨 아래로
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isCompleted]);

  // 대화 중 이탈 방지
  const handleClose = () => {
    if (messages.length > 1 && !isCompleted) {
      if (!window.confirm('나눈 대화가 사라져요. 그만두시겠어요?')) {
        return;
      }
    }
    onClose();
  };

  const handleSend = async (isFinishing = false) => {
    if (!inputText.trim() && !isFinishing) return;
    
    // 내용 없이 마치기 방지
    if (isFinishing && messages.length <= 1) return;

    let newMessages = [...messages];
    if (inputText.trim()) {
      newMessages.push({ id: Date.now(), role: 'user', content: inputText });
      setMessages(newMessages);
      setInputText('');
    }

    setIsSubmitting(true);
    try {
      // API 전송 시 id 등 불필요한 필드 제거, role과 content만 보냄
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      
      const response = await sendTurn(apiMessages);
      
      if (response.type === 'complete') {
        setIsCompleted(true);
        setTimeout(() => {
          onClose(); // 1.2초 뒤 자동 종료
        }, 1200);
      } else if (response.type === 'turn' && response.reply) {
        setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: response.reply }]);
        
        // 만약 강제 마무리를 누른 뒤에도 서버가 turn을 줬다면
        if (isFinishing) {
          setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: '대화를 마쳐도 될까요? 원하시면 아래 [대화 마치기]를 다시 눌러주세요.' }]);
        }
      }
    } catch (error) {
      // 서버 에러 시 로컬에서 알려줌 (가이드상으로는 에러를 던지기만 했으나 fallback UI 제공)
      setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: '서버와 연결이 불안정해요. 잠시 후 다시 시도해주세요.' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 6턴 초과 시 (assistant 1 + user 6*2 등) 입력창 비활성화
  const userTurnCount = messages.filter(m => m.role === 'user').length;
  const isInputLocked = userTurnCount >= 6;

  return (
    <AnimatePresence>
      {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        {/* 모달 바깥 배경 클릭 시 닫기 */}
        <div className="absolute inset-0" onClick={handleClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
          className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl flex flex-col overflow-hidden max-h-[85vh] z-10"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <span className="text-xl">💬</span> 오늘의 대화
            </h3>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 relative">
            {isCompleted ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-20 space-y-4"
              >
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                </motion.div>
                <p className="text-xl font-bold text-slate-800">오늘의 체크가 완료됐어요</p>
              </motion.div>
            ) : null}

            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={`px-4 py-3 max-w-[75%] whitespace-pre-wrap text-[15px] leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
                      : 'bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isSubmitting && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-slate-200 text-slate-600">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="px-4 py-3 max-w-[75%] bg-white border border-slate-100 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Footer (Input) */}
          <div className="p-4 bg-white border-t border-slate-100">
            {isInputLocked ? (
              <div className="text-center py-2 text-sm text-slate-500 mb-2">
                충분한 대화를 나누셨네요. 대화를 마무리해볼까요?
              </div>
            ) : (
              <div className="flex items-end gap-2 mb-3 relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 max-h-32 min-h-[50px] p-3 text-[15px] bg-slate-50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  rows={1}
                  disabled={isSubmitting || isCompleted}
                />
                <button
                  onClick={() => handleSend(false)}
                  disabled={!inputText.trim() || isSubmitting || isCompleted}
                  className="w-12 h-[50px] bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            )}
            
            <button
              onClick={() => handleSend(true)}
              disabled={messages.length <= 1 || isSubmitting || isCompleted}
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" /> 대화 마치기
            </button>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
