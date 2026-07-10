import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import PromptPage from './pages/PromptPage';
import GuidePage from './pages/GuidePage';
import PrivacyPage from './pages/PrivacyPage';
import './App.css';

/**
 * App 컴포넌트는 전체 웹사이트의 URL 라우팅(경로 설정)과 공통 레이아웃을 담당합니다.
 */
function App() {
  // 현재 브라우저의 경로(URL) 정보를 가져오는 React Router Hook입니다.
  const location = useLocation();
  
  // 프롬프트(채팅) 페이지는 자체적인 전용 헤더와 뒤로가기 버튼이 있으므로,
  // 글로벌 사이트 헤더를 숨기기 위한 조건입니다.
  const hideGlobalHeader = location.pathname === '/prompt';

  return (
    <>
      {/* 조건부 헤더 렌더링: hideGlobalHeader가 false일 때만 <Header />가 화면에 나옵니다. */}
      {!hideGlobalHeader && <Header />}
      
      {/* 페이지 라우팅 영역 */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/prompt" element={<PromptPage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Routes>
    </>
  );
}

export default App;
