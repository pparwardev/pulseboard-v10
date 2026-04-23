import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function OTMonthlyPrompt() {
  const [show, setShow] = useState(false);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/ot/monthly-ot-check').then(res => {
      if (res.data.show_prompt) {
        setMonth(res.data.month);
        setYear(res.data.year);
        setShow(true);
      }
    }).catch(() => {});
  }, []);

  const handleNoOT = async () => {
    setLoading(true);
    try {
      await api.post('/api/ot/no-ot-this-month');
      setShow(false);
    } catch {} finally { setLoading(false); }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        <div className="text-5xl mb-4">⏰</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">OT Submission Reminder</h2>
        <p className="text-gray-600 mb-6">
          Did you work any overtime in <span className="font-bold text-indigo-600">{month} {year}</span>?
          Please submit your OT or confirm no OT was done.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => { setShow(false); navigate('/ot'); }}
            className="w-full py-3 text-white rounded-xl font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}
          >
            Submit OT Now →
          </button>
          <button
            onClick={handleNoOT}
            disabled={loading}
            className="w-full py-3 border-2 border-gray-300 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'No OT Done This Month'}
          </button>
        </div>
      </div>
    </div>
  );
}
