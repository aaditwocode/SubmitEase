import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/homePage'; // Your first page
import SignInPage from './components/SignInPage'; // The page you want to navigate to
import SignUpPage from './components/SignUpPage';
import DashBoardPage from './components/DashBoardPage';
import ConferencePortal from './components/ConferencePortal';
import { UserProvider } from './components/UserContext';
import ProtectedRoute from './components/ProtectedRoute';
import ManageConferences from './components/ManageConferences';
import ConferenceRegistration from './components/ConferenceRegistration';
function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />

          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashBoardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/conference"
            element={
              <ProtectedRoute>
                <ConferencePortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/conference/registration"
            element={
              <ProtectedRoute>
                <ConferenceRegistration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/conference/manage"
            element={
              <ProtectedRoute>
                <ManageConferences/>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}
export default App;