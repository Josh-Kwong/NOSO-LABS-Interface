import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, Thermometer } from 'lucide-react';
import allProductsData from './all_products.json';

const headerValues = [
  'Outdoor Unit Brand Name',
  'Indoor Unit Brand Name',
  'Brand Name',
  '',
  null,
  undefined
];

const BrandsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Aggregate all products from all categories
  const products = useMemo(() => Object.values(allProductsData.products_by_category || {}).flat(), []);

  // Extract all unique brands using the first 'brand' key found in each product
  const allBrands = useMemo(() => {
    const brandSet = new Set();
    products.forEach(product => {
      const brandKey = Object.keys(product).find(
        key => key.toLowerCase().includes('brand') && !headerValues.includes(product[key]) && typeof product[key] === 'string' && product[key].trim() !== ''
      );
      if (brandKey) {
        const brand = product[brandKey].trim();
        if (!headerValues.includes(brand)) brandSet.add(brand);
      }
    });
    return Array.from(brandSet).sort((a, b) => a.localeCompare(b));
  }, [products]);

  // Most searched brands (hardcoded as requested)
  const mostSearchedBrandNames = [
    'LENNOX',
    'CARRIER',
    'TRANE',
    'GOODMAN',
    'YORK',
    'RHEEM',
    'BRYANT'
  ];

  // Filter and order most searched brands if they exist in allBrands
  const mostSearchedBrands = useMemo(() => {
    return mostSearchedBrandNames
      .map(name => allBrands.find(brand => brand.toUpperCase() === name))
      .filter(Boolean);
  }, [allBrands]);

  // All other brands, excluding most searched
  const otherBrands = useMemo(() => {
    return allBrands.filter(brand => !mostSearchedBrandNames.includes(brand.toUpperCase()));
  }, [allBrands]);

  // Filter brands based on search term
  const filteredMostSearched = useMemo(() => {
    if (!searchTerm) return mostSearchedBrands;
    return mostSearchedBrands.filter(brand =>
      brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [mostSearchedBrands, searchTerm]);

  const filteredOtherBrands = useMemo(() => {
    if (!searchTerm) return otherBrands;
    return otherBrands.filter(brand =>
      brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [otherBrands, searchTerm]);

  const handleBrandClick = (brandName) => {
    console.log(`Clicked on brand: ${brandName}`);
    // TODO: Navigate to products page when ready
  };

  const BrandCard = ({ brand }) => (
    <button
      onClick={() => handleBrandClick(brand)}
      className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-blue-100 hover:bg-blue-50"
    >
      <div className="flex items-center space-x-4">
        {/* Empty space for brand logo */}
        <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
          <span className="text-xs text-gray-400 font-medium">LOGO</span>
        </div>
        <div className="text-left">
          <h3 className="font-semibold text-gray-900 text-lg">{brand}</h3>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </button>
  );

  // Calculate total products for display
  const totalProducts = useMemo(() => {
    return products.length;
  }, [products]);

  return (
    <div className="max-w-2xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white p-6 shadow-sm sticky top-0 z-10">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Thermometer className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">HVAC Catalog</h1>
        </div>
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search brands..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      {/* Content */}
      <div className="p-6">
        {/* Most Searched Brands Section */}
        {filteredMostSearched.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-blue-600 mb-4">Most Searched Brands</h2>
            <div className="grid gap-4">
              {filteredMostSearched.map((brand) => (
                <BrandCard key={brand} brand={brand} />
              ))}
            </div>
          </div>
        )}
        {/* All Brands Section */}
        {filteredOtherBrands.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-blue-600 mb-4">All Brands</h2>
            <div className="grid gap-4">
              {filteredOtherBrands.map((brand) => (
                <BrandCard key={brand} brand={brand} />
              ))}
            </div>
          </div>
        )}
        {/* No Results */}
        {searchTerm && filteredMostSearched.length === 0 && filteredOtherBrands.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No brands found for "{searchTerm}"</p>
          </div>
        )}
        {/* Total Count */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            {allBrands.length} total brands • {totalProducts} total products
          </p>
        </div>
      </div>
    </div>
  );
};

export default BrandsPage;
