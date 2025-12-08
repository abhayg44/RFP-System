import React, { useState } from 'react';
import './RFPForm.css';

export default function RFPForm({ onSave, initial = {} }) {
  const [text, setText] = useState(initial.text || '');
  const [clientEmail, setClientEmail] = useState(initial.client_email || '');
  const [vendorEmails, setVendorEmails] = useState([initial.vendor_email || '']);

  function addVendorEmail() {
    setVendorEmails([...vendorEmails, '']);
  }

  function removeVendorEmail(index) {
    setVendorEmails(vendorEmails.filter((_, i) => i !== index));
  }

  function updateVendorEmail(index, value) {
    const updated = [...vendorEmails];
    updated[index] = value;
    setVendorEmails(updated);
  }

  function handleSubmit(e) {
    e.preventDefault();
    
    const payloads = vendorEmails
      .filter(email => email.trim() !== '')
      .map(vendor_email => ({
        text,
        client_email: clientEmail,
        vendor_email
      }));
    
    console.log("payloads are", payloads);
    onSave(payloads);
  }

  return (
    <form className="rfp-form" onSubmit={handleSubmit}>
      <label>
        Request Details
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Describe your RFP requirements (budget, delivery time, warranty, etc.)"
          rows={6}
          required
        />
      </label>
      <label>
        Client Email
        <input
          type="email"
          value={clientEmail}
          onChange={e => setClientEmail(e.target.value)}
          placeholder="your-email@example.com"
          required
        />
      </label>
      <label>
        Vendor Emails
        <div className="vendor-emails-container">
          {vendorEmails.map((email, index) => (
            <div key={index} className="vendor-email-row">
              <input
                type="email"
                value={email}
                onChange={e => updateVendorEmail(index, e.target.value)}
                placeholder="vendor-email@example.com"
                required
              />
              {vendorEmails.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVendorEmail(index)}
                  title="Remove vendor"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="add-vendor-button"
            onClick={addVendorEmail}
            title="Add another vendor"
          >
            + Add Vendor
          </button>
        </div>
      </label>
      <div className="rfp-form-actions">
        <button type="submit">Submit RFP</button>
      </div>
    </form>
  );
}

