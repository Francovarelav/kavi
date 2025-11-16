import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PublicUser from './pages/PublicUser';
import AdminLogin from './pages/admin/AdminLogin';
import AdminSignup from './pages/admin/AdminSignup';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCars from './pages/admin/AdminCars';
import AdminRules from './pages/admin/AdminRules';
import './App.css';

// Protected Route Component for Admin
function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { userData, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!userData || userData.role !== 'admin') {
    return <Navigate to="/admin/login" />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public User Entry (no auth) */}
          <Route path="/" element={<PublicUser />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/signup" element={<AdminSignup />} />
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/cars" 
            element={
              <AdminProtectedRoute>
                <AdminCars />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/rules" 
            element={
              <AdminProtectedRoute>
                <AdminRules />
              </AdminProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
