import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { MessageCircle, X } from 'lucide-react';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-300 shadow-[0_0_42px_rgba(34,211,238,.35)]">
          <div className="w-8 h-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
        </div>
        <p className="font-medium text-slate-300">Powering automotive cockpit...</p>
      </motion.div>
    </div>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    const from = location.state?.from;
    const destination = from
      ? `${from.pathname || '/'}${from.search || ''}${from.hash || ''}`
      : '/';
    return <Navigate to={destination} replace />;
  }

  return children;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  return user ? (
    children
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}

function FloatingAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.button
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/30 bg-slate-950 shadow-[0_0_42px_rgba(34,211,238,0.32)]"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 z-40 w-[calc(100vw-3rem)] overflow-hidden rounded-2xl border border-cyan-300/20 bg-slate-950/95 text-white shadow-[0_24px_70px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:w-96"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-b border-white/10 bg-cyan-300/10 p-4">
              <h3 className="font-black text-white">In-car AI Copilot</h3>
              <p className="text-sm font-medium text-slate-400">Validation, compliance, supplier risk</p>
            </div>
            <div className="p-4 space-y-3">
              <button className="w-full rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-3 text-left transition-colors hover:bg-cyan-300/15">
                <p className="text-sm font-black text-white">Vehicle program status</p>
                <p className="text-xs text-slate-400">Get real-time OEM compliance overview</p>
              </button>
              <button className="w-full rounded-2xl border border-amber-300/15 bg-amber-300/10 p-3 text-left transition-colors hover:bg-amber-300/15">
                <p className="text-sm font-black text-white">Supplier risk assessment</p>
                <p className="text-xs text-slate-400">Analyze PPAP, logistics, and cyber issues</p>
              </button>
              <button className="w-full rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-3 text-left transition-colors hover:bg-emerald-400/15">
                <p className="text-sm font-black text-white">Open full chatbot</p>
                <p className="text-xs text-slate-400">Detailed AI conversation</p>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function App() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isPublicRoute = location.pathname === '/login' || location.pathname === '/register';

  if (isPublicRoute) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
      </Routes>
    );
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#0e7490_0,#020617_32%,#050505_100%)] text-slate-950">
      <div className="lg:flex lg:min-h-screen">
        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.div
          className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } transition-transform duration-300 ease-in-out`}
        >
          <Sidebar user={user} onClose={() => setSidebarOpen(false)} />
        </motion.div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen">
          <TopBar
            user={user}
            onLogout={logout}
            onMenuClick={() => setSidebarOpen(true)}
          />

          <main className="flex-1 p-4 lg:p-6 xl:p-8">
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />
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
          </main>
        </div>
      </div>

      {/* Floating AI Assistant */}
      {user && <FloatingAIAssistant />}
    </div>
  );
}

export default App;
