import React, { useState, useEffect } from 'react';
import './RequestForm.css';

export default function RequestForm({ onSave, initial = {} }) {
  const [title, setTitle] = useState(initial.title || '');
  const [description, setDescription] = useState(initial.description || '');
  const [budget, setBudget] = useState(initial.budget || '');
  const [delivery, setDelivery] = useState(initial.delivery_time || '');
  const [payment, setPayment] = useState(initial.payment_terms || '');
  const [warranty, setWarranty] = useState(initial.warranty || '');

  useEffect(() => {
    setTitle(initial.title || '');
    setDescription(initial.description || '');
    setBudget(initial.budget || '');
    setDelivery(initial.delivery_time || '');
    setPayment(initial.payment_terms || '');
    setWarranty(initial.warranty || '');
  }, [initial]);

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      id: initial.id || `r-${Date.now()}`,
      title: title || 'Untitled RFP',
      description,
      budget: budget ? Number(budget) : null,
      delivery_time: delivery,
      payment_terms: payment,
      warranty,
      created_at: initial.created_at || new Date().toISOString()
    };
    onSave(payload);
  }

  return (
    <form className="request-form" onSubmit={handleSubmit}>
      <label>Title
        <input value={title} onChange={e => setTitle(e.target.value)} />
      </label>
      <label>Description
        <textarea value={description} onChange={e => setDescription(e.target.value)} />
      </label>
      <label>Budget
        <input value={budget} onChange={e => setBudget(e.target.value)} />
      </label>
      <label>Delivery Time
        <input value={delivery} onChange={e => setDelivery(e.target.value)} />
      </label>
      <label>Payment Terms
        <input value={payment} onChange={e => setPayment(e.target.value)} />
      </label>
      <label>Warranty
        <input value={warranty} onChange={e => setWarranty(e.target.value)} />
      </label>
      <div className="request-form-actions">
        <button type="submit">Save</button>
      </div>
    </form>
  );
}

