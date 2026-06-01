import { BrowserRouter, Routes, Route } from 'react-router';
import HomePage from './HomePage'
import Videos from './pages/Videos';
import CommunityChat from './pages/junkiesCommunity';

function App() {
  
  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/junkies" element={<CommunityChat />} />

      </Routes>
    </BrowserRouter>
      
    </>
  )
}

export default App

