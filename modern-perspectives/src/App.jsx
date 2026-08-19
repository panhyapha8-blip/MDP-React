import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingContext'; // match your filename
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ProfilePage from './pages/ProfilePage';
import CreateYourPerspective from './pages/CreateYourPerspective';
import Calendar from './pages/Calendar';
import Messages from './pages/Messages';
import './App.css';
import Perspective from "./pages/Perspective";
import DashboardPage from "./pages/DashboardPage";
import Setting from "./pages/Setting";

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/create-perspective" element={<CreateYourPerspective />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/perspective/:id" element={<Perspective />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/setting" element={<Setting />} />
          </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
}