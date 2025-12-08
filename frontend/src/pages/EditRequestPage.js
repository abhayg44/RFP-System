import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import RequestForm from '../components/RequestForm';
import './EditRequestPage.css';

export default function EditRequestPage() {
    const navigate = useNavigate();
    const { id } = useParams();
  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    delivery_time: '',
    payment_terms: '',
    warranty: '',
    client_email: '',
    vendor_email: '',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function getData(id) {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/client/${id}`);
      const data = res.data;

      if (!data) {
        throw new Error("Request not found");
      }

      setForm({
        title: data.title || '',
        description: data.description || '',
        budget: data.budget || '',
        delivery_time: data.delivery_time || '',
        payment_terms: data.payment_terms || '',
        warranty: data.warranty || '',
        client_email: data.client_email || '',
        vendor_email: data.vendor_email || ''
      });

    } catch (err) {
      console.error("Error fetching request:", err);
      setError("Failed to load request.");
    }

    setLoading(false);
  }

  useEffect(() => {
    getData(id);
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  async function handleEdit(payload) {
    if (payload.title==form.title && payload.description==form.description &&
        payload.budget==form.budget && payload.delivery_time==form.delivery_time &&
        payload.payment_terms==form.payment_terms && payload.warranty==form.warranty) {
          setError("No changes made to update.");
          return;
        }
    try {
      const res = await axios.put(
        `http://localhost:5000/api/client/${id}`,
        payload
      );

      if (res.status !== 200) {
        toast.error('Error updating request');
        return;
      }

      toast.success('Request updated.');
      navigate('/requests');

    } catch (err) {
      console.error("Update error:", err);
      toast.error('Update failed');
    }
  }

  if (loading) return <div className="edit-request-page"><div className="edit-request-loading">Loading</div></div>;

  return (
    <div className="edit-request-page">
      <div className="edit-request-container">
        <div className="edit-request-header">
          <h2>Edit Request</h2>
        </div>
        {error && <div className="edit-request-error">{error}</div>}
        <RequestForm initial={form} onSave={handleEdit} onChange={handleChange} />
      </div>
    </div>
  );
}
