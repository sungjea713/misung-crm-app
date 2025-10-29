import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import type { ConstructionSite } from '../types';

interface SiteSearchInputProps {
  onSelect: (site: ConstructionSite) => void;
  disabled?: boolean;
}

export function SiteSearchInput({ onSelect, disabled = false }: SiteSearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ConstructionSite[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 검색 실행
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('crm_token');
        const response = await fetch(
          `/api/construction-sites/search?q=${encodeURIComponent(query)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        if (data.success) {
          setResults(data.data || []);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Error searching sites:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (site: ConstructionSite) => {
    onSelect(site);
    setQuery(`${site.cms} - ${site.site_name}`);
    setResults([]); // 검색 결과 초기화
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-semibold text-white mb-2">
        현장 검색 *
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={20} className={query ? "text-primary" : "text-gray-text"} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="CMS코드, 현장명, 주소, 고객사명으로 검색"
          disabled={disabled}
          className="w-full pl-12 pr-12 py-3 bg-bg-darker text-white border-2 border-gray-border rounded-lg
                   placeholder:text-gray-text
                   focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-30
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-4 flex items-center group"
          >
            <div className="p-1 rounded-full hover:bg-gray-border transition-colors">
              <X size={18} className="text-gray-text group-hover:text-white transition-colors" />
            </div>
          </button>
        )}
        {loading && (
          <div className="absolute inset-y-0 right-12 flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* 검색 결과 드롭다운 */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-bg-card border-2 border-primary border-opacity-30 rounded-xl shadow-2xl max-h-96 overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                <span className="text-gray-text">검색 중...</span>
              </div>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <div className="sticky top-0 bg-bg-darker px-4 py-2 border-b border-gray-border">
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                  {results.length}개의 현장 발견
                </span>
              </div>
              <ul className="divide-y divide-gray-border">
                {results.map((site, index) => (
                  <li key={site.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(site)}
                      className="w-full px-5 py-4 text-left hover:bg-primary transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-primary bg-opacity-20 text-primary text-sm font-bold group-hover:bg-white group-hover:text-primary transition-colors">
                              {site.cms}
                            </span>
                            <span className="text-white font-semibold">
                              {site.site_name}
                            </span>
                          </div>
                          <div className="text-sm text-gray-text group-hover:text-white flex items-center space-x-1 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{site.site_address}</span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs">
                            <span className="flex items-center space-x-1 text-gray-text group-hover:text-white transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span className="font-medium">고객사:</span>
                              <span>{site.client || '-'}</span>
                            </span>
                            <span className="flex items-center space-x-1 text-gray-text group-hover:text-white transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="font-medium">영업:</span>
                              <span>{site.sales_manager || '-'}</span>
                            </span>
                            <span className="flex items-center space-x-1 text-gray-text group-hover:text-white transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="font-medium">시공:</span>
                              <span>{site.construction_manager || '-'}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="mt-2 text-xs text-gray-text flex items-center space-x-1">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>최소 2자 이상 입력하세요. 최대 10개 결과가 표시됩니다.</span>
      </p>
    </div>
  );
}