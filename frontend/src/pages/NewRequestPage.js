import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import RFPForm from '../components/RFPForm';
import './NewRequestPage.css';

export default function NewRequestPage() {
  const navigate = useNavigate();

  async function handleSave(payloads) {
    try {
      const res = await axios.post('http://localhost:5000/api/client/request', payloads);
      if (res.status === 201 || res.status === 200) {
        const count = Array.isArray(payloads) ? payloads.length : 1;
        toast.success(`${count} RFP request(s) created.`);
        navigate('/requests');
      } else {
        toast.error('Failed to create request.');
      }
    } catch (err) {
      console.error('Create error:', err);
      toast.error('Failed to create request.');
    }
  }

  return (
    <div className="new-request-page">
      <div className="new-request-container">
        <div className="new-request-header">
          <h2>New RFP Request</h2>
          <p>Create a new Request for Proposal and send it to vendors</p>
        </div>
        <RFPForm onSave={handleSave}/>
      </div>
    </div>
  );
}
