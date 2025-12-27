import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/Layout/AppLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Scans from './pages/Scans';
import ScanCreate from './pages/ScanCreate';
import ScanDetail from './pages/ScanDetail';
import Compliance from './pages/Compliance';
import Settings from './pages/Settings';
import GarakScan from './pages/GarakScan';
import LLMTopTenScan from './pages/LLMTopTenScan';
import AgentTopTenScan from './pages/AgentTopTenScan';
import ARTScan from './pages/ARTScan';
import CounterfitScan from './pages/CounterfitScan';

// Styles
import './styles/index.css';
import './styles/components.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/scans" element={<Scans />} />
              <Route path="/scans/create" element={<ScanCreate />} />
              <Route path="/scans/:id" element={<ScanDetail />} />
              <Route path="/scans/garak" element={<GarakScan />} />
              <Route path="/scans/llmtopten" element={<LLMTopTenScan />} />
              <Route path="/scans/agenttopten" element={<AgentTopTenScan />} />
              <Route path="/scans/art" element={<ARTScan />} />
              <Route path="/scans/counterfit" element={<CounterfitScan />} />
              <Route path="/compliance" element={<Compliance />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#f9fafb',
                border: '1px solid #374151',
                borderRadius: '8px',
              },
            }}
          />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
