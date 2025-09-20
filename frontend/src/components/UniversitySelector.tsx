import { useState, useRef, useEffect } from 'react';
import { US_UNIVERSITIES, searchUniversities } from '../data/universities';
import './UniversitySelector.css';

interface UniversitySelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

const UniversitySelector = ({ 
  value, 
  onChange, 
  placeholder = "Search for your university...", 
  required = false 
}: UniversitySelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUniversities, setFilteredUniversities] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter universities based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchUniversities(searchQuery);
      setFilteredUniversities(results);
    } else {
      setFilteredUniversities(US_UNIVERSITIES.slice(0, 20)); // Show first 20 by default
    }
    setHighlightedIndex(-1);
  }, [searchQuery]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onChange(query);
    setIsOpen(true);
  };

  // Handle university selection
  const handleUniversitySelect = (university: string) => {
    onChange(university);
    setSearchQuery(university);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Handle input focus
  const handleFocus = () => {
    setIsOpen(true);
    if (!searchQuery) {
      setFilteredUniversities(US_UNIVERSITIES.slice(0, 20));
    }
  };

  // Handle input blur
  const handleBlur = (e: React.FocusEvent) => {
    // Delay closing to allow for click events on dropdown items
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
      }
    }, 150);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredUniversities.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredUniversities.length) {
          handleUniversitySelect(filteredUniversities[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="university-selector" ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        className="university-input"
        autoComplete="off"
      />
      
      {isOpen && (
        <div className="university-dropdown">
          {filteredUniversities.length > 0 ? (
            <ul className="university-list">
              {filteredUniversities.map((university, index) => (
                <li
                  key={university}
                  className={`university-item ${
                    index === highlightedIndex ? 'highlighted' : ''
                  }`}
                  onClick={() => handleUniversitySelect(university)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {university}
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-results">
              No universities found for "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UniversitySelector;
