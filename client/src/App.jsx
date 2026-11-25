import { Navigate, Route, Routes } from 'react-router';
import Layout from './components/Layout.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import TestLayout from './components/TestLayout.jsx';
import Toasts from './components/Toasts.jsx';
import DirectionsPage from './pages/DirectionsPage.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import PracticePage from './pages/PracticePage.jsx';
import QuestionPage from './pages/QuestionPage.jsx';
import ResultDetailPage from './pages/ResultDetailPage.jsx';
import ResultsPage from './pages/ResultsPage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import SupportsPage from './pages/SupportsPage.jsx';

// The router (BrowserRouter, or MemoryRouter in tests) wraps this component.
export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/results/:attemptId" element={<ResultDetailPage />} />
            <Route path="/supports" element={<SupportsPage />} />
          </Route>
          <Route path="/test/:attemptId" element={<TestLayout />}>
            <Route path="directions" element={<DirectionsPage />} />
            <Route path="q/:n" element={<QuestionPage />} />
            <Route path="review" element={<ReviewPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      <Toasts />
    </>
  );
}
