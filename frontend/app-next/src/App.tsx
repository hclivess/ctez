import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Ovens from './pages/Ovens';
import Liquidations from './pages/Liquidations';
import Trade from './pages/Trade';
import Faq from './pages/Faq';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ovens" element={<Ovens />} />
        <Route path="/liquidations" element={<Liquidations />} />
        <Route path="/trade" element={<Trade />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
