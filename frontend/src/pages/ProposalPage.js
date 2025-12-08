import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './ProposalPage.css';

function ProposalPage() {
    const [proposals, setProposals] = useState([]);
    const [evaluation, setEvaluation] = useState(null);
    const [evaluating, setEvaluating] = useState(false);
    const [loading, setLoading] = useState(false);
    const { rfpId } = useParams();
    
    useEffect(() => {
        async function fetchAndEvaluateProposals() {
            console.log("rfp id is", rfpId);
            try {
                const res = await axios.get(`http://localhost:5000/api/vendors/proposals/${rfpId}`);
                if (res.status !== 200) {
                    console.error('Failed to fetch proposals');
                    return;
                }
                setProposals(res.data);                
                if (res.data.length > 0) {
                    setEvaluating(true);
                    try {
                        await axios.post(`http://localhost:5000/api/vendors/evaluate/${rfpId}`);
                        console.log('Evaluation triggered-----------------------------------');
                    } catch (err) {
                        console.error('Evaluation trigger error:', err);
                    } finally {
                        setEvaluating(false);
                    }
                }
            } catch (err) {
                console.error('Fetch error:', err);
            }
        }
        
        fetchAndEvaluateProposals();
    }, [rfpId]);
    
    const getEvaluation = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/vendors/evaluation/${rfpId}`);
            console.log("data is ",res);
            if (res.data.evaluated) {
                setEvaluation(res.data.evaluation);
                console.log('Evaluation loaded');
            } else {
                alert('Evaluation not ready yet. Please wait a few seconds and try again.');
            }
        } catch (err) {
            console.error('Failed to load evaluation:', err);
        } finally {
            setLoading(false);
        }
    };


  return (
    <div className="proposal-page">
      {proposals && proposals.length > 0 ? (
        <div>
          <div className="page-header">
            <h2>Proposals for RFP {rfpId}</h2>
          </div>
          
          {evaluating && (
            <div className="evaluation-status">
              AI Evaluation in progress...
            </div>
          )}
          
          <button 
            onClick={getEvaluation} 
            disabled={loading || evaluating}
            className="eval-button"
          >
            {loading ? 'Loading...' : 'Show AI Evaluation Results'}
          </button>
          
          {evaluation && (
            <div className="evaluation-container">
              <h3>AI Evaluation Results</h3>
              
              <div className="categories-grid">
                <div className="category-section">
                  <h4>💵Best Price</h4>
                  {evaluation.best_price_top3?.map((item, idx) => (
                    <div key={idx} className={`ranking-card ${idx === 0 ? 'first-place' : ''}`}>
                      <p>
                        <span className={`ranking-number ${idx === 0 ? 'gold' : idx === 1 ? 'silver' : 'bronze'}`}>
                          {idx + 1}
                        </span>
                        <strong>Vendor:</strong> {item.proposal?.vendor_email}
                      </p>
                      <p><strong>Price:</strong> ${item.proposal?.extracted?.total_price}</p>
                      <p><strong>Reasoning:</strong> {item.reasoning}</p>
                    </div>
                  ))}
                </div>
                
                <div className="category-section">
                  <h4>🤝Best Warranty</h4>
                  {evaluation.best_warranty_top3?.map((item, idx) => (
                    <div key={idx} className={`ranking-card ${idx === 0 ? 'first-place' : ''}`}>
                      <p>
                        <span className={`ranking-number ${idx === 0 ? 'gold' : idx === 1 ? 'silver' : 'bronze'}`}>
                          {idx + 1}
                        </span>
                        <strong>Vendor:</strong> {item.proposal?.vendor_email}
                      </p>
                      <p><strong>Warranty:</strong> {item.proposal?.extracted?.warranty}</p>
                      <p><strong>Reasoning:</strong> {item.reasoning}</p>
                    </div>
                  ))}
                </div>
                
                <div className="category-section">
                  <h4>📦Best Delivery</h4>
                  {evaluation.best_delivery_top3?.map((item, idx) => (
                    <div key={idx} className={`ranking-card ${idx === 0 ? 'first-place' : ''}`}>
                      <p>
                        <span className={`ranking-number ${idx === 0 ? 'gold' : idx === 1 ? 'silver' : 'bronze'}`}>
                          {idx + 1}
                        </span>
                        <strong>Vendor:</strong> {item.proposal?.vendor_email}
                      </p>
                      <p><strong>Delivery:</strong> {item.proposal?.extracted?.delivery_time}</p>
                      <p><strong>Reasoning:</strong> {item.reasoning}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="category-section">
                <h4>🏆 Overall Best</h4>
                {evaluation.overall_best_top3?.map((item, idx) => (
                  <div key={idx} className={`ranking-card ${idx === 0 ? 'first-place' : ''}`}>
                    <p>
                      <span className={`ranking-number ${idx === 0 ? 'gold' : idx === 1 ? 'silver' : 'bronze'}`}>
                        {idx + 1}
                      </span>
                      <strong>Vendor:</strong> {item.proposal?.vendor_email}
                    </p>
                    <p><strong>Reasoning:</strong> {item.reasoning}</p>
                    {item.scores && (
                      <div className="scores-section">
                        <div className="score-item">
                          💰 Price: <span className="score-value">{item.scores.price_score}</span>
                        </div>
                        <div className="score-item">
                          🛡️ Warranty: <span className="score-value">{item.scores.warranty_score}</span>
                        </div>
                        <div className="score-item">
                          🚚 Delivery: <span className="score-value">{item.scores.delivery_score}</span>
                        </div>
                        <div className="score-item">
                          ⭐ Overall: <span className="score-value">{item.scores.overall_score}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <h3>All Proposals</h3>
          <div className="proposals-list">
            {proposals.map((proposal) => (
              <div key={proposal._id} className="proposal-card">
                  <p><strong>Vendor ID:</strong> {proposal.vendor_id}</p>
                  <p><strong>Price per piece:</strong> {proposal.extracted?.price_per_piece || 'N/A'}</p>
                  <p><strong>Total Price:</strong> {proposal.extracted?.total_price || 'N/A'}</p>
                  <p><strong>Quantity:</strong> {proposal.extracted?.quantity || 'N/A'}</p>
                  <p><strong>Terms:</strong> {proposal.extracted?.terms || 'N/A'}</p>
                  <p><strong>Warranty:</strong> {proposal.extracted?.warranty || 'N/A'}</p>
                  <p><strong>Delivery Details:</strong> {proposal.extracted?.delivery_time || 'N/A'}</p>
                  <p><strong>Offer Received At:</strong> {proposal.received_at}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p>No proposals found for this RFP.</p>
      )}
    </div>
  )
}

export default ProposalPage