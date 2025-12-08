import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './RequestItem.css';

export default function RequestItem({ r, onEdit, onDelete }) {
    const requestId = r.id || r._id;

    function handleEdit() {
      if (onEdit) onEdit({ ...r, id: requestId });
    }

    function handleDelete() {
      if (onDelete) onDelete(requestId);
    }
  return (
    <div className="request-item">
      <Link to={`/${requestId}`} className="request-item-link">
        <div className="request-item-header">
          <div className="request-item-title">{r.title}</div>
          <div className="request-item-meta">Budget: {r.budget ?? 'Not specified'} • Delivery: {r.delivery_time || 'N/A'}</div>
          <div className="request-item-meta">Payment: {r.payment_terms || 'N/A'} • Warranty: {r.warranty || 'N/A'}</div>
          <div className="request-item-description">{r.description}</div>
        </div>
      </Link>
      <div className="request-item-actions">
        <button onClick={handleEdit}>Edit</button>
        <button onClick={handleDelete}>Delete</button>
      </div>
    </div>
  );
}


