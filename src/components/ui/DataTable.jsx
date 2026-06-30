import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  Filter, 
  X 
} from 'lucide-react';

export function DataTable({ 
  columns, 
  data, 
  onRowClick, 
  selectedRowId, 
  idField = 'id',
  pageSize = 15,
  searchPlaceholder = 'Buscar en todos los campos...'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [columnFilters, setColumnFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilterDropdown, setActiveFilterDropdown] = useState(null);

  // Reset page when search or filters change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleColumnFilterChange = (columnKey, value) => {
    setColumnFilters(prev => {
      const updated = { ...prev };
      if (value === '' || value === '__all__') {
        delete updated[columnKey];
      } else {
        updated[columnKey] = value;
      }
      return updated;
    });
    setCurrentPage(1);
    setActiveFilterDropdown(null);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setColumnFilters({});
    setSortConfig({ key: null, direction: 'asc' });
    setCurrentPage(1);
  };

  // Get unique values for each column for the dropdown filter lists
  const getUniqueValues = (columnKey) => {
    const values = data.map(item => {
      const val = item[columnKey];
      return val === null || val === undefined ? '' : String(val);
    });
    return Array.from(new Set(values)).filter(val => val !== '').sort();
  };

  // Sorting handler
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
      key = null;
    }
    setSortConfig({ key, direction });
  };

  // Filtered & Sorted data
  const processedData = useMemo(() => {
    let result = [...data];

    // 1. Apply global search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(item => {
        return Object.values(item).some(val => 
          val !== null && val !== undefined && String(val).toLowerCase().includes(searchLower)
        );
      });
    }

    // 2. Apply column-specific filters
    Object.keys(columnFilters).forEach(columnKey => {
      const filterValue = columnFilters[columnKey];
      result = result.filter(item => {
        const itemVal = item[columnKey];
        const stringVal = itemVal === null || itemVal === undefined ? '' : String(itemVal);
        return stringVal === filterValue;
      });
    });

    // 3. Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        const strA = typeof valA === 'number' ? valA : String(valA).toLowerCase();
        const strB = typeof valB === 'number' ? valB : String(valB).toLowerCase();

        if (strA < strB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (strA > strB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, columnFilters, sortConfig]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(processedData.length / pageSize));
  
  // Guard current page
  const activePage = Math.min(currentPage, totalPages);
  
  const paginatedData = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, activePage, pageSize]);

  const hasActiveFilters = searchTerm !== '' || Object.keys(columnFilters).length > 0 || sortConfig.key !== null;

  return (
    <div className="flex flex-col space-y-4 w-full">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-zinc-950 dark:text-zinc-100 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 transition-colors shadow-sm cursor-pointer"
          >
            <X size={14} />
            Limpiar Filtros
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-x-auto relative">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-50/70 dark:bg-zinc-900/40 border-b border-zinc-100 dark:border-zinc-800/80 sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              {columns.map(col => (
                <th 
                  key={col.key} 
                  className={`px-6 py-4 font-semibold text-zinc-500 dark:text-zinc-400 select-none relative ${col.className || ''}`}
                >
                  <div className="flex items-center gap-2">
                    {/* Sort Header Label */}
                    {col.sortable !== false ? (
                      <button
                        onClick={() => requestSort(col.key)}
                        className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors focus:outline-none font-bold"
                      >
                        {col.label}
                        {sortConfig.key === col.key ? (
                          sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-blue-500" /> : <ArrowDown size={12} className="text-blue-500" />
                        ) : (
                          <ArrowUpDown size={12} className="text-zinc-400 dark:text-zinc-600 opacity-60" />
                        )}
                      </button>
                    ) : (
                      <span>{col.label}</span>
                    )}

                    {/* Column Dropdown Filter */}
                    {col.filterable !== false && (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveFilterDropdown(activeFilterDropdown === col.key ? null : col.key);
                          }}
                          className={`p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${columnFilters[col.key] ? 'text-blue-500' : 'text-zinc-400 opacity-60 hover:opacity-100'}`}
                        >
                          <Filter size={12} />
                        </button>

                        {activeFilterDropdown === col.key && (
                          <>
                            <div 
                              className="fixed inset-0 z-20" 
                              onClick={() => setActiveFilterDropdown(null)}
                            />
                            <div className="absolute left-0 mt-1.5 w-48 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg py-1 z-30 font-normal normal-case">
                              <button
                                onClick={() => handleColumnFilterChange(col.key, '__all__')}
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold"
                              >
                                Todos
                              </button>
                              <div className="border-t border-zinc-100 dark:border-zinc-800/80 my-1" />
                              <div className="max-h-48 overflow-y-auto">
                                {getUniqueValues(col.key).map(val => (
                                  <button
                                    key={val}
                                    onClick={() => handleColumnFilterChange(col.key, val)}
                                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center justify-between ${columnFilters[col.key] === val ? 'text-blue-500 font-semibold bg-blue-50/30 dark:bg-blue-900/10' : 'text-zinc-600 dark:text-zinc-400'}`}
                                  >
                                    <span className="truncate">{val}</span>
                                    {columnFilters[col.key] === val && <span className="text-[10px] bg-blue-500 text-white px-1 rounded">✓</span>}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, itemIdx) => {
                const isSelected = selectedRowId !== undefined && item[idField] === selectedRowId;
                return (
                  <tr
                    key={item[idField] || itemIdx}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`transition-colors cursor-pointer border-b border-zinc-100 dark:border-zinc-800/50 ${isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/40 dark:hover:bg-blue-950/30' : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-900/30 text-zinc-800 dark:text-zinc-200'}`}
                  >
                    {columns.map(col => {
                      const val = item[col.key];
                      return (
                        <td key={col.key} className={`px-6 py-3.5 ${col.cellClassName || ''}`}>
                          {col.render ? col.render(val, item) : (val === null || val === undefined ? 'N/A' : String(val))}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                  Ningún elemento coincide con los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2 py-1 text-xs">
        <div className="text-zinc-500 dark:text-zinc-400 font-medium">
          Mostrando <span className="font-bold text-zinc-800 dark:text-zinc-200">{processedData.length > 0 ? (activePage - 1) * pageSize + 1 : 0}</span> a{' '}
          <span className="font-bold text-zinc-800 dark:text-zinc-200">
            {Math.min(activePage * pageSize, processedData.length)}
          </span>{' '}
          de <span className="font-bold text-zinc-800 dark:text-zinc-200">{processedData.length}</span> registros
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={activePage === 1}
            className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={activePage === 1}
            className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          
          <span className="mx-2 text-zinc-500 dark:text-zinc-400">
            Página <span className="font-bold text-zinc-800 dark:text-zinc-200">{activePage}</span> de{' '}
            <span className="font-bold text-zinc-800 dark:text-zinc-200">{totalPages}</span>
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={activePage === totalPages}
            className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={activePage === totalPages}
            className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
