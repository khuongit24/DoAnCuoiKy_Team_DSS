import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from etl.gold_to_db_pipeline import process_gold_to_db

try:
    res = process_gold_to_db('uploads/silver/silver_file-1784526928298-701017530.csv')
    print("SUCCESS", res)
except Exception as e:
    print("FAILED", type(e).__name__, str(e))
