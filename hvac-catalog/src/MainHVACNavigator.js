import React, { useState } from 'react';
import BrandsPage from './BrandsPage';
import BrandCategoriesPage from './BrandCategoriesPage';
import BrandModelsPage from './BrandModelsPage';
import ProductDetailsPage from './HVACProductInfo';

const MainHVACNavigator = () => {
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);

  if (selectedBrand && selectedCategory && selectedModel) {
    return (
      <ProductDetailsPage
        brand={selectedBrand}
        category={selectedCategory}
        model={selectedModel}
        onBack={() => setSelectedModel(null)}
      />
    );
  }

  if (selectedBrand && selectedCategory) {
    return (
      <BrandModelsPage
        brand={selectedBrand}
        category={selectedCategory}
        onSelectModel={setSelectedModel}
        onBack={() => setSelectedCategory(null)}
      />
    );
  }

  if (selectedBrand) {
    return (
      <BrandCategoriesPage
        brand={selectedBrand}
        onSelectCategory={setSelectedCategory}
        onBack={() => setSelectedBrand(null)}
      />
    );
  }

  return <BrandsPage onSelectBrand={setSelectedBrand} />;
};

export default MainHVACNavigator; 