import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./features/auth/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import AppRoutes from './routes';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
