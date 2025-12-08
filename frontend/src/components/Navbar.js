import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>RFP System</div>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>Home</Link>
        <Link to="/requests" style={styles.link}>Requests</Link>
        <Link to="/new" style={styles.link}>New Request</Link>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    background: '#1f2937',
    color: 'white'
  },
  brand: { fontWeight: '700', fontSize: 18 },
  links: { display: 'flex', gap: 12 },
  link: { color: 'white', textDecoration: 'none' }
};
