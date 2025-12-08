import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import RequestItem from './RequestItem';
import './RequestList.css';

export default function RequestList({ items, onEdit, onDelete }) {
    console.log("items are ",items);
  return (
    <div className="request-list">
      {items.map((r) => (
        <RequestItem key={r._id} r={r} onEdit={onEdit} onDelete={onDelete}/>
      ))}
    </div>
  );
}
