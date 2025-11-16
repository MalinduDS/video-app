
import React from 'react';
import { Filter } from '../types';

interface FilterStripProps {
  filters: Filter[];
  selectedFilter: Filter;
  onSelectFilter: (filter: Filter) => void;
}

const FilterStrip: React.FC<FilterStripProps> = ({ filters, selectedFilter, onSelectFilter }) => {
  const placeholderImageUrl = "https://picsum.photos/id/1062/100/100"; // A nice landscape for filter preview

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {filters.map(filter => (
        <div
          key={filter.name}
          className="flex flex-col items-center gap-2 cursor-pointer"
          onClick={() => onSelectFilter(filter)}
        >
          <div
            className={`w-20 h-20 rounded-md overflow-hidden border-2 ${
              selectedFilter.name === filter.name ? 'border-indigo-500' : 'border-transparent'
            } transition-all`}
          >
            <img
              src={placeholderImageUrl}
              alt={filter.name}
              className="w-full h-full object-cover"
              style={{ filter: filter.value }}
            />
          </div>
          <span className={`text-xs text-center w-20 break-words ${selectedFilter.name === filter.name ? 'text-indigo-400' : 'text-gray-400'}`}>
            {filter.name}
          </span>
        </div>
      ))}
    </div>
  );
};

export default FilterStrip;