import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { store } from '@/store';
import {
  MainLayout,
  HomePage,
  ArchivePage,
  ReportPage,
  SettingsPage,
  AgentChatPage,
  LoginPage,
  RegisterPage,
} from '@/pages';
import { ErrorBoundary } from '@/components/common';
import { useAppSelector } from '@/store/hooks';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#3B82F6',
            colorSuccess: '#10B981',
            colorWarning: '#F59E0B',
            colorError: '#EF4444',
            colorInfo: '#6366F1',
            borderRadius: 8,
            fontFamily: "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
          },
        }}
      >
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<HomePage />} />
              <Route path="archive" element={<ArchivePage />} />
              <Route path="report" element={
                <ErrorBoundary>
                  <ReportPage />
                </ErrorBoundary>
              } />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="agent" element={<AgentChatPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </Provider>
  );
};

export default App;
