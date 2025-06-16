#!/usr/bin/env python3
"""
AHRI Specialized Scraper - 6 Products Only
File name: ahri_specialized_6_products.py
Specializes in the 6 main product categories from homepage cards
"""

import json
import time
import logging
import hashlib
from collections import defaultdict

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AHRISpecialized6Products:
    def __init__(self, headless=False):
        self.base_url = "https://www.ahridirectory.org"
        self.driver = None
        self.headless = headless
        
        # Track products globally
        self.seen_products = set()
        self.duplicate_count = 0
        self.brand_counts = defaultdict(int)
        self.max_per_brand = 40
        
        # EXACT 6 categories from homepage cards - in order they appear
        self.categories = {
            "Air Conditioning": {
                "target": 250,
                "click_text": "Air Conditioning",
                "verify_text": "Air Conditioners"
            },
            "Air-Source Heat Pumps": {
                "target": 250,
                "click_text": "Air-Source Heat Pumps",
                "verify_text": "Heat Pumps"
            },
            "Residential Furnaces": {
                "target": 250,
                "click_text": "Residential Furnaces",
                "verify_text": "Furnaces"
            },
            "Residential Water Heaters": {
                "target": 250,
                "click_text": "Residential Water Heaters",
                "verify_text": "Water Heaters"
            },
            "Residential Boilers": {
                "target": 250,
                "click_text": "Residential Boilers",
                "verify_text": "Boilers"
            },
            "Geothermal - Water-Source Heat Pumps": {
                "target": 250,
                "click_text": "Geothermal - Water-Source Heat Pumps",
                "verify_text": "Geothermal"
            }
        }
        
    def setup_driver(self):
        """Setup Chrome WebDriver - one session for all"""
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
            chrome_options.add_argument("--window-size=1920,1080")
            
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.driver.implicitly_wait(10)
            
            logger.info("✅ Single WebDriver session created for all 6 categories")
            return True
            
        except Exception as e:
            logger.error(f"❌ WebDriver setup failed: {e}")
            return False
    
    def go_to_homepage_fresh(self):
        """Go to AHRI homepage and handle any popups"""
        try:
            from selenium.webdriver.common.by import By
            
            logger.info("🏠 Loading fresh AHRI homepage...")
            self.driver.get(self.base_url)
            time.sleep(4)
            
            # Handle cookie banner
            try:
                accept_button = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Accept')]")
                if accept_button.is_displayed():
                    accept_button.click()
                    logger.info("✅ Accepted cookies")
                    time.sleep(2)
            except:
                pass
            
            # Scroll to make sure category cards are visible
            self.driver.execute_script("window.scrollTo(0, 600);")
            time.sleep(2)
            
            logger.info("✅ Homepage loaded and ready")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error loading homepage: {e}")
            return False
    
    def find_and_click_category_card(self, category_name, category_info):
        """Find and click the specific category card"""
        try:
            from selenium.webdriver.common.by import By
            from selenium.webdriver.common.action_chains import ActionChains
            
            click_text = category_info["click_text"]
            logger.info(f"🎯 Looking for category card: '{click_text}'")
            
            # Look for the category card - try multiple approaches
            found_element = None
            
            # Strategy 1: Look for exact text in any element
            try:
                xpath = f"//*[contains(text(), '{click_text}')]"
                elements = self.driver.find_elements(By.XPATH, xpath)
                for elem in elements:
                    if elem.is_displayed() and click_text.lower() in elem.text.lower():
                        found_element = elem
                        logger.info(f"✅ Found exact match: '{elem.text.strip()}'")
                        break
            except:
                pass
            
            # Strategy 2: Look for partial matches (for long names)
            if not found_element:
                search_terms = click_text.split()[:2]  # First 2 words
                for term in search_terms:
                    try:
                        xpath = f"//*[contains(text(), '{term}')]"
                        elements = self.driver.find_elements(By.XPATH, xpath)
                        for elem in elements:
                            if elem.is_displayed() and term.lower() in elem.text.lower():
                                # Check if this looks like our category
                                elem_text = elem.text.lower()
                                if any(word in elem_text for word in click_text.lower().split()):
                                    found_element = elem
                                    logger.info(f"✅ Found partial match: '{elem.text.strip()}'")
                                    break
                        if found_element:
                            break
                    except:
                        continue
            
            if not found_element:
                logger.error(f"❌ Could not find category card for '{click_text}'")
                return False
            
            # Try to click the element or find its clickable parent
            clicked = False
            current_element = found_element
            
            for attempt in range(3):  # Try element, parent, grandparent
                try:
                    # Scroll element into view
                    self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", current_element)
                    time.sleep(1)
                    
                    # Get current URL to check if we navigate
                    current_url = self.driver.current_url
                    
                    # Try to click
                    ActionChains(self.driver).move_to_element(current_element).click().perform()
                    time.sleep(4)  # Wait for navigation
                    
                    # Check if URL changed (indicating successful navigation)
                    new_url = self.driver.current_url
                    if new_url != current_url:
                        logger.info(f"✅ Successfully clicked '{click_text}' - navigated to new page")
                        logger.info(f"📍 New URL: {new_url}")
                        clicked = True
                        break
                    else:
                        logger.info(f"⚠️  Click didn't navigate, trying parent element...")
                        current_element = current_element.find_element(By.XPATH, "..")
                        
                except Exception as e:
                    logger.debug(f"Click attempt {attempt + 1} failed: {e}")
                    try:
                        current_element = current_element.find_element(By.XPATH, "..")
                    except:
                        break
            
            if not clicked:
                logger.error(f"❌ Failed to click category card for '{click_text}'")
                return False
            
            # Verify we're on the right page
            try:
                page_title = self.driver.title
                verify_text = category_info.get("verify_text", "")
                if verify_text and verify_text.lower() in page_title.lower():
                    logger.info(f"✅ Verified correct page: {page_title}")
                else:
                    logger.info(f"ℹ️  On page: {page_title}")
            except:
                pass
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error clicking category card: {e}")
            return False
    
    def click_search_button_and_wait(self):
        """Click Search button and wait for results"""
        try:
            from selenium.webdriver.common.by import By
            from selenium.webdriver.common.action_chains import ActionChains
            
            logger.info("🔍 Looking for Search button...")
            
            # Find search button
            search_selectors = [
                "//button[text()='Search']",
                "//input[@value='Search']",
                "//button[contains(@class, 'btn-primary')]",
                "//button[@type='submit']"
            ]
            
            search_button = None
            for selector in search_selectors:
                try:
                    elements = self.driver.find_elements(By.XPATH, selector)
                    for elem in elements:
                        if elem.is_displayed() and elem.is_enabled():
                            search_button = elem
                            logger.info(f"✅ Found search button")
                            break
                    if search_button:
                        break
                except:
                    continue
            
            if not search_button:
                logger.warning("⚠️  No search button found")
                return True  # Maybe results are already showing
            
            # Click search button
            try:
                ActionChains(self.driver).move_to_element(search_button).click().perform()
                logger.info("🖱️  Clicked Search button")
                time.sleep(8)  # Wait for results to load
                return True
            except Exception as e:
                logger.error(f"❌ Error clicking search button: {e}")
                return False
            
        except Exception as e:
            logger.error(f"❌ Error in search process: {e}")
            return False
    
    def extract_table_data(self, category_name, target_count):
        """Extract data from results table"""
        try:
            from selenium.webdriver.common.by import By
            
            logger.info(f"📊 Extracting data for {category_name}...")
            
            # Find table
            tables = self.driver.find_elements(By.TAG_NAME, "table")
            if not tables:
                logger.error("❌ No table found")
                return []
            
            # Use largest table (most likely to be results)
            main_table = max(tables, key=lambda t: len(t.find_elements(By.TAG_NAME, "tr")))
            rows = main_table.find_elements(By.TAG_NAME, "tr")
            
            logger.info(f"📋 Table has {len(rows)} rows")
            
            if len(rows) < 2:
                logger.error("❌ No data rows")
                return []
            
            # Extract headers
            header_cells = rows[0].find_elements(By.CSS_SELECTOR, "th, td")
            headers = [cell.text.strip() for cell in header_cells]
            
            if headers:
                logger.info(f"📋 Headers: {headers[:3]}...")
            
            # Extract products
            products = []
            for i, row in enumerate(rows[1:]):  # Skip header
                if len(products) >= target_count:
                    break
                
                try:
                    cells = row.find_elements(By.CSS_SELECTOR, "td, th")
                    cell_texts = [cell.text.strip() for cell in cells]
                    
                    if not any(cell_texts):
                        continue
                    
                    # Create product
                    product = {
                        "extraction_timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                        "data_source": "ahri_specialized_6_products",
                        "product_category": category_name
                    }
                    
                    # Map cells to headers
                    for j, text in enumerate(cell_texts):
                        if text and j < len(headers) and headers[j]:
                            product[headers[j]] = text
                        elif text:
                            product[f"field_{j}"] = text
                    
                    # Basic validation and duplicate check
                    if self.is_valid_product(product) and not self.is_duplicate(product):
                        if self.check_brand_diversity(product):
                            products.append(product)
                            
                            if len(products) % 50 == 0:
                                logger.info(f"📦 {len(products)} products extracted...")
                
                except Exception as e:
                    continue
            
            logger.info(f"✅ Extracted {len(products)} products for {category_name}")
            return products
            
        except Exception as e:
            logger.error(f"❌ Error extracting data: {e}")
            return []
    
    def is_valid_product(self, product):
        """Basic product validation"""
        # Must have at least 3 meaningful fields
        meaningful_fields = [k for k, v in product.items() 
                           if k not in ['extraction_timestamp', 'data_source', 'product_category'] 
                           and v and len(str(v)) > 1]
        return len(meaningful_fields) >= 3
    
    def is_duplicate(self, product):
        """Check for duplicates"""
        try:
            key_parts = []
            for key, value in product.items():
                if key not in ['extraction_timestamp', 'data_source']:
                    if value:
                        key_parts.append(f"{key}:{value}")
            
            fingerprint = "|".join(sorted(key_parts))
            hash_val = hashlib.md5(fingerprint.encode()).hexdigest()
            
            if hash_val in self.seen_products:
                self.duplicate_count += 1
                return True
            
            self.seen_products.add(hash_val)
            return False
        except:
            return False
    
    def check_brand_diversity(self, product):
        """Check brand diversity"""
        try:
            # Find brand field
            brand = "UNKNOWN"
            brand_fields = ["Outdoor Unit Brand Name", "Brand Name", "Brand", "Manufacturer"]
            
            for field in brand_fields:
                if field in product and product[field]:
                    brand = str(product[field]).upper().strip()
                    break
            
            # If no brand field, use first meaningful field
            if brand == "UNKNOWN":
                for key, value in product.items():
                    if key not in ['extraction_timestamp', 'data_source', 'product_category']:
                        if value and 2 < len(str(value)) < 30:  # Reasonable brand name length
                            brand = str(value).upper().strip()
                            break
            
            # Check brand limit
            if self.brand_counts[brand] >= self.max_per_brand:
                return False
            
            self.brand_counts[brand] += 1
            return True
        except:
            return True
    
    def scrape_single_category(self, category_name, category_info):
        """Scrape one category following exact process"""
        try:
            target_count = category_info["target"]
            logger.info(f"\n🎯 === {category_name.upper()} (Target: {target_count}) ===")
            
            # Step 1: Go to fresh homepage
            if not self.go_to_homepage_fresh():
                return []
            
            # Step 2: Find and click category card
            if not self.find_and_click_category_card(category_name, category_info):
                return []
            
            # Step 3: Click Search button
            if not self.click_search_button_and_wait():
                return []
            
            # Step 4: Extract table data
            products = self.extract_table_data(category_name, target_count)
            
            if products:
                brands = len(set(self.extract_brand(p) for p in products))
                logger.info(f"✅ {category_name}: {len(products)} products from {brands} brands")
            else:
                logger.warning(f"⚠️  {category_name}: No products extracted")
            
            return products
            
        except Exception as e:
            logger.error(f"❌ Error scraping {category_name}: {e}")
            return []
    
    def extract_brand(self, product):
        """Extract brand for reporting"""
        brand_fields = ["Outdoor Unit Brand Name", "Brand Name", "Brand"]
        for field in brand_fields:
            if field in product and product[field]:
                return str(product[field]).upper()
        return "UNKNOWN"
    
    def run_all_categories(self):
        """Main function - scrape all 6 categories"""
        try:
            if not self.setup_driver():
                return {}
            
            total_target = sum(cat["target"] for cat in self.categories.values())
            logger.info(f"🚀 AHRI SPECIALIZED 6 PRODUCTS SCRAPER")
            logger.info(f"🎯 Target: {total_target} products from 6 categories")
            logger.info(f"🔄 Process: Homepage → Click Card → Search → Extract")
            
            all_results = {}
            
            for category_name, category_info in self.categories.items():
                try:
                    products = self.scrape_single_category(category_name, category_info)
                    if products:
                        all_results[category_name] = products
                    
                    # Pause between categories
                    time.sleep(3)
                    
                except Exception as e:
                    logger.error(f"❌ {category_name} failed: {e}")
                    continue
            
            # Save results
            if all_results:
                total_products = sum(len(products) for products in all_results.values())
                
                output_data = {
                    "scraping_summary": {
                        "total_products": total_products,
                        "categories_scraped": len(all_results),
                        "duplicates_filtered": self.duplicate_count,
                        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                        "source": "ahridirectory.org",
                        "method": "specialized_6_products_scraper"
                    },
                    "brand_distribution": dict(sorted(self.brand_counts.items(), key=lambda x: x[1], reverse=True)),
                    "products_by_category": all_results
                }
                
                filename = "ahri_6_products_results.json"
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(output_data, f, indent=2, ensure_ascii=False)
                
                print(f"\n🎉 6 PRODUCTS SCRAPING COMPLETED!")
                print(f"✅ Categories successfully scraped: {len(all_results)}/6")
                print(f"📦 Total products collected: {total_products}")
                print(f"🚫 Duplicates filtered: {self.duplicate_count}")
                print(f"📁 Data saved to {filename}")
                
                # Show results breakdown
                print(f"\n📋 Results by category:")
                for category, products in all_results.items():
                    target = self.categories[category]['target']
                    brands = len(set(self.extract_brand(p) for p in products))
                    print(f"   • {category}: {len(products)}/{target} products ({brands} brands)")
                
                # Show top brands
                if self.brand_counts:
                    print(f"\n🏷️  Top 10 brands across all categories:")
                    top_brands = sorted(self.brand_counts.items(), key=lambda x: x[1], reverse=True)[:10]
                    for brand, count in top_brands:
                        print(f"   • {brand}: {count} products")
                
                return all_results
            else:
                print("❌ No categories were successfully scraped")
                return {}
                
        except Exception as e:
            logger.error(f"❌ Scraper error: {e}")
            return {}
        finally:
            if self.driver:
                try:
                    input("\n🛑 Press Enter to close browser...")
                    self.driver.quit()
                    logger.info("✅ Browser closed")
                except:
                    pass

def main():
    """Run the specialized 6 products scraper"""
    scraper = AHRISpecialized6Products(headless=False)  # Visible browser
    
    try:
        results = scraper.run_all_categories()
        
        if results:
            print(f"\n✅ Successfully scraped {len(results)} categories!")
            print("📄 Check ahri_6_products_results.json for detailed data")
        else:
            print("\n❌ Scraping failed")
            
    except KeyboardInterrupt:
        print("\n⏹️  Scraping interrupted")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()