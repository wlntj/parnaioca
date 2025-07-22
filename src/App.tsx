import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import TiposAcomodacao from './pages/TiposAcomodacao'
import Acomodacoes from './pages/Acomodacoes'
import Frigobar from './pages/Frigobar'
import Estacionamento from './pages/Estacionamento'
import CheckIn from './pages/CheckIn'
import Relatorios from './pages/Relatorios'
import Analytics from './pages/Analytics'
import Admin from './pages/Admin'
import LoadingSpinner from './components/UI/LoadingSpinner'
import './index.css'

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner text="Carregando..." />
  }

  return user ? <>{children}</> : <Navigate to="/login" />
}

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner text="Carregando..." />
  }

  return !user ? <>{children}</> : <Navigate to="/dashboard" />
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/clientes" element={
            <ProtectedRoute>
              <Clientes />
            </ProtectedRoute>
          } />
          <Route path="/tipos-acomodacao" element={
            <ProtectedRoute>
              <TiposAcomodacao />
            </ProtectedRoute>
          } />
          <Route path="/acomodacoes" element={
            <ProtectedRoute>
              <Acomodacoes />
            </ProtectedRoute>
          } />
          <Route path="/frigobar" element={
            <ProtectedRoute>
              <Frigobar />
            </ProtectedRoute>
          } />
          <Route path="/estacionamento" element={
            <ProtectedRoute>
              <Estacionamento />
            </ProtectedRoute>
          } />
          <Route path="/checkin" element={
            <ProtectedRoute>
              <CheckIn />
            </ProtectedRoute>
          } />
          <Route path="/relatorios" element={
            <ProtectedRoute>
              <Relatorios />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App