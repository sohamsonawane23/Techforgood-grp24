import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import NewComplaint from './pages/NewComplaint';
import AdminDashboard from './pages/AdminDashboard';
import ComplaintDetail from './pages/ComplaintDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function HomeRoute() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <Dashboard />;
}

function AppShell() {
  const location = useLocation();
  return (
    <div className="min-h-screen text-slate-100">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* key={location.pathname} forces the boundary to reset its
            "crashed" state when the user navigates elsewhere, instead
            of staying stuck on the fallback screen forever. */}
        <ErrorBoundary key={location.pathname}>
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/new" element={<NewComplaint />} />
            <Route path="/complaints/:id" element={<ComplaintDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </Router>
  );
}

export default App;
