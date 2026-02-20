import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import VerifyPage from "./pages/VerifyPage";
import OTPPage from "./pages/OTPPage";
import BookPage from "./pages/BookPage";
import SorryPage from "./pages/SorryPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/otp" element={<OTPPage />} />
        <Route path="/sorry" element={<SorryPage />} />

        {/* Protected route — requires valid JWT */}
        <Route
          path="/book"
          element={
            <ProtectedRoute>
              <BookPage />
            </ProtectedRoute>
          }
        />

        {/* Redirect root → /verify */}
        <Route path="/" element={<Navigate to="/verify" replace />} />

        {/* Catch-all → /verify */}
        <Route path="*" element={<Navigate to="/verify" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
