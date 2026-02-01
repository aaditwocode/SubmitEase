import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/homePage'; // Your first page
import SignInPage from './components/SignInPage'; // The page you want to navigate to
import SignUpPage from './components/SignUpPage';
import DashBoardPage from './components/DashBoardPage';
import ConferencePortal from './components/ConferencePortal';
import { UserProvider } from './components/UserContext';
import ProtectedRoute from './components/ProtectedRoute';
import ManageConferencesPage_ChiefChair from './components/ManageConferences_ChiefChair';
import ManageConferencesPage_TrackChair from './components/ManageConferences_TrackChair';
import ManageConferencesPage_PublicationChair from './components/ManageConferences_PublicationChair';
import ManageConferencesPage_RegistrationChair from './components/ManageConferences_RegistrationChair';
import ConferenceRegistration from './components/ConferenceRegistration';
import ViewPaper from './components/ViewPaper';
import PaperDecision from './components/PaperDecision';
import ReviewPaper from './components/ReviewPaper';
import ManageReviews from './components/ManageReviews';

import RegistrationChairPortal from './components/registrationChair';
import ConferenceDetails_ChiefChair from './components/ConferenceDetails_ChiefChair';
import ConferenceDetails_TrackChair from './components/ConferemceDetails_TrackChair';
import PublicationChairPortal from './components/PublicationChair';


import EditorPortal from './components/JournalEditor';
import JournalPortal from './components/JournalPortal';
import ViewJournalPaper from './components/ViewJournalPaper';

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
            path="/journal"
            element={
              <ProtectedRoute>
                <JournalPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Paper/:paperId"
            element={
              <ProtectedRoute>
                <ViewPaper />
              </ProtectedRoute>
            }
          />
          <Route
            path="/PaperDecision/:paperId"
            element={
              <ProtectedRoute>
                <PaperDecision />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ManageReviews"
            element={
              <ProtectedRoute>
                <ManageReviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ReviewPaper/:paperId"
            element={
              <ProtectedRoute>
                <ReviewPaper />
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
            path="/conference/manage/chiefchair"
            element={
              <ProtectedRoute>
                <ManageConferencesPage_ChiefChair />
              </ProtectedRoute>
            }
          />
          <Route
            path='/conference/manage/trackchair'
            element={
              <ProtectedRoute>
                <ManageConferencesPage_TrackChair />
              </ProtectedRoute>
            }
          />
          <Route
            path='/conference/manage/publicationchair'
            element={
              <ProtectedRoute>
                <ManageConferencesPage_PublicationChair />
              </ProtectedRoute>
            }
          />
          <Route
            path='/conference/manage/registrationchair'
            element={
              <ProtectedRoute>
                <ManageConferencesPage_RegistrationChair />
              </ProtectedRoute>
            }
          />
          <Route
            path="/conference/manage/:hashedConId"
            element={
              <ProtectedRoute>
                <ConferenceDetails_ChiefChair />
              </ProtectedRoute>
            
              }
          />
          <Route
            path="/conference/manage/trackpapers/:hashedConId"
            element={
            <ProtectedRoute>
              <ConferenceDetails_TrackChair />
            </ProtectedRoute>}
          />
          <Route
            path="/conference/manage/publication/:hashedConId"
            element={
            <ProtectedRoute>
              <PublicationChairPortal />
            </ProtectedRoute>}
          />
          <Route
            path="/conference/manage/registration/:hashedConId"
            element={<ProtectedRoute><RegistrationChairPortal /></ProtectedRoute>}
          />
           <Route
            path="/journal/paper/:paperId"
            element={<ProtectedRoute><ViewJournalPaper /></ProtectedRoute>}
          />
           <Route
            path="/journal/editor"
            element={<ProtectedRoute><EditorPortal /></ProtectedRoute>}
          />
        </Routes>

       



        
      </BrowserRouter>
    </UserProvider>
  );
}
export default App;