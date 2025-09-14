import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/homePage'; // Your first page
import AuthPage from './components/AuthPage'; // The page you want to navigate to

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* This route renders HomePage when the URL is "/" */}
        <Route path="/home" element={<HomePage />} />

        {/* This route renders AuthPage when the URL is "/auth" */}
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;