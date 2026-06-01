import { BrowserRouter, Routes, Route } from 'react-router';
import HomePage from './HomePage'
import Videos from './pages/Videos';


function App() {
  
  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/videos" element={<Videos />} />
      </Routes>
    </BrowserRouter>
      
    </>
  )
}

export default App

