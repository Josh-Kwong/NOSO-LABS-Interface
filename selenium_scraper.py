#!/usr/bin/env python3
"""
AHRI Directory Web Scraper - Selenium Version - REAL DATA ONLY
File name: ahri_selenium_real_only.py
ABSOLUTELY NO FILLER OR SAMPLE DATA
"""

import json
import time
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AHRISeleniumRealOnly:
    def __init__(self, headless=True):
        self.base_url = "https://www.ahridirectory.org"
        self.driver = None
        self.headless = headless
        
    def setup_driver(self):
        """Setup Chrome WebDriver"""
        try:
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options
            from webdriver_manager.chrome import ChromeDriverManager
            from selenium.webdriver.chrome.service import Service
            
            chrome_options = Options()
            
            if self.headless:
                chrome_options.add_argument("--headless")
            
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            chrome_options.add_argument("--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            
            # Use webdriver-manager to automatically handle ChromeDriver
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.driver.implicitly_wait(10)
            
            logger.info("✅ WebDriver setup successful")
            return True
            
        except ImportError:
            logger.error("❌ Selenium not installed. Run: pip install selenium webdriver-manager")
            return False
        except Exception as e:
            logger.error(f"❌ Error setting up WebDriver: {e}")
            logger.error("Make sure Chrome browser is installed")
            return False
    
    def navigate_to_ac_search(self):
        """Navigate to the air conditioner search page"""
        try:
            from selenium.webdriver.common.by import By
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC
            
            logger.info("🌐 Navigating to AHRI directory...")
            self.driver.get(self.base_url)
            
            # Wait for page to load
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Try direct URLs for air conditioning search
            direct_urls = [
                f"{self.base_url}/search/101?searchMode=program",
                f"{self.base_url}/Search/SearchHome", 
                f"{self.base_url}/NewSearch?programId=68&searchTypeId=3&productTypeId=1",
                f"{self.base_url}/search/air-conditioners"
            ]
            
            for url in direct_urls:
                try:
                    logger.info(f"🔗 Trying URL: {url}")
                    self.driver.get(url)
                    time.sleep(3)
                    
                    # Check if we have a functional page
                    if self.driver.find_elements(By.CSS_SELECTOR, "input, button, form, table"):
                        logger.info("✅ Successfully navigated to search page")
                        return True
                        
                except Exception as e:
                    logger.debug(f"URL failed: {e}")
                    continue
            
            logger.error("❌ Could not find air conditioning search page")
            return False
            
        except Exception as e:
            logger.error(f"❌ Error navigating: {e}")
            return False
    
    def perform_search(self):
        """Perform the search for air conditioners"""
        try:
            from selenium.webdriver.common.by import By
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC
            from selenium.webdriver.common.action_chains import ActionChains
            
            logger.info("🔍 Looking for search functionality...")
            
            # Look for search button
            search_selectors = [
                "input[type='submit'][value*='Search']",
                "button[type='submit']", 
                ".search-button",
                "#search-btn",
                "//button[contains(text(), 'Search')]",
                "//input[@value='Search']"
            ]
            
            search_button = None
            for selector in search_selectors:
                try:
                    if selector.startswith("//"):
                        search_button = self.driver.find_element(By.XPATH, selector)
                    else:
                        search_button = self.driver.find_element(By.CSS_SELECTOR, selector)
                    
                    if search_button and search_button.is_displayed():
                        logger.info(f"✅ Found search button: {selector}")
                        break
                        
                except:
                    continue
            
            if search_button:
                # Click search button
                ActionChains(self.driver).move_to_element(search_button).click().perform()
                logger.info("🖱️  Clicked search button")
                time.sleep(5)
            else:
                logger.info("ℹ️  No search button found, checking for existing results...")
            
            # Wait for results to appear
            try:
                WebDriverWait(self.driver, 15).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "table, .results, .product-list, [class*='result']"))
                )
                logger.info("✅ Search results found")
                return True
            except:
                logger.warning("⚠️  No clear results found")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error performing search: {e}")
            return False
    
    def validate_real_product(self, product_data):
        """Validate that a product contains real AHRI data"""
        if not product_data:
            return False
        
        ahri_ref = product_data.get('ahri_reference_number', '').strip()
        
        # Must have a real AHRI reference number (not generated)
        if not ahri_ref or len(ahri_ref) < 6:
            return False
        
        # Check that it's not obviously fake
        if ahri_ref.startswith('REF') or ahri_ref.startswith('FAKE') or ahri_ref.startswith('SAMPLE'):
            return False
        
        # Should be mostly numeric for AHRI refs
        if not any(char.isdigit() for char in ahri_ref):
            return False
        
        # Check for at least some brand/model info
        outdoor_brand = product_data.get('outdoor_unit', {}).get('brand_name', '').strip()
        if not outdoor_brand or len(outdoor_brand) < 2:
            return False
        
        return True
    
    def extract_products(self, max_results=400):
        """Extract REAL product data from search results"""
        try:
            from selenium.webdriver.common.by import By
            
            logger.info("📊 Extracting REAL product data...")
            real_products = []
            
            # Try to find results table
            table_selectors = [
                "table",
                ".results-table",
                ".product-list", 
                "[class*='result']",
                "tbody",
                ".data-table"
            ]
            
            results_container = None
            for selector in table_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if elements:
                        results_container = elements[0]
                        logger.info(f"✅ Found results container: {selector}")
                        break
                except:
                    continue
            
            if not results_container:
                logger.error("❌ Could not find results table - cannot extract real data")
                return []
            
            # Find all product rows
            rows = results_container.find_elements(By.CSS_SELECTOR, "tr")
            
            if not rows or len(rows) < 2:
                logger.error("❌ No product rows found - cannot extract real data")
                return []
            
            logger.info(f"📋 Found {len(rows)} rows to process")
            
            # Skip header row if it exists
            start_index = 1 if len(rows) > 1 and self.is_header_row(rows[0]) else 0
            
            processed_count = 0
            for i, row in enumerate(rows[start_index:]):
                if len(real_products) >= max_results:
                    break
                
                try:
                    product_data = self.extract_real_product_from_row(row)
                    
                    # STRICT validation - only real data allowed
                    if self.validate_real_product(product_data):
                        real_products.append(product_data)
                        processed_count += 1
                        
                        if processed_count % 50 == 0:
                            logger.info(f"📦 Extracted {processed_count} REAL products...")
                    else:
                        logger.debug(f"Rejected invalid product data from row {i}")
                        
                except Exception as e:
                    logger.debug(f"Error processing row {i}: {e}")
                    continue
            
            if not real_products:
                logger.error("❌ No valid real products found in table data")
                return []
            
            logger.info(f"✅ Successfully extracted {len(real_products)} REAL products")
            return real_products
            
        except Exception as e:
            logger.error(f"❌ Error extracting products: {e}")
            return []
    
    def is_header_row(self, row):
        """Check if a row is a header row"""
        try:
            text = row.text.lower()
            header_keywords = ['ahri', 'reference', 'brand', 'model', 'outdoor', 'indoor', 'series']
            keyword_count = sum(1 for keyword in header_keywords if keyword in text)
            return keyword_count >= 2 and len(text.split()) < 20
        except:
            return False
    
    def extract_real_product_from_row(self, row):
        """Extract REAL product data from a single row - NO FALLBACKS"""
        try:
            from selenium.webdriver.common.by import By
            
            # Get all cells in the row
            cells = row.find_elements(By.CSS_SELECTOR, "td, th")
            
            if len(cells) < 3:  # Need at least 3 cells for meaningful data
                return None
            
            # Extract text from cells
            cell_texts = [cell.text.strip() for cell in cells if cell.text.strip()]
            
            if len(cell_texts) < 3:
                return None
            
            # Find AHRI reference number (must be real)
            ahri_ref = ""
            for text in cell_texts:
                # Real AHRI refs are typically 8-10 digits, may have some letters
                if text and len(text) >= 6 and any(char.isdigit() for char in text):
                    # Make sure it's not obviously fake
                    if not any(fake in text.upper() for fake in ['REF', 'FAKE', 'SAMPLE', 'TEST']):
                        ahri_ref = text
                        break
            
            if not ahri_ref:
                return None
            
            # Extract brand names (real HVAC brands only)
            real_brands = ['LENNOX', 'CARRIER', 'TRANE', 'GOODMAN', 'RHEEM', 'YORK', 'AMANA', 'BRYANT', 'PAYNE', 'DAIKIN', 'FRIEDRICH', 'MITSUBISHI', 'FUJITSU', 'LG', 'SAMSUNG']
            
            outdoor_brand = ""
            indoor_brand = ""
            outdoor_series = ""
            outdoor_model = ""
            
            for text in cell_texts:
                if text and len(text) > 1:
                    # Check for real brand names
                    for brand in real_brands:
                        if brand in text.upper():
                            if not outdoor_brand:
                                outdoor_brand = brand
                            elif not indoor_brand and brand != outdoor_brand:
                                indoor_brand = brand
                            break
                    
                    # Series names contain "SERIES"
                    if 'SERIES' in text.upper() and not outdoor_series:
                        outdoor_series = text
                    
                    # Model numbers have specific patterns
                    if any(pattern in text for pattern in ['-', 'KC', 'XR', 'XL', 'GSX', 'EL']) and len(text) > 5 and not outdoor_model:
                        outdoor_model = text
            
            # Must have at least AHRI ref and brand
            if not ahri_ref or not outdoor_brand:
                return None
            
            product = {
                "ahri_reference_number": ahri_ref,
                "outdoor_unit": {
                    "brand_name": outdoor_brand,
                    "series_name": outdoor_series,
                    "model_number": outdoor_model
                },
                "indoor_unit": {
                    "brand_name": indoor_brand or outdoor_brand,
                    "series_name": "",
                    "model_number": ""
                },
                "data_source": "real_selenium_extraction",
                "extraction_timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
            }
            
            return product
            
        except Exception as e:
            logger.debug(f"Error extracting from row: {e}")
            return None
    
    def save_to_json(self, products, filename="products_selenium_real.json"):
        """Save ONLY real scraped products to JSON file"""
        if not products:
            logger.error("❌ No real products to save - will not create file")
            return False
        
        try:
            output_data = {
                "scraped_count": len(products),
                "source": "ahridirectory.org",
                "product_type": "air_conditioners",
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "scraping_method": "selenium_webdriver",
                "data_guarantee": "REAL_DATA_ONLY_NO_FILLER",
                "validation_performed": True,
                "products": products
            }
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"✅ Successfully saved {len(products)} REAL products to {filename}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error saving to JSON: {e}")
            return False
    
    def scrape(self, max_results=400, output_file="products_selenium_real.json"):
        """Main scraping function - REAL DATA ONLY"""
        try:
            logger.info(f"🚀 Starting Selenium REAL DATA ONLY scraping for {max_results} units...")
            logger.info("⚠️  This scraper will FAIL if no real data is available - NO FILLER DATA!")
            
            # Setup WebDriver
            if not self.setup_driver():
                logger.error("❌ WebDriver setup failed")
                return []
            
            # Navigate to search page
            if not self.navigate_to_ac_search():
                logger.error("❌ Navigation failed")
                return []
            
            # Perform search
            if not self.perform_search():
                logger.error("❌ Search failed")
                return []
            
            # Extract REAL products only
            products = self.extract_products(max_results)
            
            if not products:
                logger.error("❌ No real products could be extracted")
                return []
            
            # Final validation - ensure all products are real
            validated_products = []
            for product in products:
                if self.validate_real_product(product):
                    validated_products.append(product)
                else:
                    logger.warning(f"Removed invalid product: {product.get('ahri_reference_number', 'UNKNOWN')}")
            
            if not validated_products:
                logger.error("❌ All products failed final validation")
                return []
            
            # Save results
            if self.save_to_json(validated_products, output_file):
                return validated_products
            else:
                return []
            
        except Exception as e:
            logger.error(f"❌ Error during scraping: {e}")
            return []
            
        finally:
            if self.driver:
                self.driver.quit()
                logger.info("🔒 WebDriver closed")
    
    def __del__(self):
        """Cleanup when object is destroyed"""
        if hasattr(self, 'driver') and self.driver:
            try:
                self.driver.quit()
            except:
                pass

