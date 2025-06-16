# NOSO-LABS-Interface

**Data Sources and Structure**

The majority of the data comes from AHRI databases. The web scraping script in selenium_scraper.py visits the AHRI website and compiles data from various HVAC products, while also ensuring a variety of brands are included. All the data is compiled into the all_products.json file inside the HVAC catalog. The data is sorted by brand, and some normalization is performed so that brands with sub-brands (like GE) are grouped together. After grouping by brand, the interface further categorizes products by checking fields like “product category.” Model numbers are extracted from the model number fields in the JSON.


**Setup Instructions**

Node.js and Python are required. To run the interface, clone the repo and run npm install followed by npm start to launch the site locally.


**Usage and Features**

The site is sorted by brand. The search bar allows you to look up any brand or model in the interface and it isn't case sensitive. Clicking on a brand displays all the series associated with it. You can then click on a series to view specific models. Once you click on brands and series there's a back button to return to prior pages.

**Challenges & Solutions**

The biggest challenge was finding data. I ended up using a web scraping script to gather it, which required a lot of trial and error to organize everything properly into a JSON file. It was also challenging to make the script efficient, as running it initially took quite a long time.

