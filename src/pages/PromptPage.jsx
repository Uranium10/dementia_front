import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, User, Bot, Brain, ChevronRight, Square } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

/**
 * PromptPage (프롬프트 페이지)
 * - 사용자가 치매 상담 및 진단을 위해 AI와 대화하는 채팅 기반 UI 페이지입니다.
 * - 메시지 상태(state)를 관리하며, 사용자 입력 시 더미 응답과 선택지를 동적으로 렌더링합니다.
 */
export default function PromptPage() {
  const navigate = useNavigate();

  // 입력창의 텍스트 상태를 관리합니다.
  const [inputText, setInputText] = useState('');

  // 백엔드(AI)의 답변을 기다리는 중인지 여부를 관리하는 상태입니다.
  const [isTyping, setIsTyping] = useState(false);

  // 전체 채팅 메시지 내역을 관리하는 배열 상태입니다.
  // 기본값으로 AI의 첫 인사말이 들어있습니다.
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: '안녕하세요. 보호자님의 걱정을 덜어드릴 치매정보알리미 AI입니다.\n어르신의 연세와 최근 걱정되시는 증상(예: 기억력 저하, 길 잃음 등)을 편하게 말씀해 주시면, 상태를 분석하여 인근 치매안심센터와 대처 방안을 안내해 드리겠습니다.',
      options: [] // 선택지 배열
    }
  ]);

  // 새로운 메시지가 추가될 때마다 스크롤을 맨 아래로 내리기 위한 참조 객체입니다.
  const messagesEndRef = useRef(null);

  // messages 상태가 변경될 때마다(즉, 새 메시지가 추가될 때마다) 실행됩니다.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 공통 메시지 전송 로직
  const sendMessage = async (displayMessage, backendValue) => {
    const newUserMsg = { id: Date.now(), sender: 'user', text: displayMessage, value: backendValue, options: [], sources: [] };
    setMessages(prev => [...prev, newUserMsg]);

    const messageHistory = messages.map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      // 백엔드로 보낼 때는 value가 있으면 value를, 없으면 text를 보냅니다.
      content: m.value || m.text
    }));
    messageHistory.push({ role: 'user', content: backendValue });

    const tempAiMsgId = Date.now() + 1;
    try {
      setIsTyping(true);
      setMessages(prev => [...prev, { id: tempAiMsgId, sender: 'ai', text: '답변을 생성하고 있습니다...', options: [], sources: [] }]);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      const metadata = user?.user_metadata || {};
      const userId = user?.id || 'guest-123';
      const userName = metadata?.full_name || metadata?.name || '게스트';

      let response;
      try {
        response = await fetch('http://localhost:8000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, user_name: userName, messages: messageHistory }),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      const data = await response.json();
      const resData = data.response;

      let newText = '';
      let newOptions = [];
      let newSources = [];
      let newAllowFreeInput = true;

      // 새 출력 규격에 맞게 파싱
      if (resData?.type === 'reply') {
        newText = resData.content?.text || '';
        newSources = resData.sources || [];
      } else if (resData?.type === 'choices') {
        newText = resData.content?.question || '';
        newOptions = resData.content?.options || [];
        if (resData.content?.allow_free_input === false) {
          newAllowFreeInput = false;
        }
      } else {
        // 기존 대비용 폴백
        newText = data.reply || '응답을 처리할 수 없습니다.';
      }

      setMessages(prev => prev.map(msg =>
        msg.id === tempAiMsgId
          ? { ...msg, text: newText, options: newOptions, sources: newSources, allowFreeInput: newAllowFreeInput }
          : msg
      ));
    } catch (error) {
      console.error('Chat API Error:', error);
      let errorMessage = '서버에 연결할 수 없습니다. 백엔드 서버가 켜져 있는지 확인해 주세요.';
      if (error.name === 'AbortError') {
        errorMessage = '서버 응답 시간이 초과되었습니다(15초). 네트워크 연결 상태를 확인하거나 잠시 후 다시 시도해 주세요.';
      } else if (error.message.startsWith('HTTP_')) {
        const statusCode = error.message.split('_')[1];
        errorMessage = `서버 내부 오류가 발생했습니다 (상태 코드: ${statusCode}). 잠시 후 다시 시도해 주세요.`;
      }
      setMessages(prev => prev.filter(msg => msg.id !== tempAiMsgId).concat(
        { id: Date.now() + 2, sender: 'ai', text: errorMessage, options: [], sources: [] }
      ));
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const currentText = inputText;
    setInputText('');
    await sendMessage(currentText, currentText);
  };

  const handleOptionClick = (opt) => {
    // opt는 { label, value } 객체입니다.
    // 화면에는 label을 띄우고, 서버로는 value를 보냅니다.
    sendMessage(opt.label, opt.value);
  };

  // 마지막 AI 메시지를 확인하여 입력창을 막을지 결정합니다.
  const lastAiMessage = [...messages].reverse().find(m => m.sender === 'ai');
  const isInputLocked = lastAiMessage?.allowFreeInput === false;

  return (
    // 전체 레이아웃
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* 상단 헤더 */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center shadow-sm sticky top-0 z-50">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors mr-4 text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">AI 치매 상담 가이드</h1>
            <p className="text-xs text-slate-500 font-medium">따뜻하고 정확한 분석을 제공합니다</p>
          </div>
        </div>
      </header>

      {/* 메인 채팅창 영역 */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6 pb-4">

          {/* messages 배열을 순회하며 채팅 말풍선을 그립니다. */}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>

              {/* 프로필 아이콘 (AI면 봇 아이콘, 유저면 사람 아이콘) */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md ${msg.sender === 'user' ? 'bg-indigo-600' : 'bg-blue-600'}`}>
                {msg.sender === 'user' ? <User className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
              </div>

              {/* 말풍선 컨테이너 */}
              <div className="flex flex-col gap-3 max-w-[85%]">
                {/* 텍스트 말풍선 */}
                <div className={`p-4 rounded-2xl shadow-sm border leading-relaxed whitespace-pre-wrap ${msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm border-indigo-700'
                    : 'bg-white text-slate-700 rounded-tl-sm border-slate-200'
                  }`}>
                  {msg.text}
                  
                  {/* Sources 렌더링 (AI 메시지이고 sources가 있을 때만) */}
                  {msg.sender === 'ai' && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60">
                      <p className="text-xs font-bold text-slate-500 mb-2">참고 자료</p>
                      <ul className="space-y-2">
                        {msg.sources.map((src, idx) => (
                          <li key={idx} className="bg-slate-50 p-3 rounded-lg text-sm border border-slate-100">
                            {src.url ? (
                              <a href={src.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">
                                {src.title}
                              </a>
                            ) : (
                              <span className="font-semibold text-slate-700">{src.title}</span>
                            )}
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{src.snippet}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* AI 메시지에 선택지(options) 배열이 있다면 버튼 목록을 렌더링합니다. */}
                {msg.options && msg.options.length > 0 && (
                  <div className="flex flex-col gap-2 mt-1">
                    {msg.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleOptionClick(opt)}
                        className="text-left w-full bg-white border border-blue-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 p-3 rounded-xl shadow-sm transition-colors flex items-center justify-between group"
                      >
                        <span className="font-medium text-sm">{opt.label || opt}</span>
                        <ChevronRight className="w-4 h-4 text-blue-400 group-hover:text-blue-600" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* 스크롤을 맨 아래로 내리기 위한 빈 div */}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* 하단 폼(입력창) 영역 */}
      <footer className="bg-white border-t border-slate-200 p-4 sticky bottom-0">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isTyping ? "AI가 답변을 작성하고 있습니다..." :
              isInputLocked ? "제시된 버튼을 눌러 선택해 주세요." :
              "증상이나 궁금한 점을 입력해 주세요..."
            }
            disabled={isTyping || isInputLocked}
            className="w-full bg-slate-100 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-full py-4 pl-6 pr-14 outline-none transition-all text-slate-700 placeholder:text-slate-400 disabled:bg-slate-200 disabled:cursor-not-allowed"
          />
          <button 
            type="submit"
            disabled={!inputText.trim() || isTyping || isInputLocked}
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 text-white rounded-full flex items-center justify-center transition-colors shadow-sm ${
              isTyping || isInputLocked
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300'
            }`}
          >
            {isTyping ? <Square className="w-4 h-4 fill-current" /> : <Send className="w-4 h-4 ml-1" />}
          </button>
        </form>
      </footer>

    </div>
  );
}
