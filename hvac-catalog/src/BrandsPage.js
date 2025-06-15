import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, Thermometer } from 'lucide-react';
import acProductsData from './ac_products.json';

const BrandsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Extract brands dynamically from your real JSON data
  const allBrands = useMemo(() => {
    const brandMap = {};
    
    // Access the products array from your JSON structure
    const products = acProductsData.products || acProductsData;
    
    products.forEach(product => {
      const brandName = product.outdoor_unit?.brand_name;
      if (!brandName) return;
      
      if (!brandMap[brandName]) {
        brandMap[brandName] = {
          name: brandName,
          productCount: 0,
          series: new Set()
        };
      }
      brandMap[brandName].productCount++;
      if (product.outdoor_unit?.series_name) {
        brandMap[brandName].series.add(product.outdoor_unit.series_name);
      }
    });
    
    return Object.values(brandMap).map(brand => ({
      ...brand,
      seriesCount: brand.series.size
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Most searched brands (hardcoded as requested)
  const mostSearchedBrandNames = ['CARRIER', 'TRANE', 'GOODMAN', 'YORK', 'LENNOX', 'RHEEM', 'BRYANT'];
  
  const mostSearchedBrands = useMemo(() => {
    return mostSearchedBrandNames
      .map(name => allBrands.find(brand => brand.name === name))
      .filter(Boolean);
  }, [allBrands]);

  const otherBrands = useMemo(() => {
    return allBrands.filter(brand => !mostSearchedBrandNames.includes(brand.name));
  }, [allBrands]);

  // Filter brands based on search term
  const filteredMostSearched = useMemo(() => {
    if (!searchTerm) return mostSearchedBrands;
    return mostSearchedBrands.filter(brand =>
      brand.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [mostSearchedBrands, searchTerm]);

  const filteredOtherBrands = useMemo(() => {
    if (!searchTerm) return otherBrands;
    return otherBrands.filter(brand =>
      brand.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [otherBrands, searchTerm]);

  const handleBrandClick = (brandName) => {
    console.log(`Clicked on brand: ${brandName}`);
    // TODO: Navigate to products page when ready
  };

  const BrandCard = ({ brand }) => (
    <button
      onClick={() => handleBrandClick(brand.name)}
      className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-gray-200"
    >
      <div className="flex items-center space-x-3">
        {/* Empty space for brand logo - you'll add PNG images here */}
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
          <span className="text-xs text-gray-400 font-medium">LOGO</span>
        </div>
        <div className="text-left">
          <h3 className="font-semibold text-gray-900 text-lg">{brand.name}</h3>
          <p className="text-sm text-gray-500">
            {brand.productCount} models • {brand.seriesCount} series
          </p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </button>
  );

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <Thermometer className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">HVAC Catalog</h1>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search Models and Parts"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Most Searched Brands Section */}
        {filteredMostSearched.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-blue-600 mb-4">Most Searched Brands</h2>
            <div className="space-y-3">
              {filteredMostSearched.map((brand) => (
                <BrandCard key={brand.name} brand={brand} />
              ))}
            </div>
          </div>
        )}

        {/* All Brands Section */}
        {filteredOtherBrands.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-blue-600 mb-4">All Brands</h2>
            <div className="space-y-3">
              {filteredOtherBrands.map((brand) => (
                <BrandCard key={brand.name} brand={brand} />
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {searchTerm && filteredMostSearched.length === 0 && filteredOtherBrands.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No brands found for "{searchTerm}"</p>
          </div>
        )}

        {/* Total Count */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            {allBrands.length} total brands • {(acProductsData.products || acProductsData).length} total products
          </p>
        </div>
      </div>
    </div>
  );
};

export default BrandsPage;
