import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home.tsx'
import { Join } from './pages/Join.tsx'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join/:code" element={<Join />} />
      </Routes>
    </BrowserRouter>
  )
}
