import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import RequestsPage from './pages/RequestsPage';
import NewRequestPage from './pages/NewRequestPage';
import EditRequestPage from './pages/EditRequestPage';
import ProposalPage from './pages/ProposalPage';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
        <Navbar />
        <ToastContainer position="top-right" autoClose={2500} hideProgressBar newestOnTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/new" element={<NewRequestPage />} />
          <Route path="/edit/:id" element={<EditRequestPage />} />
          <Route path="/:rfpId" element={<ProposalPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

