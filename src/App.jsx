import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import PromptPage from './pages/PromptPage';
import PreventionPage from './pages/PreventionPage';
import PostListPage from './pages/PostListPage';
import PostDetailPage from './pages/PostDetailPage';
import GuidePage from './pages/GuidePage';
import PrivacyPage from './pages/PrivacyPage';
import ReferencePage from './pages/ReferencePage';
import ProfilePage from './pages/ProfilePage';
import SudokuPage from './pages/games/SudokuPage';
import ColorMatchPage from './pages/games/ColorMatchPage';
import SequencePage from './pages/games/SequencePage';
import GameStatsPage from './pages/GameStatsPage';
import './App.css';

/**
 * App 컴포넌트는 전체 웹사이트의 URL 라우팅(경로 설정)과 공통 레이아웃을 담당합니다.
 */
function App() {
  // 현재 브라우저의 경로(URL) 정보를 가져오는 React Router Hook입니다.
  const location = useLocation();

  // 프롬프트(채팅) 페이지 및 게임 전용 페이지는 자체 헤더가 있으므로 글로벌 헤더 숨김
  const hideGlobalHeader = location.pathname === '/prompt' || location.pathname.startsWith('/game');

  return (
    <>
      {/* 조건부 헤더 렌더링: hideGlobalHeader가 false일 때만 <Header />가 화면에 나옵니다. */}
      {!hideGlobalHeader && <Header />}

      {/* 페이지 라우팅 영역 */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/prevention" element={<PreventionPage />} />
        <Route path="/posts" element={<PostListPage />} />
        <Route path="/post/:id" element={<PostDetailPage />} />
        <Route path="/prompt" element={<PromptPage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/reference" element={<ReferencePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/game/sudoku" element={<SudokuPage />} />
        <Route path="/game/color-match" element={<ColorMatchPage />} />
        <Route path="/game/sequence" element={<SequencePage />} />
        <Route path="/game-stats" element={<GameStatsPage />} />
      </Routes>
    </>
  );
}

export default App;
