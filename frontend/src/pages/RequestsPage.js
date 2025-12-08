import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import RequestList from '../components/RequestList';
import './RequestsPage.css';

export default function RequestsPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function getAllRequests() {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get('http://localhost:5000/api/client/');
        const data = res.data;
        if (mounted) setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    getAllRequests();
  }, []);

  function handleEdit(r) {
    const requestId = r.id || r._id;
    if (requestId) navigate(`/edit/${requestId}`);
  }

  async function handleDelete(id) {
    try {
      const res = await axios.delete(`http://localhost:5000/api/client/${id}`);
      if (res.status !== 200) {
        toast.error('Delete failed.');
        return;
      }
      setItems((prev) => prev.filter((item) => (item.id || item._id) !== id));
      toast.success('Request deleted.');
    } catch (err) {
      console.error('Failed to delete request with id', id, err);
      toast.error('Delete failed.');
    }
  }

  if (loading) return (
    <div className="requests-page">
      <div className="requests-loading">Loading requests</div>
    </div>
  );
  
  if (error) return (
    <div className="requests-page">
      <div className="requests-error">Error loading requests: {error}</div>
    </div>
  );
  
  if (!items || items.length === 0) return (
    <div className="requests-page">
      <div className="requests-empty">
        <div className="requests-empty-icon">📋</div>
        <div className="requests-empty-text">No requests yet</div>
        <Link to="/new" className="requests-empty-button">Create Your First RFP</Link>
      </div>
    </div>
  );

  return (
    <div className="requests-page">
      <div className="requests-container">
        <div className="requests-header">
          <h2>Your RFP Requests</h2>
          <div className="requests-header-actions">
            <Link to="/new" className="requests-create-button">+ Create New RFP</Link>
          </div>
        </div>
        <RequestList items={items} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  );
}
