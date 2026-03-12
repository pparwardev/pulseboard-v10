import { useState, useEffect } from 'react';

interface WMQYTimelineFilterProps {
  selectedPeriod?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  selectedSubfilter?: number;
  selectedYear?: number;
  onPeriodChange?: (period: 'weekly' | 'monthly' | 'quarterly' | 'yearly') => void;
  onSubfilterChange?: (subfilter: number) => void;
  onYearChange?: (year: number) => void;
  onFilterChange?: (period: string, subFilter: number, year: number) => void;
  defaultPeriod?: string;
  defaultYear?: number;
}

const getCurrentWeek = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.ceil((daysSinceStart + start.getDay() + 1) / 7);
};

export default function WMQYTimelineFilter({ 
  selectedPeriod, selectedSubfilter, selectedYear,
  onPeriodChange, onSubfilterChange, onYearChange,
  onFilterChange, defaultPeriod = 'W', defaultYear = new Date().getFullYear()
}: WMQYTimelineFilterProps) {
  const [period, setPeriod] = useState(defaultPeriod);
  const [year, setYear] = useState(defaultYear);
  const [subFilter, setSubFilter] = useState(getCurrentWeek());

  useEffect(() => {
    if (selectedPeriod === 'weekly' && !selectedSubfilter) onSubfilterChange?.(getCurrentWeek());
  }, []);

  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i);
  
  const getSubFilterOptions = () => {
    const cp = selectedPeriod ? (selectedPeriod === 'weekly' ? 'W' : selectedPeriod === 'monthly' ? 'M' : selectedPeriod === 'quarterly' ? 'Q' : 'Y') : period;
    if (cp === 'W') return Array.from({length: 52}, (_, i) => ({value: i + 1, label: `Week ${i + 1}`}));
    if (cp === 'M') return [
      {value: 1, label: 'January'}, {value: 2, label: 'February'}, {value: 3, label: 'March'},
      {value: 4, label: 'April'}, {value: 5, label: 'May'}, {value: 6, label: 'June'},
      {value: 7, label: 'July'}, {value: 8, label: 'August'}, {value: 9, label: 'September'},
      {value: 10, label: 'October'}, {value: 11, label: 'November'}, {value: 12, label: 'December'}
    ];
    if (cp === 'Q') return [
      {value: 1, label: 'Q1 (Jan-Mar)'}, {value: 2, label: 'Q2 (Apr-Jun)'},
      {value: 3, label: 'Q3 (Jul-Sep)'}, {value: 4, label: 'Q4 (Oct-Dec)'}
    ];
    return [];
  };

  const handlePeriodChange = (np: string) => {
    const mapped = np === 'W' ? 'weekly' : np === 'M' ? 'monthly' : np === 'Q' ? 'quarterly' : 'yearly';
    const defaultSub = np === 'W' ? getCurrentWeek() : np === 'M' ? new Date().getMonth() + 1 : 1;
    if (onPeriodChange) { onPeriodChange(mapped as any); onSubfilterChange?.(defaultSub); }
    else { setPeriod(np); setSubFilter(defaultSub); onFilterChange?.(np, defaultSub, year); }
  };

  const handleSubFilterChange = (v: number) => {
    if (onSubfilterChange) onSubfilterChange(v);
    else { setSubFilter(v); onFilterChange?.(period, v, year); }
  };

  const handleYearChange = (v: number) => {
    if (onYearChange) onYearChange(v);
    else { setYear(v); onFilterChange?.(period, subFilter, v); }
  };

  const cp = selectedPeriod ? (selectedPeriod === 'weekly' ? 'W' : selectedPeriod === 'monthly' ? 'M' : selectedPeriod === 'quarterly' ? 'Q' : 'Y') : period;
  const csf = selectedSubfilter ?? subFilter;
  const cy = selectedYear ?? year;

  return (
    <div className="flex gap-2">
      <select value={cp} onChange={e => handlePeriodChange(e.target.value)} className="px-4 py-2 border rounded-lg bg-white shadow-sm">
        <option value="W">Weekly</option><option value="M">Monthly</option><option value="Q">Quarterly</option><option value="Y">Yearly</option>
      </select>
      {cp !== 'Y' && (
        <select value={csf} onChange={e => handleSubFilterChange(parseInt(e.target.value))} className="px-4 py-2 border rounded-lg bg-white shadow-sm">
          {getSubFilterOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      )}
      <select value={cy} onChange={e => handleYearChange(parseInt(e.target.value))} className="px-4 py-2 border rounded-lg bg-white shadow-sm">
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}
