import { useState, useRef, useEffect } from 'react';
import { COUNTRIES, searchCountries } from '../data/countries';
import './CountrySelector.css';

interface CountrySelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

const CountrySelector = ({ 
  value, 
  onChange, 
  placeholder = "Search for your country...", 
  required = false 
}: CountrySelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCountries, setFilteredCountries] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter countries based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchCountries(searchQuery);
      setFilteredCountries(results);
    } else {
      setFilteredCountries(COUNTRIES.slice(0, 20)); // Show first 20 by default
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

  // Handle country selection
  const handleCountrySelect = (country: string) => {
    onChange(country);
    setSearchQuery(country);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Handle input focus
  const handleFocus = () => {
    setIsOpen(true);
    if (!searchQuery) {
      setFilteredCountries(COUNTRIES.slice(0, 20));
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
          prev < filteredCountries.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredCountries.length) {
          handleCountrySelect(filteredCountries[highlightedIndex]);
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
    <div className="country-selector" ref={dropdownRef}>
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
        className="country-input"
        autoComplete="off"
      />
      
      {isOpen && (
        <div className="country-dropdown">
          {filteredCountries.length > 0 ? (
            <ul className="country-list">
              {filteredCountries.map((country, index) => (
                <li
                  key={country}
                  className={`country-item ${
                    index === highlightedIndex ? 'highlighted' : ''
                  }`}
                  onClick={() => handleCountrySelect(country)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {country}
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-results">
              No countries found for "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CountrySelector;
