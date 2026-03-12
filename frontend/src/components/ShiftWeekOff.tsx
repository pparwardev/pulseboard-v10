import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const DAY_LABELS = ['S','M','T','W','T','F','S'];

function fmt24to12(t: string) {
  if (!t) return '--:--';
  const [h, m] = t.split(':').map(Number);
  return `${h > 12 ? h - 12 : h || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

interface Props {
  initialShiftStart?: string;
  initialShiftEnd?: string;
  initialWeekOff?: string;
  theme?: 'light' | 'dark';
  onSave?: () => void;
}

export default function ShiftWeekOff({ initialShiftStart, initialShiftEnd, initialWeekOff, theme = 'light', onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [shiftStart, setShiftStart] = useState(initialShiftStart || '');
  const [shiftEnd, setShiftEnd] = useState(initialShiftEnd || '');
  const [weekOff, setWeekOff] = useState<number[]>(initialWeekOff ? initialWeekOff.split(',').map(Number) : []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialShiftStart) setShiftStart(initialShiftStart);
    if (initialShiftEnd) setShiftEnd(initialShiftEnd);
    if (initialWeekOff) setWeekOff(initialWeekOff.split(',').map(Number));
  }, [initialShiftStart, initialShiftEnd, initialWeekOff]);

  const toggleDay = (d: number) => setWeekOff(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/api/user-preferences/shift-weekoff', {
        shift_start: shiftStart, shift_end: shiftEnd, week_off: weekOff.join(','),
      });
      setEditing(false);
      toast.success('Updated!');
      onSave?.();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const isLight = theme === 'light';

  if (editing) {
    return (
      <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 shadow-lg border border-gray-200">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🕐</span>
          <input type="time" value={shiftStart} onChange={e => setShiftStart(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1 w-24 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50" />
          <span className="text-gray-400 text-xs">–</span>
          <input type="time" value={shiftEnd} onChange={e => setShiftEnd(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1 w-24 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50" />
        </div>
        <div className="w-px h-6 bg-gray-200" />
        <div className="flex items-center gap-1">
          <span className="text-sm">📅</span>
          {DAY_LABELS.map((l, i) => (
            <button key={i} onClick={() => toggleDay(i)}
              className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all ${
                weekOff.includes(i) ? 'bg-indigo-600 text-white shadow-md scale-110' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>{l}</button>
          ))}
        </div>
        <button onClick={save} disabled={saving}
          className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-sm hover:bg-green-600 transition shadow">✓</button>
        <button onClick={() => setEditing(false)}
          className="w-7 h-7 rounded-full bg-gray-400 text-white flex items-center justify-center text-sm hover:bg-gray-500 transition shadow">✕</button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-2.5 cursor-pointer transition-all ${
        isLight
          ? 'bg-white/90 border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300'
          : 'bg-white/15 border border-white/10 hover:bg-white/25'
      }`}
      onClick={() => setEditing(true)}>
      <div className="flex items-center gap-1.5">
        <span className="text-sm">🕐</span>
        <span className={`text-xs font-semibold ${isLight ? 'text-gray-700' : 'text-white'}`}>
          {shiftStart && shiftEnd ? `${fmt24to12(shiftStart)} – ${fmt24to12(shiftEnd)}` : 'Set Shift'}
        </span>
      </div>
      <div className={`w-px h-5 ${isLight ? 'bg-gray-300' : 'bg-white/20'}`} />
      <div className="flex items-center gap-1">
        <span className="text-sm">📅</span>
        {DAY_LABELS.map((l, i) => (
          <div key={i} className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center ${
            weekOff.includes(i)
              ? isLight ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600'
              : isLight ? 'bg-gray-100 text-gray-400' : 'bg-white/15 text-white/40'
          }`}>{l}</div>
        ))}
      </div>
      <span className={`text-sm ${isLight ? 'text-gray-400' : 'text-white/40'}`}>✏️</span>
    </div>
  );
}
