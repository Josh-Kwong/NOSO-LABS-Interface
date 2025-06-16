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

const BrandsPage = ({ onSelectBrand }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Aggregate all products from all categories
  const products = useMemo(() => Object.values(allProductsData.products_by_category || {}).flat(), []);

  const normalizeBrand = (brand) => {
    if (!brand) return brand;
    const upper = brand.trim().toUpperCase();
    if (['GE', 'GE PROFILE', 'GE APPLIANCES'].includes(upper)) return 'GE';
    if ([
      'ALSETRIA',
      'IDEAL USA',
      'PUREPRO',
      'STATE',
      'BRYANT HEATING AND COOLING SYSTEMS'
    ].includes(upper)) return null;
    if (upper.startsWith('KEPLER')) return 'KEPLER';
    if (upper.startsWith('RUUD')) return 'RUUD';
    if (upper.startsWith('SAINT ROCH')) return 'SAINT ROCH';
    return upper;
  };

  // Extract all unique brands using the first 'brand' key found in each product
  const allBrands = useMemo(() => {
    const brandSet = new Set();
    products.forEach(product => {
      const brandKey = Object.keys(product).find(
        key => key.toLowerCase().includes('brand') && !headerValues.includes(product[key]) && typeof product[key] === 'string' && product[key].trim() !== ''
      );
      if (brandKey) {
        let brand = product[brandKey].trim();
        brand = normalizeBrand(brand);
        if (brand && !headerValues.includes(brand)) brandSet.add(brand);
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

  // All other brands, including most searched (so they appear in both sections)
  const otherBrands = useMemo(() => {
    return allBrands;
  }, [allBrands]);

  // Filter brands based on search term
  const filteredMostSearched = useMemo(() => {
    return mostSearchedBrands;
  }, [mostSearchedBrands]);

  const filteredOtherBrands = useMemo(() => {
    if (!searchTerm) return otherBrands;
    return otherBrands.filter(brand =>
      brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [otherBrands, searchTerm]);

  const handleBrandClick = (brandName) => {
    if (onSelectBrand) {
      onSelectBrand(brandName);
    }
  };

  const BrandCard = ({ brand }) => {
    // List of possible file extensions and patterns
    const filePatterns = [
      brand.toUpperCase().replace(/[^A-Z0-9]/g, '') + '.png',
      brand.toUpperCase().replace(/[^A-Z0-9]/g, '') + '.jpg',
      brand.toUpperCase().replace(/[^A-Z0-9]/g, '') + '.jpeg',
      brand.toUpperCase().replace(/[^A-Z0-9]/g, '') + '.webp',
      brand.toUpperCase().replace(/[^A-Z0-9]/g, '') + '.gif',
      brand.toUpperCase().replace(/[^A-Z0-9]/g, '') + '.svg.png',
      brand.replace(/[^A-Za-z0-9]/g, '_') + '.png',
      brand.replace(/[^A-Za-z0-9]/g, '_') + '.jpg',
      brand.replace(/[^A-Za-z0-9]/g, '_') + '.jpeg',
      brand.replace(/[^A-Za-z0-9]/g, '_') + '.webp',
      brand.replace(/[^A-Za-z0-9]/g, '_') + '.gif',
      brand.replace(/[^A-Za-z0-9]/g, '_') + '.svg.png',
      brand.toLowerCase().replace(/[^a-z0-9]/g, '') + '.png',
      brand.toLowerCase().replace(/[^a-z0-9]/g, '') + '.jpg',
      brand.toLowerCase().replace(/[^a-z0-9]/g, '') + '.jpeg',
      brand.toLowerCase().replace(/[^a-z0-9]/g, '') + '.webp',
      brand.toLowerCase().replace(/[^a-z0-9]/g, '') + '.gif',
      brand.toLowerCase().replace(/[^a-z0-9]/g, '') + '.svg.png',
    ];

    const [logoSrc, setLogoSrc] = useState(null);

    React.useEffect(() => {
      let found = false;
      let i = 0;
      const tryNext = () => {
        if (i >= filePatterns.length) {
          setLogoSrc(null);
          return;
        }
        const img = new window.Image();
        img.onload = () => {
          if (!found) {
            found = true;
            setLogoSrc(`/brand-logos/${filePatterns[i]}`);
          }
        };
        img.onerror = () => {
          i++;
          tryNext();
        };
        img.src = `/brand-logos/${filePatterns[i]}`;
      };
      tryNext();
      // eslint-disable-next-line
    }, [brand]);

    return (
      <button
        onClick={() => handleBrandClick(brand)}
        className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-blue-100 hover:bg-blue-50"
      >
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200 overflow-hidden">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={`${brand} logo`}
                className="object-contain w-full h-full"
              />
            ) : (
              <span className="text-xs text-gray-400 font-medium">LOGO</span>
            )}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 text-lg">{brand}</h3>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>
    );
  };

  // Calculate total products for display
  const totalProducts = useMemo(() => {
    return products.length;
  }, [products]);

  // Layer 1: Main Brands Page
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
        {!searchTerm && filteredMostSearched.length > 0 && (
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