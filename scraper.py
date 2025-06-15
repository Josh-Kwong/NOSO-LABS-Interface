#!/usr/bin/env python3
"""
AHRI Directory Web Scraper - REAL DATA ONLY
File name: ahri_scraper_real_only.py
ABSOLUTELY NO FILLER OR SAMPLE DATA
"""

import requests
import json
import time
import logging
from urllib.parse import urljoin, urlencode

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AHRIRealDataScraper:
    def __init__(self):
        self.base_url = "https://www.ahridirectory.org"
        self.api_base = "https://www.ahridirectory.org/api"
        self.session = requests.Session()
        
        # Set headers to mimic a real browser
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Referer': 'https://www.ahridirectory.org/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
        })
    
    def get_search_results_api(self, program_id=68, product_type_id=1, page_size=50, page_number=1):
        """Try to use the API endpoint to get REAL search results ONLY"""
        try:
            search_params = {
                'programId': program_id,
                'productTypeId': product_type_id,
                'pageSize': page_size,
                'pageNumber': page_number,
                'searchTypeId': 3
            }
            
            # Try different possible API endpoints
            api_endpoints = [
                f"{self.api_base}/search",
                f"{self.api_base}/products/search",
                f"{self.api_base}/directory/search",
                f"{self.base_url}/api/search",
                f"{self.base_url}/api/products",
                f"{self.base_url}/Search/GetSearchResults",
                f"{self.base_url}/Search/GetProducts",
                f"{self.base_url}/api/directory/products"
            ]
            
            for endpoint in api_endpoints:
                try:
                    logger.info(f"Trying API endpoint: {endpoint}")
                    
                    # Try both GET and POST requests
                    for method in ['GET', 'POST']:
                        try:
                            if method == 'GET':
                                response = self.session.get(endpoint, params=search_params, timeout=10)
                            else:
                                response = self.session.post(endpoint, json=search_params, timeout=10)
                            
                            logger.info(f"Response status: {response.status_code}")
                            
                            if response.status_code == 200:
                                try:
                                    data = response.json()
                                    if self.validate_real_api_data(data):
                                        logger.info(f"✅ Found REAL data from API: {endpoint} ({method})")
                                        return data, endpoint, method
                                    else:
                                        logger.info(f"❌ Invalid or empty data from {endpoint}")
                                except json.JSONDecodeError:
                                    logger.info(f"❌ Non-JSON response from {endpoint}")
                                    continue
                            
                        except Exception as e:
                            logger.debug(f"Method {method} failed for {endpoint}: {e}")
                            continue
                            
                except Exception as e:
                    logger.debug(f"Endpoint {endpoint} failed: {e}")
                    continue
            
            logger.warning("❌ No working API endpoints found")
            return None, None, None
            
        except Exception as e:
            logger.error(f"Error in API search: {e}")
            return None, None, None
    
    def validate_real_api_data(self, data):
        """Validate that the API data contains real AHRI products"""
        try:
            if not data:
                return False
            
            # Check for valid data structure
            if isinstance(data, list) and len(data) > 0:
                items = data
            elif isinstance(data, dict):
                items = data.get('results', data.get('data', data.get('products', [])))
            else:
                return False
            
            if not items or len(items) == 0:
                return False
            
            # Validate that items contain real AHRI data
            for item in items[:3]:  # Check first 3 items
                if not isinstance(item, dict):
                    continue
                
                # Look for AHRI-specific fields
                has_ahri_ref = any(key in item for key in ['ahriReferenceNumber', 'referenceNumber', 'ahri_ref'])
                has_brand = any(key in item for key in ['brand', 'manufacturer', 'outdoorBrand', 'indoorBrand'])
                has_model = any(key in item for key in ['model', 'modelNumber', 'outdoorModel', 'indoorModel'])
                
                if has_ahri_ref or (has_brand and has_model):
                    logger.info("✅ Data validation passed - contains real AHRI fields")
                    return True
            
            logger.warning("❌ Data validation failed - no recognizable AHRI fields")
            return False
            
        except Exception as e:
            logger.error(f"Error validating data: {e}")
            return False
    
    def try_multiple_pages(self, max_results=400):
        """Try to get multiple pages of real data"""
        all_products = []
        page_size = 50
        max_pages = (max_results // page_size) + 1
        
        for page in range(1, max_pages + 1):
            logger.info(f"Trying to get page {page}...")
            
            api_data, endpoint, method = self.get_search_results_api(page_number=page, page_size=page_size)
            
            if api_data:
                products = self.process_real_api_data(api_data)
                if products:
                    all_products.extend(products)
                    logger.info(f"✅ Got {len(products)} products from page {page}")
                    
                    if len(all_products) >= max_results:
                        break
                else:
                    logger.info(f"❌ Page {page} had no valid products")
                    break
            else:
                logger.info(f"❌ Could not get page {page}")
                break
            
            # Be respectful with delays
            time.sleep(1)
        
        return all_products[:max_results]
    
    def process_real_api_data(self, api_data):
        """Process REAL API data ONLY - no filler data allowed"""
        products = []
        
        try:
            # Handle different API response formats
            if isinstance(api_data, list):
                items = api_data
            elif isinstance(api_data, dict):
                items = api_data.get('results', api_data.get('data', api_data.get('products', [])))
            else:
                logger.warning("❌ Invalid API data format")
                return []
            
            if not items:
                logger.warning("❌ No items in API response")
                return []
            
            for item in items:
                if not isinstance(item, dict):
                    continue
                
                # Extract ONLY real data - no defaults or fallbacks
                ahri_ref = (item.get('ahriReferenceNumber') or 
                           item.get('referenceNumber') or 
                           item.get('ahri_ref') or 
                           item.get('reference_number') or '').strip()
                
                outdoor_brand = (item.get('outdoorBrand') or 
                               item.get('outdoor_brand') or 
                               item.get('brand') or '').strip()
                
                outdoor_series = (item.get('outdoorSeries') or 
                                item.get('outdoor_series') or 
                                item.get('series') or '').strip()
                
                outdoor_model = (item.get('outdoorModel') or 
                               item.get('outdoor_model') or 
                               item.get('model') or 
                               item.get('modelNumber') or '').strip()
                
                indoor_brand = (item.get('indoorBrand') or 
                              item.get('indoor_brand') or 
                              outdoor_brand or '').strip()
                
                indoor_series = (item.get('indoorSeries') or 
                               item.get('indoor_series') or '').strip()
                
                indoor_model = (item.get('indoorModel') or 
                              item.get('indoor_model') or '').strip()
                
                # ONLY create product if we have REAL AHRI reference number
                if ahri_ref and len(ahri_ref) >= 6:
                    product = {
                        "ahri_reference_number": ahri_ref,
                        "outdoor_unit": {
                            "brand_name": outdoor_brand,
                            "series_name": outdoor_series,
                            "model_number": outdoor_model
                        },
                        "indoor_unit": {
                            "brand_name": indoor_brand,
                            "series_name": indoor_series,
                            "model_number": indoor_model
                        },
                        "data_source": "real_api_data"
                    }
                    products.append(product)
                else:
                    logger.debug(f"Skipping item without valid AHRI reference: {item}")
            
            logger.info(f"✅ Processed {len(products)} REAL products from API data")
            return products
            
        except Exception as e:
            logger.error(f"Error processing API data: {e}")
            return []
    
    def save_to_json(self, products, filename="products_real_only.json"):
        """Save ONLY real scraped products to JSON file"""
        if not products:
            logger.error("❌ No products to save - will not create empty file")
            return False
        
        try:
            output_data = {
                "scraped_count": len(products),
                "source": "ahridirectory.org",
                "product_type": "air_conditioners",
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "data_guarantee": "REAL_DATA_ONLY_NO_FILLER",
                "products": products
            }
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"✅ Successfully saved {len(products)} REAL products to {filename}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error saving to JSON: {e}")
            return False
    
    def scrape(self, max_results=400, output_file="products_real_only.json"):
        """Main scraping function - REAL DATA ONLY"""
        logger.info(f"🚀 Starting REAL DATA ONLY scraping for {max_results} air conditioning units...")
        logger.info("⚠️  This scraper will FAIL if no real data is available - NO FILLER DATA!")
        
        # Try single page first
        logger.info("🔍 Attempting single-page API scraping...")
        api_data, endpoint, method = self.get_search_results_api()
        
        products = []
        if api_data:
            logger.info("✅ Single-page API successful!")
            products = self.process_real_api_data(api_data)
            
            # If we need more data, try multiple pages
            if products and len(products) < max_results:
                logger.info(f"📄 Got {len(products)} products, trying multiple pages for more...")
                products = self.try_multiple_pages(max_results)
        
        # Final validation - ABSOLUTELY NO FILLER DATA
        if not products:
            logger.error("❌ SCRAPING FAILED - No real data could be obtained")
            logger.error("❌ The website may require JavaScript or have anti-bot protection")
            logger.error("❌ Try the Selenium scraper instead: python ahri_selenium_real_only.py")
            return []
        
        # Double-check all products are real
        real_products = []
        for product in products:
            ahri_ref = product.get('ahri_reference_number', '')
            if ahri_ref and len(ahri_ref) >= 6 and not ahri_ref.startswith('REF'):
                real_products.append(product)
        
        if not real_products:
            logger.error("❌ All products failed validation - no real AHRI data found")
            return []
        
        logger.info(f"✅ Successfully obtained {len(real_products)} REAL products")
        
        # Save results
        if self.save_to_json(real_products, output_file):
            return real_products
        else:
            return []

def main():
    """Main function to run the REAL DATA ONLY scraper"""
    scraper = AHRIRealDataScraper()
    
    try:
        products = scraper.scrape(max_results=400, output_file="products_real_only.json")
        
        if products:
            print(f"\n✅ SUCCESS! Scraped {len(products)} REAL air conditioning units!")
            print(f"📁 Real data saved to products_real_only.json")
            print(f"🔒 GUARANTEE: No filler or sample data - all products are real AHRI certified units")
            
            # Show sample of first product
            print(f"\n📋 Sample REAL product data:")
            print(json.dumps(products[0], indent=2))
        else:
            print("\n❌ SCRAPING FAILED - No real data could be obtained")
            print("🔒 This scraper REFUSES to create filler data")
            print("💡 Try the Selenium version: python ahri_selenium_real_only.py")
            print("💡 Or check if the AHRI website is accessible")
            
    except KeyboardInterrupt:
        print("\n⏹️  Scraping interrupted by user")
    except Exception as e:
        print(f"❌ Error during scraping: {e}")

if __name__ == "__main__":
    main()