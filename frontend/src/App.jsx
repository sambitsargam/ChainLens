import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import ComparisonDashboard from './pages/ComparisonDashboard';
import TopicDetail from './pages/TopicDetail';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<ComparisonDashboard />} />
        <Route path="/topic/:topicName" element={<TopicDetail />} />
      </Routes>
    </Layout>
  );
}

export default App;
