import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import PublicInvitation from './pages/PublicInvitation';
import RSVPForm from './pages/RSVPForm';
import GuestPhotoWall from './pages/GuestPhotoWall';
import ImageEditor from './pages/ImageEditor';
import SeatingChart from './pages/SeatingChart';
import LiveStream from './pages/LiveStream';
import Collaboration from './pages/Collaboration';
import SmartTemplates from './pages/SmartTemplates';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import PaymentGateway from './pages/PaymentGateway';
import OnboardingForm from './pages/OnboardingForm';
import Photobooth from './pages/Photobooth';
import Home from './Home';
import ErrorBoundary from './components/ErrorBoundary';
import PreviewMode from './pages/PreviewMode';
import RequireAuth from './components/RequireAuth';
import { ToastProvider } from './components/Toast';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/onboarding" element={<OnboardingForm />} />
          <Route path="/payment" element={<PaymentGateway />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/dashboard/:coupleName" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/invite/" element={<Navigate to="/" replace />} />
          <Route path="/invite/:coupleName" element={<PublicInvitation />} />
          <Route path="/preview/:weddingId" element={<PreviewMode />} />
          <Route path="/rsvp/:coupleName/:token?" element={<RSVPForm />} />
          <Route path="/rsvp/:coupleName/:token" element={<RSVPForm />} />
          <Route path="/guest-photo-wall/:coupleName" element={<GuestPhotoWall />} />
          <Route path="/dashboard/:coupleName/editor" element={<RequireAuth><ImageEditor /></RequireAuth>} />
          <Route path="/dashboard/:coupleName/seating" element={<RequireAuth><SeatingChart /></RequireAuth>} />
          <Route path="/dashboard/:coupleName/stream" element={<RequireAuth><LiveStream /></RequireAuth>} />
          <Route path="/dashboard/:coupleName/photobooth" element={<RequireAuth><Photobooth /></RequireAuth>} />
          <Route path="/dashboard/:coupleName/collab" element={<RequireAuth><Collaboration /></RequireAuth>} />
          <Route path="/smart-templates" element={<SmartTemplates />} />
        </Routes>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;