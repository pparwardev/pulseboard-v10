import { useState, useEffect, useRef } from 'react';

interface MultiSelectMarketplaceProps {
  selected: string[];
  onChange: (values: string[]) => void;
  darkMode?: boolean;
}

const MARKETPLACE_OPTIONS = [
  { group: 'EMEA Region', items: ['AE', 'DE', 'EG', 'ES', 'FR', 'IT', 'NL', 'PL', 'SA', 'SE', 'TR', 'UK'] },
  { group: 'Asia-Pacific Region', items: ['AU', 'SG', 'TH', 'VN'] },
  { group: 'India', items: ['IN'] },
  { group: 'Americas', items: ['BR', 'CA', 'MX', 'US'] },
];

const LABELS: Record<string, string> = {
  AE: 'AE – United Arab Emirates', DE: 'DE – Germany', EG: 'EG – Egypt', ES: 'ES – Spain',
  FR: 'FR – France', IT: 'IT – Italy', NL: 'NL – Netherlands', PL: 'PL – Poland',
  SA: 'SA – Saudi Arabia', SE: 'SE – Sweden', TR: 'TR – Turkey', UK: 'UK – United Kingdom',
  AU: 'AU – Australia', SG: 'SG – Singapore', TH: 'TH – Thailand', VN: 'VN – Vietnam',
  IN: 'IN – India',
  BR: 'BR – Brazil', CA: 'CA – Canada', MX: 'MX – Mexico', US: 'US – United States',
};

export default function MultiSelectMarketplace({ selected, onChange, darkMode = false }: MultiSelectMarketplaceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (code: string) => {
    onChange(selected.includes(code) ? selected.filter(s => s !== code) : [...selected, code]);
  };

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-md cursor-pointer ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm">
            {selected.length > 0 ? selected.join(', ') : 'Select marketplaces...'}
          </span>
          <span>{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>

      {isOpen && (
        <div className={`absolute z-50 w-full mt-1 border rounded-md shadow-lg max-h-72 overflow-y-auto ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
          {MARKETPLACE_OPTIONS.map(({ group, items }) => (
            <div key={group}>
              <div className={`px-3 py-1 text-xs font-bold uppercase ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{group}</div>
              {items.map(code => (
                <label key={code} className={`flex items-center px-3 py-2 cursor-pointer ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`}>
                  <input type="checkbox" checked={selected.includes(code)} onChange={() => toggle(code)} className="w-4 h-4 mr-3" />
                  <span className="text-sm">{LABELS[code]}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      )}

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {selected.map(code => (
            <span key={code} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
              {code}
              <button onClick={() => toggle(code)} className="font-bold hover:text-blue-900">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
