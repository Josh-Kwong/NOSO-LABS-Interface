import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, Thermometer, Filter } from 'lucide-react';
import allProductsData from './all_products.json';

const headerValues = [
  'Outdoor Unit Brand Name',
  'Indoor Unit Brand Name',
  'Brand Name',
  '',
  null,
  undefined
];

const BrandsPage = ({ onSelectBrand, onSelectModel }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState('brands'); // 'brands' or 'models'

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

  // Filter brands based on search term
  const filteredBrands = useMemo(() => {
    if (!searchTerm) return allBrands;
    const searchLower = searchTerm.toLowerCase();
    return allBrands.filter(brand => 
      brand.toLowerCase().includes(searchLower)
    );
  }, [allBrands, searchTerm]);

  // Filter models based on search term
  const filteredModels = useMemo(() => {
    if (!searchTerm || searchMode !== 'models') return [];
    const searchLower = searchTerm.toLowerCase();
    
    return products.filter(product => {
      // Check model numbers first (highest priority)
      const modelFields = [
        'Outdoor Unit Model Number',
        'Indoor Unit Model Number',
        'Model Number',
        'Furnace Model Number'
      ];
      
      const hasMatchingModel = modelFields.some(field => {
        const modelNumber = product[field];
        return modelNumber && modelNumber.toLowerCase().includes(searchLower);
      });
      
      if (hasMatchingModel) return true;

      // Check other relevant fields
      const otherFields = [
        'Outdoor Unit Series Name',
        'Indoor Unit Series Name',
        'Series Name',
        'product_category'
      ];

      return otherFields.some(field => {
        const value = product[field];
        return value && value.toLowerCase().includes(searchLower);
      });
    });
  }, [products, searchTerm, searchMode]);

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

  const handleBrandClick = (brand) => {
    onSelectBrand(brand);
  };

  const handleModelClick = (model) => {
    // Find the brand for this model
    const brandFields = [
      'Outdoor Unit Brand Name',
      'Indoor Unit Brand Name',
      'Brand Name'
    ];
    const field = brandFields.find(field => model[field]);
    const brand = field ? model[field] : undefined;

    // Find the category for this model
    const categoryFields = [
      'product_category',
      'Outdoor Unit Series Name',
      'Indoor Unit Series Name',
      'Series Name'
    ];
    const categoryField = categoryFields.find(field => model[field]);
    const category = categoryField ? model[categoryField] : undefined;

    // Ensure modelNumber property exists for ProductDetailsPage lookup
    const modelNumber = model['Outdoor Unit Model Number'] || model['Indoor Unit Model Number'] || model['Model Number'] || model['Furnace Model Number'];
    const modelForDetails = { ...model, modelNumber };

    if (onSelectModel) {
      onSelectModel(modelForDetails, brand, category);
    } else if (brand) {
      onSelectBrand(brand);
    }
  };

  const BrandCard = ({ brand }) => {
    // Manual override for problematic logos
    const manualLogoMap = {
      'A. O. SMITH': '/brand-logos/AOSmith.png',
      'ADVANTAGE': '/brand-logos/Advantage.jpg',
      'ALLIED': '/brand-logos/Allied.png',
      'ARCOAIRE': '/brand-logos/Arcoaire.jpeg',
      'ARISTON': '/brand-logos/Ariston.jpg',
      'BLUERIDGE': '/brand-logos/Blueridge.png',
      'BOSCH': '/brand-logos/Bosch.png',
      'FUJITSU': '/brand-logos/Fujitsu.png',
      'GRIDLESS': '/brand-logos/Gridless.png',
      'LAARS': '/brand-logos/Laars.jpeg'
    };

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
      // First check manual override
      if (manualLogoMap[brand]) {
        const img = new window.Image();
        img.onload = () => setLogoSrc(manualLogoMap[brand]);
        img.onerror = () => {
          console.log(`Manual override failed for ${brand}, trying auto patterns`);
          tryAutoPatterns();
        };
        img.src = manualLogoMap[brand];
        return;
      }

      // Fall back to automatic pattern matching
      tryAutoPatterns();

      function tryAutoPatterns() {
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
      }
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
          <h1 className="text-2xl font-semibold text-gray-900">HVAC Catalog</h1>
        </div>
        {/* Search Bar */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSearchMode('brands')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                searchMode === 'brands'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Search Brands
            </button>
            <button
              onClick={() => setSearchMode('models')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                searchMode === 'models'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Search Models
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={searchMode === 'brands' ? "Search brands..." : "Search model numbers..."}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="p-6">
        {searchMode === 'brands' ? (
          <>
            {/* Most Searched Brands */}
            {!searchTerm && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Most Searched Brands</h2>
                <div className="grid gap-3">
                  {mostSearchedBrandNames
                    .filter(brand => allBrands.includes(brand))
                    .map(brand => (
                      <BrandCard key={brand} brand={brand} />
                    ))}
                </div>
              </div>
            )}

            {/* All Brands */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {searchTerm ? 'Search Results' : 'All Brands'}
              </h2>
              <div className="grid gap-3">
                {filteredBrands.map(brand => (
                  <BrandCard key={brand} brand={brand} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {searchTerm ? 'Search Results' : 'Search for a model'}
            </h2>
            <div className="grid gap-3">
              {filteredModels.map((model, index) => {
                const modelNumber = model['Outdoor Unit Model Number'] || 
                                 model['Indoor Unit Model Number'] || 
                                 model['Model Number'] || 
                                 model['Furnace Model Number'];
                const brand = model['Outdoor Unit Brand Name'] || 
                            model['Indoor Unit Brand Name'] || 
                            model['Brand Name'];
                
                return (
                  <button
                    key={`${modelNumber}-${index}`}
                    onClick={() => handleModelClick(model)}
                    className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-blue-100 hover:bg-blue-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-left">
                        <h3 className="font-medium text-gray-900 text-sm">
                          {modelNumber}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">{brand}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                );
              })}
            </div>
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