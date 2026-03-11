import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import DriveBrowserPage from "./pages/DriveBrowserPage";
import ExtractionPage from "./pages/ExtractionPage";
import FeedbackPage from "./pages/FeedbackPage";
import FolderPickerPage from "./pages/FolderPickerPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthCallback from "./components/AuthCallback";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/oauth/callback" element={<AuthCallback />} />

      {/* Protected routes */}
      <Route
        path="/select-folder"
        element={
          <ProtectedRoute>
            <FolderPickerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/drive"
        element={
          <ProtectedRoute>
            <DriveBrowserPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/extraction/:fileId"
        element={
          <ProtectedRoute>
            <ExtractionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feedback"
        element={
          <ProtectedRoute>
            <FeedbackPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feedback/new"
        element={
          <ProtectedRoute>
            <FeedbackPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
