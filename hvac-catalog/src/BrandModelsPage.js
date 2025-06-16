import React from 'react';
import { ChevronLeft, ChevronRight, Thermometer } from 'lucide-react';
import allProductsData from './all_products.json';

const BrandModelsPage = ({ brand, category, onSelectModel, onBack }) => {
  const [logoSrc, setLogoSrc] = React.useState(null);

  // Helper function to normalize brand names for comparison
  const normalizeBrand = (brandName) => {
    if (!brandName) return '';
    return brandName.trim().toUpperCase();
  };

  // Logo detection logic (same as in other components)
  React.useEffect(() => {
    if (!brand) {
      setLogoSrc(null);
      return;
    }

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
  }, [brand]);

  // Get all products for this brand and category
  const products = React.useMemo(() => {
    const allProducts = Object.values(allProductsData.products_by_category || {}).flat();
    
    return allProducts.filter(product => {
      // Check multiple possible brand field names
      const brandFields = [
        'Outdoor Unit Brand Name',
        'Indoor Unit Brand Name', 
        'Brand Name'
      ];
      
      const matchesBrand = brandFields.some(field => {
        const productBrand = product[field];
        return productBrand && normalizeBrand(productBrand) === normalizeBrand(brand);
      });

      if (!matchesBrand) return false;

      // Check if it matches the category (could be a series or category)
      const seriesFields = [
        'Outdoor Unit Series Name',
        'Indoor Unit Series Name',
        'Series Name'
      ];
      
      const productCategory = product.product_category;
      const productSeries = seriesFields.find(field => product[field])
        ? product[seriesFields.find(field => product[field])]
        : null;

      // Match either by series name or category name
      const matchesCategory = 
        (productSeries && productSeries === category.name) ||
        (productCategory && productCategory === category.name) ||
        (productSeries && productSeries === category) ||
        (productCategory && productCategory === category);

      return matchesCategory;
    });
  }, [brand, category]);

  // Extract unique models with additional info
  const models = React.useMemo(() => {
    const modelMap = new Map();
    
    products.forEach(product => {
      // Get model number from various possible fields
      const modelFields = [
        'Outdoor Unit Model Number',
        'Indoor Unit Model Number',
        'Model Number'
      ];
      
      const modelNumber = modelFields.find(field => product[field])
        ? product[modelFields.find(field => product[field])]
        : null;

      if (modelNumber && !modelMap.has(modelNumber)) {
        modelMap.set(modelNumber, {
          modelNumber,
          // Add some basic specs for preview
          coolingCapacity: product['Cooling Capacity (95F), btuh (Appendix M1) *'] || 
                          product['Output Heating Capacity, MBTUH *'] || null,
          efficiency: product['SEER2 (Appendix M1) *'] || 
                     product['AFUE, % *'] || 
                     product['HSPF2 (Region IV) (Appendix M1) *'] || null,
          status: product['Model Status'] || 'Unknown'
        });
      }
    });

    return Array.from(modelMap.values()).sort((a, b) => 
      a.modelNumber.localeCompare(b.modelNumber)
    );
  }, [products]);

  if (models.length === 0) {
    return (
      <div className="max-w-2xl mx-auto bg-gray-50 min-h-screen">
        <div className="bg-white p-6 shadow-sm">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Categories</span>
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200 overflow-hidden">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt={`${brand} logo`}
                  className="object-contain w-full h-full"
                />
              ) : (
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Thermometer className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{brand}</h1>
              <p className="text-gray-600">{typeof category === 'object' ? category.name : category}</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No models found</p>
            <p className="text-gray-400 text-sm mt-2">
              This category may not have any models in our current catalog.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const categoryName = typeof category === 'object' ? category.name : category;

  return (
    <div className="max-w-2xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white p-6 shadow-sm sticky top-0 z-10">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Categories</span>
        </button>
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200 overflow-hidden">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={`${brand} logo`}
                className="object-contain w-full h-full"
              />
            ) : (
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Thermometer className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{brand}</h1>
            <p className="text-gray-600">{categoryName}</p>
          </div>
        </div>
        <p className="text-gray-600">
          {models.length} {models.length === 1 ? 'model' : 'models'} available
        </p>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid gap-3">
          {models.map((model) => (
            <button
              key={model.modelNumber}
              onClick={() => onSelectModel(model)}
              className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="text-left">
                  <h3 className="font-medium text-gray-900 text-sm">
                    {model.modelNumber}
                  </h3>
                  <div className="flex items-center space-x-4 mt-1">
                    {model.coolingCapacity && (
                      <span className="text-xs text-gray-500">
                        {parseInt(model.coolingCapacity).toLocaleString()} BTU/h
                      </span>
                    )}
                    {model.efficiency && (
                      <span className="text-xs text-gray-500">
                        {model.efficiency} {model.efficiency.toString().includes('.') ? 'SEER2/HSPF2' : 'AFUE'}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      model.status === 'Active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {model.status}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Category Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Total Models:</span>
                <span className="font-medium text-blue-900 ml-2">{models.length}</span>
              </div>
              <div>
                <span className="text-blue-700">Active Models:</span>
                <span className="font-medium text-blue-900 ml-2">
                  {models.filter(m => m.status === 'Active').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandModelsPage;