import React from 'react';
import { ChevronLeft, ChevronRight, Thermometer } from 'lucide-react';
import allProductsData from './all_products.json';

const BrandCategoriesPage = ({ brand, onSelectCategory, onBack, selectedCategory }) => {
  const [logoSrc, setLogoSrc] = React.useState(null);

  // Helper function to normalize brand names for comparison
  const normalizeBrand = (brandName) => {
    if (!brandName) return '';
    return brandName.trim().toUpperCase();
  };

  // Logo detection logic (same as in BrandsPage)
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

  // Get all products for this brand
  const products = React.useMemo(() => {
    const allProducts = Object.values(allProductsData.products_by_category || {}).flat();
    return allProducts.filter(product => {
      // Check multiple possible brand field names
      const brandFields = [
        'Outdoor Unit Brand Name',
        'Indoor Unit Brand Name', 
        'Brand Name'
      ];
      return brandFields.some(field => {
        const productBrand = product[field];
        if (!productBrand) return false;
        // More flexible brand matching
        const normalizedProductBrand = normalizeBrand(productBrand);
        const normalizedSearchBrand = normalizeBrand(brand);
        return normalizedProductBrand === normalizedSearchBrand;
      });
    });
  }, [brand]);

  // Extract unique categories and series with counts
  const categoriesAndSeries = React.useMemo(() => {
    const categoryMap = new Map();
    products.forEach(product => {
      // Get the main product category
      const category = product.product_category || 'Unknown Category';
      // Get series name if available
      const seriesFields = [
        'Outdoor Unit Series Name',
        'Indoor Unit Series Name',
        'Series Name'
      ];
      const series = seriesFields.find(field => product[field])
        ? product[seriesFields.find(field => product[field])]
        : null;
      // If we have a series, group by series under the category
      if (series) {
        const key = `${category} - ${series}`;
        categoryMap.set(key, {
          displayName: series,
          category: category,
          type: 'series',
          count: (categoryMap.get(key)?.count || 0) + 1
        });
      } else {
        // If no series, just use the category
        categoryMap.set(category, {
          displayName: category,
          category: category,
          type: 'category',
          count: (categoryMap.get(category)?.count || 0) + 1
        });
      }
    });
    const result = Array.from(categoryMap.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.displayName.localeCompare(b.displayName);
      });
    return result;
  }, [products, brand]);

  if (products.length === 0) {
    return (
      <div className="max-w-2xl mx-auto bg-gray-50 min-h-screen">
        <div className="bg-white p-6 shadow-sm">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Brands</span>
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Thermometer className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">{brand}</h1>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found for {brand}</p>
            <p className="text-gray-400 text-sm mt-2">This brand may not have any products in our current catalog.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleCategorySelect = (item) => {
    // Pass both the display name and additional context to parent
    onSelectCategory({
      name: item.displayName,
      category: item.category,
      type: item.type,
      key: item.key
    });
  };

  // Group items by main category for better organization
  const groupedItems = categoriesAndSeries.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-2xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white p-6 shadow-sm sticky top-0 z-10">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Brands</span>
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
          <h1 className="text-2xl font-semibold text-gray-900">{brand}</h1>
        </div>
        <p className="text-gray-600">
          {products.length} products across {Object.keys(groupedItems).length} categories
        </p>
      </div>

      {/* Content */}
      <div className="p-6">
        {Object.entries(groupedItems).map(([categoryName, items]) => (
          <div key={categoryName} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
              {categoryName}
            </h2>
            <div className="grid gap-3">
              {items.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleCategorySelect(item)}
                  className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-blue-200 hover:bg-blue-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900">
                        {item.displayName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {item.count} {item.count === 1 ? 'product' : 'products'}
                        {item.type === 'series' && ' • Series'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Summary */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Brand Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Total Products:</span>
                <span className="font-medium text-blue-900 ml-2">{products.length}</span>
              </div>
              <div>
                <span className="text-blue-700">Categories:</span>
                <span className="font-medium text-blue-900 ml-2">{Object.keys(groupedItems).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandCategoriesPage;