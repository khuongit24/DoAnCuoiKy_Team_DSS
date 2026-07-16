import logging
import time
from etl.extract import DataExtractor
from etl.transform import DataTransformer
from etl.load import DataLoader

logger = logging.getLogger(__name__)

def run_etl_pipeline(sales_path="sales.csv", inventory_path="inventory.csv", market_url="http://api.market"):
    logger.info("Starting complete ETL pipeline...")
    try:
        extractor = DataExtractor()
        raw_data = extractor.extract_all(sales_path, inventory_path, market_url)
        
        transformer = DataTransformer()
        silver_data = transformer.transform_all(raw_data)
        
        loader = DataLoader()
        loader.process_and_load(silver_data)
        
        logger.info("ETL pipeline completed successfully.")
    except Exception as e:
        logger.error(f"ETL pipeline failed: {str(e)}")

# Placeholder for actual scheduler using schedule or APScheduler
def setup_scheduler():
    import schedule
    # Run every day at midnight
    schedule.every().day.at("00:00").do(run_etl_pipeline)
    
    logger.info("Scheduler setup complete. Waiting for scheduled tasks...")
    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    # Uncomment to run immediately
    # run_etl_pipeline()
    # setup_scheduler()
