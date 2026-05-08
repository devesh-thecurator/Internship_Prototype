import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import LoginPage from './pages/Login.jsx';
import RegisterPage from './pages/Register.jsx';
import DashboardPage from './pages/Dashboard.jsx';
import UploadPage from './pages/Upload.jsx';
import ValidatePage from './pages/Validate.jsx';
import ExportPage from './pages/Export.jsx';
import ChatbotPage from './pages/Chatbot.jsx';
import AdminPanelPage from './pages/AdminPanel.jsx';
import NotFoundPage from './pages/NotFound.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return user ? (
    children
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}

function App() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-surface">
      <div className="lg:flex lg:min-h-screen">
        <Sidebar user={user} />
        <div className="flex-1 p-4 lg:p-6">
          <TopBar user={user} onLogout={logout} />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <UploadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/validate"
              element={
                <ProtectedRoute>
                  <ValidatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/export"
              element={
                <ProtectedRoute>
                  <ExportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chatbot"
              element={
                <ProtectedRoute>
                  <ChatbotPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPanelPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
