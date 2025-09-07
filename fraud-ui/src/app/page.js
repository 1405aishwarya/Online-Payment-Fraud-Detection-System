'use client';
import { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Home() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8765');

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Update transaction list (newest at top)
      setTransactions(prev => [data, ...prev]);

      // Show toast notification if fraud detected
      if (data.prediction === 1) {
        toast.error(
          `Fraud detected! Transaction ID: ${data.transaction.id}, Amount: ${data.transaction.amount}`
        );
      }
    };

    return () => socket.close();
  }, []);

  const totalTransactions = transactions.length;
  const totalFrauds = transactions.filter(tx => tx.prediction === 1).length;
  const fraudRate = totalTransactions > 0 ? ((totalFrauds / totalTransactions) * 100).toFixed(2) : 0;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Live Transactions</h1>

      {/* Fraud Summary Cards */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
          <h3>Total Transactions</h3>
          <p>{totalTransactions}</p>
        </div>
        <div style={{ padding: '10px', backgroundColor: '#ffebee', borderRadius: '8px' }}>
          <h3>Total Frauds</h3>
          <p>{totalFrauds}</p>
        </div>
        <div style={{ padding: '10px', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
          <h3>Fraud Rate</h3>
          <p>{fraudRate}%</p>
        </div>
      </div>

      {/* Transaction Table */}
      <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Step</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Old Balance Org</th>
            <th>New Balance Orig</th>
            <th>Old Balance Dest</th>
            <th>New Balance Dest</th>
            <th>Status</th>
            <th>Top SHAP Features</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const t = tx.transaction;  // transaction values sent from backend
            const topShap = tx.top_shap 
              ? Object.entries(tx.top_shap)
                  .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])) // sort by magnitude
                  .slice(0, 3) // take top 3 features
              : [];

            return (
              <tr key={t.id} style={{ backgroundColor: tx.prediction ? '#f8d7da' : '#d4edda' }}>
                <td>{t.id}</td>
                <td>{t.step}</td>
                <td>{t.type}</td>
                <td>{t.amount}</td>
                <td>{t.oldbalanceOrg}</td>
                <td>{t.newbalanceOrig}</td>
                <td>{t.oldbalanceDest}</td>
                <td>{t.newbalanceDest}</td>
                <td>{tx.prediction ? 'Fraud' : 'Safe'}</td>
                <td>
                  {topShap.map(([feature, value]) => (
                    <div key={feature}>
                      {feature}: {value.toFixed(2)}
                    </div>
                  ))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Toast container */}
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick />
    </div>
  );
}
