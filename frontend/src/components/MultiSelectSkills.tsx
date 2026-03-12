import { useState, useEffect, useRef } from 'react';

interface MultiSelectSkillsProps {
  selectedSkills: string[];
  availableSkills: string[];
  onChange: (skills: string[]) => void;
  darkMode?: boolean;
}

export default function MultiSelectSkills({ 
  selectedSkills, 
  availableSkills, 
  onChange,
  darkMode = false 
}: MultiSelectSkillsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSkills = availableSkills.filter(skill =>
    skill.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      const newSkills = selectedSkills.filter(s => s !== skill);
      onChange(newSkills);
    } else {
      onChange([...selectedSkills, skill]);
    }
  };

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const skillsToToggle = searchTerm ? filteredSkills : availableSkills;
    const allFilteredSelected = skillsToToggle.every(skill => selectedSkills.includes(skill));
    
    if (allFilteredSelected) {
      onChange(selectedSkills.filter(s => !skillsToToggle.includes(s)));
    } else {
      const newSkills = [...new Set([...selectedSkills, ...skillsToToggle])];
      onChange(newSkills);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-md cursor-pointer ${
          darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm">
            {selectedSkills.length > 0 
              ? `${selectedSkills.length} skill(s) selected` 
              : 'Select skills...'}
          </span>
          <span>{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>

      {isOpen && (
        <div className={`absolute z-50 w-full mt-1 border rounded-md shadow-lg max-h-80 overflow-hidden ${
          darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
        }`}>
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded ${
                darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
              }`}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Select All Checkbox */}
          <label
            className={`flex items-center px-3 py-2 border-b font-semibold cursor-pointer ${
              darkMode ? 'bg-gray-600 border-gray-500 hover:bg-gray-500' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={filteredSkills.length > 0 && filteredSkills.every(skill => selectedSkills.includes(skill))}
              onChange={toggleAll}
              className="w-4 h-4 mr-3"
            />
            <span className="text-sm">
              All {searchTerm && `(${filteredSkills.length} filtered)`}
            </span>
          </label>
          
          <div className="overflow-y-auto max-h-60">
            {filteredSkills.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">No skills found</div>
            ) : (
              filteredSkills.map((skill) => (
                <label
                  key={skill}
                  className={`flex items-center px-3 py-2 cursor-pointer hover:bg-opacity-50 ${
                    darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSkills.includes(skill)}
                    onChange={() => toggleSkill(skill)}
                    className="w-4 h-4 mr-3"
                  />
                  <span className="text-sm">{skill}</span>
                </label>
              ))
            )}
          </div>
          <div className={`p-2 border-t flex justify-end ${
            darkMode ? 'border-gray-600' : 'border-gray-200'
          }`}>
            <button
              onClick={() => onChange(availableSkills)}
              className="text-xs text-blue-600 hover:underline"
            >
              Select All
            </button>
          </div>
        </div>
      )}

      {selectedSkills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedSkills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
            >
              {skill}
              <button
                onClick={() => toggleSkill(skill)}
                className="text-blue-600 hover:text-blue-800 font-bold"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
