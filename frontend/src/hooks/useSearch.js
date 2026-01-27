import { useState, useMemo } from 'react';

/**
 * useSearch Hook
 * Centralizes filtering logic for any array of objects.
 * @param {Array} data - The raw data array to filter.
 * @param {Array} searchFields - Keys in the object to search within.
 * @returns {Object} { searchTerm, setSearchTerm, filteredData }
 */
const useSearch = (data, searchFields = []) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return data;

        const search = searchTerm.toLowerCase();
        return data.filter(item => {
            return searchFields.some(field => {
                const value = item[field];
                return value && String(value).toLowerCase().includes(search);
            });
        });
    }, [data, searchTerm, searchFields]);

    return {
        searchTerm,
        setSearchTerm,
        filteredData
    };
};

export default useSearch;
