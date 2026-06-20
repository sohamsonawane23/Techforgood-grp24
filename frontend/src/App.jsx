import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import NewComplaint from './pages/NewComplaint';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <Router>
      <div className="min-h-screen text-slate-100">
        <Navbar isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <Routes>
            <Route path="/" element={isAdmin ? <AdminDashboard /> : <Dashboard />} />
            <Route path="/new" element={<NewComplaint />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
