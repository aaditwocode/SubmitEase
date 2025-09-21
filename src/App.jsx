import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/homePage'; // Your first page
import SignInPage from './components/SignInPage'; // The page you want to navigate to
import SignUpPage from './components/SignUpPage';
import DashBoardPage from './components/DashBoardPage';
import ConferencePortal from './components/ConferencePortal';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* This route renders HomePage when the URL is "/home" */}
        <Route path="/home" element={<HomePage />} />

        {/* This route renders AuthPage when the URL is "/auth" */}
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/dashboard" element={<DashBoardPage />} />
        <Route path="/conference" element={<ConferencePortal />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;