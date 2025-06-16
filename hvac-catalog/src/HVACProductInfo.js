import React from 'react';
import { ChevronLeft, Thermometer, CheckCircle, XCircle, Info } from 'lucide-react';
import allProductsData from './all_products.json';

// Product Details Page Component
const ProductDetailsPage = ({ brand, category, model, onBack }) => {
  const [logoSrc, setLogoSrc] = React.useState(null);

  // Logo detection logic
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

  // Get the specific product data
  const productData = React.useMemo(() => {
    const allProducts = Object.values(allProductsData.products_by_category || {}).flat();
    // Find the product that matches the model
    return allProducts.find(product => {
      const modelFields = [
        'Outdoor Unit Model Number',
        'Indoor Unit Model Number',
        'Model Number'
      ];
      const productModelNumber = modelFields.find(field => product[field])
        ? product[modelFields.find(field => product[field])]
        : null;
      return productModelNumber === model.modelNumber;
    });
  }, [model]);

  if (!productData) {
    return (
      <div className="max-w-4xl mx-auto bg-gray-50 min-h-screen">
        <div className="bg-white p-6 shadow-sm">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Models</span>
          </button>
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Product details not found</p>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to format field names for display
  const formatFieldName = (fieldName) => {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Helper function to get field value with fallback
  const getFieldValue = (field) => {
    const value = productData[field];
    if (value === null || value === undefined || value === '') return 'Not specified';
    return value;
  };

  // Helper function to determine if a value is "good" for styling
  const isPositiveValue = (field, value) => {
    if (value === 'Not specified') return false;
    if (field.includes('Active') || field.includes('Status')) return value === 'Active';
    if (field.includes('ENERGY STAR') || field.includes('Tax Credit')) return value === 'Yes';
    return true;
  };

  // Organize fields into logical sections
  const fieldSections = {
    'Basic Information': [
      'AHRI Ref. #',
      'product_category',
      'Model Status',
      'Manufacturer Type'
    ],
    'Unit Details': [
      'Outdoor Unit Brand Name',
      'Outdoor Unit Series Name', 
      'Outdoor Unit Model Number',
      'Indoor Unit Brand Name',
      'Indoor Unit Model Number',
      'Furnace Model Number',
      'Mini/Multi-Split Indoor Unit Type'
    ],
    'Performance Specifications': [
      'Cooling Capacity (95F), btuh (Appendix M1) *',
      'EER2 (95F) (Appendix M1) *',
      'SEER2 (Appendix M1) *',
      'Heating Capacity (47F), btuh (Appendix M1) *',
      'HSPF2 (Region IV) (Appendix M1) *',
      'Heating Capacity (17F), btuh (Appendix M1)',
      'Heating Capacity (5F), btuh (Appendix M1)',
      'Heating COP (5F), btuh (Appendix M1)',
      'Output Heating Capacity, MBTUH *',
      'AFUE, % *',
      'Fan Energy Rating (FER), Watts/1000 cfm *'
    ],
    'Air Flow Specifications': [
      'Full-Load Cooling Air Volume Rate, scfm (Appendix M1)',
      'Full-Load Cooling Air Volume Rate, scfm (Appendix M)',
      'Intermediate Cooling Air Volume Rate, scfm (Appendix M)',
      'Minimum Cooling Air Volume Rate, scfm (Appendix M)'
    ],
    'System Configuration': [
      'AHRI Type',
      'Split or Packaged?',
      'Phase',
      'Refrigerant Type',
      'Fuel Type',
      'Configuration',
      'Furnace Type',
      'Designated Tested Combination?',
      'Mobile Home?',
      'Electronically Commutated Motor (ECM)'
    ],
    'Certifications & Ratings': [
      'CEE Tier',
      'ENERGY STAR ® Certified?',
      'ENERGY STAR ® Certified with Cold Climate Designation?',
      'Potential Eligibility for IRA Tax Credit',
      'Is Rerated'
    ],
    'Regional Information': [
      'Region',
      'Sold in?',
      'Sold In?'
    ]
  };

  const categoryName = typeof category === 'object' ? category.name : category;

  return (
    <div className="max-w-4xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white p-6 shadow-sm sticky top-0 z-10">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Models</span>
        </button>
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200 overflow-hidden flex-shrink-0">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={`${brand} logo`}
                className="object-contain w-full h-full"
              />
            ) : (
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Thermometer className="w-7 h-7 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{model.modelNumber}</h1>
            <p className="text-lg text-gray-600 mb-2">{brand} • {categoryName}</p>
            <div className="flex flex-wrap items-center gap-3">
              {model.coolingCapacity && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {parseInt(model.coolingCapacity).toLocaleString()} BTU/h
                </span>
              )}
              {model.efficiency && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {model.efficiency} {model.efficiency.toString().includes('.') ? 'SEER2/HSPF2' : 'AFUE'}
                </span>
              )}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                model.status === 'Active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {model.status === 'Active' ? (
                  <CheckCircle className="w-4 h-4 mr-1" />
                ) : (
                  <XCircle className="w-4 h-4 mr-1" />
                )}
                {model.status}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="p-6 space-y-6">
        {Object.entries(fieldSections).map(([sectionName, fields]) => {
          // Filter fields that exist in the product data
          const existingFields = fields.filter(field => 
            productData.hasOwnProperty(field) && 
            productData[field] !== null && 
            productData[field] !== undefined &&
            productData[field] !== ''
          );
          if (existingFields.length === 0) return null;
          return (
            <div key={sectionName} className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Info className="w-5 h-5 mr-2 text-blue-500" />
                  {sectionName}
                </h2>
              </div>
              <div className="p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {existingFields.map(field => {
                    const value = getFieldValue(field);
                    const isPositive = isPositiveValue(field, value);
                    return (
                      <div key={field} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-b-0">
                        <span className="text-sm font-medium text-gray-600 flex-1 pr-4">
                          {formatFieldName(field)}:
                        </span>
                        <span className={`text-sm font-semibold text-right flex-1 ${
                          value === 'Not specified' 
                            ? 'text-gray-400'
                            : isPositive 
                              ? 'text-gray-900'
                              : 'text-gray-700'
                        }`}>
                          {value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
        {/* Footer with AHRI Reference */}
        <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
          <div className="flex items-center">
            <Info className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-blue-900">AHRI Certified Product</p>
              <p className="text-sm text-blue-700">
                Reference #: {productData['AHRI Ref. #']} • 
                Data source: {productData.data_source || 'AHRI Directory'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;