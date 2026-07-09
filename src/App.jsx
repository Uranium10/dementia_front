import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import PromptPage from './pages/PromptPage';
import './App.css';

/**
 * App 컴포넌트는 전체 웹사이트의 URL 라우팅(경로 설정)을 담당합니다.
 * - '/' 경로: LandingPage (진단/예방 선택 화면)
 * - '/prompt' 경로: PromptPage (치매 상담 챗봇 화면)
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/prompt" element={<PromptPage />} />
    </Routes>
  );
}

export default App;
