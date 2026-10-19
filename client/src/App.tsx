import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailsPage } from './pages/EventDetailsPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { TicketsPage } from './pages/TicketsPage';
import { QRScannerPage } from './pages/QRScannerPage';
import { OrganizerDashboardPage } from './pages/OrganizerDashboardPage';
import { CreateEventPage } from './pages/CreateEventPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { BecomeOrganizerPage } from './pages/BecomeOrganizerPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-[#09090F] text-[#F8FAFC]">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:id" element={<EventDetailsPage />} />
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />

                {/* Attendee Protected Routes */}
                <Route
                  path="/checkout/:eventId"
                  element={
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tickets"
                  element={
                    <ProtectedRoute>
                      <TicketsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/become-organizer"
                  element={<Navigate to="/auth/register?portal=organizer" replace />}
                />

                {/* Organizer & Admin Protected Routes */}
                <Route
                  path="/create-event"
                  element={
                    <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                      <CreateEventPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organizer"
                  element={
                    <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                      <OrganizerDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/scanner"
                  element={
                    <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                      <QRScannerPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Only Protected Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
            <Toaster position="top-right" richColors theme="dark" />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};


export default App;