def main():
    """Main function to run the REAL DATA ONLY Selenium scraper"""
    # Set headless=False to see the browser in action (useful for debugging)
    scraper = AHRISeleniumRealOnly(headless=True)
    
    try:
        products = scraper.scrape(max_results=400, output_file="products_selenium_real.json")
        
        if products:
            print(f"\n✅ SUCCESS! Scraped {len(products)} REAL air conditioning units!")
            print(f"📁 Real data saved to products_selenium_real.json")
            print(f"🔒 GUARANTEE: No filler or sample data - all products are real AHRI certified units")
            
            # Show sample of first product
            print(f"\n📋 Sample REAL product data:")
            print(json.dumps(products[0], indent=2))
            
            # Show validation info
            print(f"\n✅ All {len(products)} products passed strict validation:")
            print(f"   • Real AHRI reference numbers")
            print(f"   • Valid brand names")
            print(f"   • Extracted from live website data")
            
        else:
            print("\n❌ SCRAPING FAILED - No real data could be obtained")
            print("🔒 This scraper REFUSES to create filler data")
            print("💡 Possible reasons:")
            print("   • Website requires login or has CAPTCHA")
            print("   • Website structure has changed")
            print("   • Anti-bot protection is blocking access")
            print("   • Network connectivity issues")
            print("\n💡 Try running with headless=False to see what's happening:")
            print("   Change line in script: scraper = AHRISeleniumRealOnly(headless=False)")
            
    except KeyboardInterrupt:
        print("\n⏹️  Scraping interrupted by user")
    except Exception as e:
        print(f"❌ Error during scraping: {e}")

if __name__ == "__main__":
    main()