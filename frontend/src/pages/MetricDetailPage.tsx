import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

export default function MetricDetailPage() {
  const { memberId, metricName } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const periodStart = searchParams.get('start') || '';
  const periodEnd = searchParams.get('end') || '';

  useEffect(() => {
    fetchMetricCases();
  }, [memberId, metricName]);

  const fetchMetricCases = async () => {
    try {
      const res = await api.get(
        `/api/metric-cases/${memberId}/${metricName}?period_start=${periodStart}&period_end=${periodEnd}`
      );
      setData(res.data);
    } catch (error) {
      console.error('Failed to load metric cases:', error);
      setData({ metric_name: metricName, cases: [] });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <button
          onClick={() => navigate(`/my-performance/${memberId}`)}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          ← Back to Performance
        </button>
        <p className="text-center text-gray-500">Unable to load metric data</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <button
        onClick={() => navigate(`/my-performance/${memberId}`)}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
      >
        ← Back to Performance
      </button>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 text-center">{data.metric_name}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {data.cases.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No case data available for this period</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Case ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Detail</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.cases.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 font-medium">{c.case_number}</td>
                    <td className="px-4 py-4">{c.date} - Value: {c.metric_value}</td>
                    <td className="px-4 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Completed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
