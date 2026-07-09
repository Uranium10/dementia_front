import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // 라우팅을 위해 추가
import './index.css'
import App from './App.jsx'

// React 앱의 진입점입니다.
// BrowserRouter로 App을 감싸주어 전체 앱에서 라우팅 기능을 사용할 수 있게 합니다.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
