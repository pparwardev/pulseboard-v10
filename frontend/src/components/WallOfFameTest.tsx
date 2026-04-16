import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

// Simple test component for Wall of Fame
export default function WallOfFameTest() {
  const [status, setStatus] = useState('Testing...');
  const [apiStatus, setApiStatus] = useState('Checking API...');

  useEffect(() => {
    testWallOfFame();
  }, []);

  const testWallOfFame = async () => {
    try {
      // Test API connection
      const response = await api.get('/api/wall/posts');
      setApiStatus('✅ API Connected');
      setStatus('✅ Wall of Fame is working!');
    } catch (error: any) {
      if (error.response?.status === 401) {
        setApiStatus('✅ API Endpoint exists (needs auth)');
        setStatus('✅ Wall of Fame API is configured correctly');
      } else if (error.response?.status === 404) {
        setApiStatus('❌ API Endpoint not found');
        setStatus('❌ Wall of Fame API is missing');
      } else {
        setApiStatus(`❌ API Error: ${error.message}`);
        setStatus('❌ Wall of Fame has issues');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          🧪 Wall of Fame Test
        </h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">API Status:</h3>
            <p className="text-sm">{apiStatus}</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Overall Status:</h3>
            <p className="text-sm">{status}</p>
          </div>
          
          <button 
            onClick={testWallOfFame}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            🔄 Test Again
          </button>
          
          <div className="text-xs text-gray-500 mt-4">
            <p>This is a diagnostic component to test Wall of Fame functionality.</p>
            <p>If you see this page, the frontend routing is working.</p>
          </div>
        </div>
      </div>
    </div>
  );
}