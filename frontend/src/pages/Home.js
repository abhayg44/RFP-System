import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <div className="home-page">
      <div className="home-container">
        <h1 className="home-title">RFP Dashboard</h1>
        <p className="home-subtitle">Welcome to your Request for Proposal management system. Streamline your procurement process with AI-powered evaluation.</p>
        
        <div className="home-features">
          <div className="home-feature-card">
            <h3 className="home-feature-title">Create RFPs</h3>
          </div>
          
          <div className="home-feature-card">
            <h3 className="home-feature-title">AI Evaluation</h3>
          </div>
          
          <div className="home-feature-card">
            <h3 className="home-feature-title">Track Progress</h3>
          </div>
        </div>
        
        <div className="home-cta">
          <Link to="/new" className="home-cta-button primary">Create New RFP</Link>
          <Link to="/requests" className="home-cta-button secondary">View All Requests</Link>
        </div>
      </div>
    </div>
  );
}
