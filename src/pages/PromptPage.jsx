import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, User, Bot, Brain, ChevronRight } from 'lucide-react';

/**
 * PromptPage (프롬프트 페이지)
 * - 사용자가 치매 상담 및 진단을 위해 AI와 대화하는 채팅 기반 UI 페이지입니다.
 * - 메시지 상태(state)를 관리하며, 사용자 입력 시 더미 응답과 선택지를 동적으로 렌더링합니다.
 */
export default function PromptPage() {
  const navigate = useNavigate();
  
  // 입력창의 텍스트 상태를 관리합니다.
  const [inputText, setInputText] = useState('');
  
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

  // 사용자가 폼을 제출(엔터키 또는 전송 버튼 클릭)할 때 실행되는 함수입니다.
  const handleSend = (e) => {
    e.preventDefault(); // 페이지 새로고침 방지
    if (!inputText.trim()) return; // 빈 칸이면 무시

    // 1. 사용자가 입력한 메시지를 채팅창에 추가합니다.
    const newUserMsg = { id: Date.now(), sender: 'user', text: inputText, options: [] };
    setMessages(prev => [...prev, newUserMsg]);
    setInputText(''); // 입력창 초기화

    // 2. 0.8초(800ms) 뒤에 AI의 더미 응답과 선택지를 띄웁니다. (실제 통신하는 것 같은 지연 효과)
    setTimeout(() => {
      const dummyAiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: '말씀해주신 증상을 종합해본 결과, 초기 인지 저하가 의심될 수 있는 상황입니다. 보다 정확한 안심센터 안내와 맞춤형 가이드를 위해, 현재 가장 두드러지는 증상을 하나 선택해 주세요.',
        options: [
          '기억력 감퇴 (최근 일이나 약속을 자주 잊으심)',
          '시공간 파악 저하 (자주 가시던 길을 헤매심)',
          '성격 및 감정 변화 (우울, 분노, 무기력이 잦아지심)',
          '언어 능력 저하 (알던 단어가 잘 생각나지 않으심)'
        ]
      };
      setMessages(prev => [...prev, dummyAiMsg]);
    }, 800);
  };

  // AI가 제시한 선택지(버튼)를 사용자가 클릭했을 때 실행되는 함수입니다.
  const handleOptionClick = (optionText) => {
    // 1. 클릭한 옵션을 사용자의 메시지처럼 화면에 띄웁니다.
    const newUserMsg = { id: Date.now(), sender: 'user', text: optionText, options: [] };
    setMessages(prev => [...prev, newUserMsg]);
    
    // 2. 옵션에 대한 후속 더미 응답을 띄웁니다.
    setTimeout(() => {
      const finalAiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: `"${optionText}" 증상이 가장 걱정되시는군요.\n이러한 증상은 조기 발견과 전문적인 검진이 매우 중요합니다. 거주하시는 지역(예: 서울시 강남구)을 입력해 주시면, 가장 가까운 치매안심센터 위치와 예약 방법을 안내해 드리겠습니다.`,
        options: []
      };
      setMessages(prev => [...prev, finalAiMsg]);
    }, 800);
  };

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
                <div className={`p-4 rounded-2xl shadow-sm border leading-relaxed whitespace-pre-wrap ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-sm border-indigo-700' 
                    : 'bg-white text-slate-700 rounded-tl-sm border-slate-200'
                }`}>
                  {msg.text}
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
                        <span className="font-medium text-sm">{opt}</span>
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
            placeholder="증상이나 궁금한 점을 입력해 주세요..." 
            className="w-full bg-slate-100 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-full py-4 pl-6 pr-14 outline-none transition-all text-slate-700 placeholder:text-slate-400"
          />
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
          >
            <Send className="w-4 h-4 ml-1" />
          </button>
        </form>
      </footer>
      
    </div>
  );
}
