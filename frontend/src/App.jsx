import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import ComparisonDashboard from './pages/ComparisonDashboard';
import TopicDetail from './pages/TopicDetail';
import PremiumPage from './pages/PremiumPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<ComparisonDashboard />} />
        <Route path="/comparison" element={<ComparisonDashboard />} />
        <Route path="/premium" element={<PremiumPage />} />
        <Route path="/topic/:topicName" element={<TopicDetail />} />
      </Routes>
    </Layout>
  );
}

export default App;
