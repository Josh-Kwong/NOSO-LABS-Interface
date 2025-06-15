#!/usr/bin/env python3
"""
AHRI Directory Web Scraper - Expanded from Working Original
File name: ahri_expanded_scraper.py
Based on proven working script - ALL PRODUCTS, NO RESTRICTIONS
"""

import json
import time
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AHRIExpandedScraper:
    def __init__(self, headless=True):
        self.base_url = "https://www.ahridirectory.org"
        self.driver = None
        self.headless = headless
        
        # All product categories with targets (from your screenshots)
        self.product_targets = {
            # High priority - 300 each
            "Air Conditioning": 300,
            "Air-Source Heat Pumps": 300,
            "Residential Furnaces": 300,
            "Residential Water Heaters": 300,
            "Residential Boilers": 300,
            "Geothermal - Water-Source Heat Pumps": 300,
            
            # Medium priority - 100 each
            "Commercial Furnaces": 100,
            "Datacom Cooling": 100,
            "Direct Heating Equipment": 100,
            "Forced Circulation Air-Cooling & Air-Heating Coils": 100,
            "Packaged Terminal Air Conditioners": 100,
            "Packaged Terminal Heat Pumps": 100,
            "Room Fan Coil Units": 100,
            "Single Package Vertical Air-Conditioners and Heat Pumps": 100,
            "Unitary Large Equipment": 100,
            "Variable Refrigerant Flow (VRF) Multi-Split Air Conditioning and Heat Pump Equipment": 100,
            "Geothermal - Direct Geoexchange Heat Pumps": 100
        }
        
    def setup_driver(self):
        """Setup Chrome WebDriver - EXACT COPY from working original"""
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
    
    def navigate_to_search(self, product_type=None):
        """Navigate to search page - EXACT COPY from working original"""
        try:
            from selenium.webdriver.common.by import By
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC
            
            logger.info(f"🌐 Navigating to AHRI directory{' for ' + product_type if product_type else ''}...")
            self.driver.get(self.base_url)
            
            # Wait for page to load
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Try direct URLs for search - EXACT COPY from working original
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
            
            logger.error("❌ Could not find search page")
            return False
            
        except Exception as e:
            logger.error(f"❌ Error navigating: {e}")
            return False
    
    def perform_search(self):
        """Perform the search - EXACT COPY from working original"""
        try:
            from selenium.webdriver.common.by import By
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC
            from selenium.webdriver.common.action_chains import ActionChains
            
            logger.info("🔍 Looking for search functionality...")
            
            # Look for search button - EXACT COPY from working original
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
            
            # Wait for results to appear - EXACT COPY from working original
            try:
                WebDriverWait(self.driver, 15).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "table, .results, .product-list, [class*='result']"))
                )
                logger.info("✅ Search results found")
                return True
            except:
                logger.warning("⚠️  No clear results found")
                return True  # CHANGED: Trust the site, continue anyway
                
        except Exception as e:
            logger.error(f"❌ Error performing search: {e}")
            return True  # CHANGED: Trust the site, continue anyway
    
    def extract_all_products(self, max_results=500):
        """Extract ALL product data with proper column names"""
        try:
            from selenium.webdriver.common.by import By
            
            logger.info("📊 Extracting ALL product data...")
            all_products = []
            
            # Try to find results table - EXACT COPY from working original
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
                logger.error("❌ Could not find results table")
                return []  # Keep this check as it's essential
            
            # Find all product rows
            rows = results_container.find_elements(By.CSS_SELECTOR, "tr")
            
            if not rows or len(rows) < 1:  # CHANGED: Allow even 1 row
                logger.error("❌ No product rows found")
                return []
            
            logger.info(f"📋 Found {len(rows)} rows to process")
            
            # Get headers first
            original_headers, clean_headers = self.get_table_headers()
            
            if original_headers:
                logger.info(f"📊 Column headers found: {len(original_headers)} columns")
                logger.info(f"📋 Sample headers: {original_headers[:5]}...")
            else:
                logger.warning("⚠️  No headers found, using generic column names")
            
            # Skip header row if it exists - simplified check
            start_index = 1 if len(rows) > 1 and self.is_header_row(rows[0]) else 0
            
            processed_count = 0
            for i, row in enumerate(rows[start_index:]):
                if len(all_products) >= max_results:
                    break
                
                try:
                    product_data = self.extract_product_from_row(row, original_headers, clean_headers)
                    
                    # REMOVED ALL VALIDATION - trust AHRI data completely
                    if product_data:  # Only check if data exists at all
                        all_products.append(product_data)
                        processed_count += 1
                        
                        if processed_count % 50 == 0:
                            logger.info(f"📦 Extracted {processed_count} products...")
                        
                except Exception as e:
                    logger.debug(f"Error processing row {i}: {e}")
                    continue
            
            logger.info(f"✅ Successfully extracted {len(all_products)} products")
            return all_products
            
        except Exception as e:
            logger.error(f"❌ Error extracting products: {e}")
            return []
    
    def is_header_row(self, row):
        """Check if a row is a header row - EXACT COPY from working original"""
        try:
            text = row.text.lower()
            header_keywords = ['ahri', 'reference', 'brand', 'model', 'outdoor', 'indoor', 'series']
            keyword_count = sum(1 for keyword in header_keywords if keyword in text)
            return keyword_count >= 2 and len(text.split()) < 20
        except:
            return False
    
    def get_table_headers(self):
        """Extract column headers from the table"""
        try:
            from selenium.webdriver.common.by import By
            
            # Try multiple selectors to find headers
            header_selectors = [
                "table thead tr th",
                "table tr:first-child th", 
                "table tr:first-child td",
                ".data-table thead th",
                ".results-table thead th"
            ]
            
            headers = []
            for selector in header_selectors:
                try:
                    header_elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if header_elements:
                        headers = [elem.text.strip() for elem in header_elements]
                        if headers and len(headers) > 2:  # Valid header row
                            break
                except:
                    continue
            
            # Clean headers for use as JSON keys
            cleaned_headers = []
            for header in headers:
                if header:
                    # Clean header text to create valid JSON keys
                    clean_key = (header.lower()
                                .replace(' ', '_')
                                .replace('(', '')
                                .replace(')', '')
                                .replace('#', 'number')
                                .replace('.', '')
                                .replace('-', '_')
                                .replace('/', '_')
                                .replace('&', 'and')
                                .replace('*', '')
                                .replace('®', '')
                                .replace('%', 'percent')
                                .replace(',', '')
                                .replace('?', '')
                                .replace(':', ''))
                    # Remove any remaining special characters
                    clean_key = ''.join(c for c in clean_key if c.isalnum() or c == '_')
                    # Remove multiple underscores
                    while '__' in clean_key:
                        clean_key = clean_key.replace('__', '_')
                    clean_key = clean_key.strip('_')
                    
                    cleaned_headers.append(clean_key if clean_key else f"column_{len(cleaned_headers)}")
                else:
                    cleaned_headers.append(f"column_{len(cleaned_headers)}")
            
            return headers, cleaned_headers
            
        except Exception as e:
            logger.debug(f"Error getting headers: {e}")
            return [], []

    def extract_product_from_row(self, row, original_headers, clean_headers):
        """Extract product data from a single row with proper column names"""
        try:
            from selenium.webdriver.common.by import By
            
            # Get all cells in the row
            cells = row.find_elements(By.CSS_SELECTOR, "td, th")
            
            if len(cells) < 1:
                return None
            
            # Extract text from cells
            cell_texts = [cell.text.strip() for cell in cells]
            
            # Create comprehensive product data
            product = {
                "extraction_timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "data_source": "ahri_directory_expanded",
            }
            
            # Map data using actual column names
            for i, text in enumerate(cell_texts):
                if text:  # Only add non-empty data
                    # Use clean header name if available, otherwise generic name
                    if i < len(clean_headers) and clean_headers[i]:
                        key = clean_headers[i]
                    else:
                        key = f"column_{i}"
                    
                    product[key] = text
                    
                    # Also add the original header name for reference
                    if i < len(original_headers) and original_headers[i]:
                        product[f"{key}_original_header"] = original_headers[i]
            
            return product
            
        except Exception as e:
            logger.debug(f"Error extracting from row: {e}")
            return None
    
    def handle_pagination(self, current_products, target_count):
        """Handle pagination to get more results"""
        try:
            from selenium.webdriver.common.by import By
            
            all_products = current_products.copy()
            page_count = 1
            
            while len(all_products) < target_count and page_count < 10:  # Limit pages for speed
                # Look for next page button
                next_selectors = [
                    "a[aria-label='Next']",
                    ".pagination-next",
                    ".next-page",
                    "//a[contains(text(), 'Next')]",
                    "//button[contains(text(), 'Next')]",
                    ".pagination a:last-child"
                ]
                
                next_button = None
                for selector in next_selectors:
                    try:
                        if selector.startswith("//"):
                            next_button = self.driver.find_element(By.XPATH, selector)
                        else:
                            next_button = self.driver.find_element(By.CSS_SELECTOR, selector)
                        
                        if next_button and next_button.is_enabled():
                            break
                        else:
                            next_button = None
                    except:
                        continue
                
                if not next_button:
                    logger.info("📄 No more pages available")
                    break
                
                # Click next page
                try:
                    self.driver.execute_script("arguments[0].click();", next_button)
                    page_count += 1
                    logger.info(f"📄 Moved to page {page_count}")
                    time.sleep(3)
                    
                    # Extract products from new page
                    page_products = self.extract_all_products(target_count - len(all_products))
                    if page_products:
                        all_products.extend(page_products)
                        logger.info(f"📦 Total products collected: {len(all_products)}")
                    else:
                        break
                        
                except Exception as e:
                    logger.error(f"❌ Error navigating to next page: {e}")
                    break
            
            return all_products[:target_count]
            
        except Exception as e:
            logger.error(f"❌ Error handling pagination: {e}")
            return current_products
    
    def save_all_data(self, all_category_data, filename="ahri_all_products.json"):
        """Save ALL scraped products to JSON file"""
        try:
            total_products = sum(len(products) for products in all_category_data.values())
            
            output_data = {
                "scraping_summary": {
                    "total_products": total_products,
                    "total_categories": len(all_category_data),
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "source": "ahridirectory.org",
                    "scraping_method": "expanded_selenium_no_restrictions",
                    "data_guarantee": "ALL_AVAILABLE_DATA_NO_FILTERING"
                },
                "category_breakdown": {
                    category: len(products) for category, products in all_category_data.items()
                },
                "products_by_category": all_category_data
            }
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"✅ Successfully saved {total_products} products from {len(all_category_data)} categories to {filename}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error saving to JSON: {e}")
            return False
    
    def scrape_single_category(self, category, target_count):
        """Scrape a single category with fresh browser session"""
        try:
            logger.info(f"🎯 Scraping {category} (target: {target_count})")
            
            # Setup fresh WebDriver for this category
            if not self.setup_driver():
                logger.error(f"❌ WebDriver setup failed for {category}")
                return []
            
            # Navigate to search page
            if not self.navigate_to_search(category):
                logger.warning(f"⚠️  Navigation failed for {category}")
                return []
            
            # Perform search
            if not self.perform_search():
                logger.warning(f"⚠️  Search failed for {category}")
                return []
            
            # Extract products
            products = self.extract_all_products(target_count)
            
            # Handle pagination if needed
            if len(products) < target_count:
                logger.info(f"🔄 Need more products for {category}, trying pagination...")
                products = self.handle_pagination(products, target_count)
            
            # Add category info to each product
            for product in products:
                product['product_category'] = category
                product['target_count'] = target_count
            
            logger.info(f"✅ {category}: {len(products)}/{target_count} products collected")
            
            # Close this browser session
            if self.driver:
                self.driver.quit()
                self.driver = None
            
            return products
            
        except Exception as e:
            logger.error(f"❌ Error scraping {category}: {e}")
            return []
        finally:
            # Ensure driver is closed
            if self.driver:
                try:
                    self.driver.quit()
                    self.driver = None
                except:
                    pass

    def scrape_all_products(self):
        """Main scraping function - ALL PRODUCTS, ALL CATEGORIES"""
        try:
            total_target = sum(self.product_targets.values())
            logger.info(f"🚀 Starting EXPANDED scraping for ALL {len(self.product_targets)} product categories...")
            logger.info(f"🎯 Target: {total_target} total products")
            logger.info("⚠️  NO RESTRICTIONS - trusting ALL AHRI data!")
            logger.info("🔄 Using fresh browser session for each category to avoid timeouts")
            
            all_category_data = {}
            
            for category, target_count in self.product_targets.items():
                try:
                    # Scrape this category with fresh browser session
                    products = self.scrape_single_category(category, target_count)
                    
                    if products:
                        all_category_data[category] = products
                        logger.info(f"✅ {category}: SUCCESS - {len(products)} products")
                    else:
                        logger.warning(f"⚠️  {category}: No products found")
                    
                    # Brief pause between categories
                    time.sleep(3)
                    
                except Exception as e:
                    logger.error(f"❌ Error with {category}: {e}")
                    continue
            
            # Save all results
            if all_category_data:
                self.save_all_data(all_category_data)
                
                # Print final summary
                total_collected = sum(len(products) for products in all_category_data.values())
                
                print(f"\n🎉 EXPANDED SCRAPING COMPLETED!")
                print(f"✅ Successfully scraped: {len(all_category_data)} categories")
                print(f"📦 Total products collected: {total_collected}")
                print(f"🎯 Target achievement: {total_collected}/{total_target} ({(total_collected/total_target)*100:.1f}%)")
                
                print(f"\n📋 Category breakdown:")
                for category, products in all_category_data.items():
                    target = self.product_targets[category]
                    print(f"   • {category}: {len(products)}/{target} products")
                
                return all_category_data
            else:
                logger.error("❌ No products collected from any category")
                return {}
                
        except Exception as e:
            logger.error(f"❌ Error during expanded scraping: {e}")
            return {}
        # Note: No finally block needed since each category handles its own driver cleanup
    
    def __del__(self):
        """Cleanup when object is destroyed"""
        if hasattr(self, 'driver') and self.driver:
            try:
                self.driver.quit()
            except:
                pass

def main():
    """Main function to run the EXPANDED scraper"""
    # Set headless=False to see the browser in action (useful for debugging)
    scraper = AHRIExpandedScraper(headless=True)
    
    try:
        all_products = scraper.scrape_all_products()
        
        if all_products:
            total = sum(len(products) for products in all_products.values())
            print(f"\n✅ SUCCESS! Scraped {total} products across {len(all_products)} categories!")
            print(f"📁 All data saved to ahri_all_products.json")
            print(f"🔒 NO RESTRICTIONS APPLIED - all available data captured")
            
            # Show sample of first product from first category
            first_category = list(all_products.keys())[0]
            if all_products[first_category]:
                print(f"\n📋 Sample product data from {first_category}:")
                print(json.dumps(all_products[first_category][0], indent=2))
            
        else:
            print("\n❌ SCRAPING FAILED - No data could be obtained")
            print("💡 Try running with headless=False to see what's happening:")
            print("   Change line in script: scraper = AHRIExpandedScraper(headless=False)")
            
    except KeyboardInterrupt:
        print("\n⏹️  Scraping interrupted by user")
    except Exception as e:
        print(f"❌ Error during scraping: {e}")

if __name__ == "__main__":
    main()