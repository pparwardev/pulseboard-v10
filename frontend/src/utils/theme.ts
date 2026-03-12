export const cardClass = (darkMode: boolean) => 
  darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200';

export const inputClass = (darkMode: boolean) => 
  darkMode ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400' : 'bg-white text-gray-900 border-gray-300';

export const textClass = (darkMode: boolean) => 
  darkMode ? 'text-white' : 'text-gray-900';

export const mutedTextClass = (darkMode: boolean) => 
  darkMode ? 'text-gray-400' : 'text-gray-500';

export const bgClass = (darkMode: boolean) => 
  darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900';

export const buttonClass = (darkMode: boolean) => 
  darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white';

export const borderClass = (darkMode: boolean) => 
  darkMode ? 'border-gray-700' : 'border-gray-200';

export const labelClass = (darkMode: boolean) => 
  darkMode ? 'text-gray-300' : 'text-gray-700';
