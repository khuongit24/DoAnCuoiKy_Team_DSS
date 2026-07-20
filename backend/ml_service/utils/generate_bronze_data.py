import pandas as pd
import numpy as np
import random
import os
import uuid
from datetime import datetime, timedelta

def generate_bronze_sales_data(num_records=5000, output_path="sample_bronze_data.csv"):
    """
    Tạo dữ liệu Bronze mô phỏng doanh nghiệp bán lẻ linh kiện điện tử thực tế.
    Bao gồm: giá realistic theo sản phẩm, seasonal patterns, supplier mapping, 
    tỷ lệ status hợp lý, và trend tăng trưởng tự nhiên.
    """
    print(f"Generating {num_records} realistic sales records...")

    # === PRODUCT CATALOG với giá thực tế (VND) ===
    products_catalog = {
        "CPU": {
            "Intel Core i9": {"price_range": (12_500_000, 16_000_000), "weight": 0.15},
            "Intel Core i7": {"price_range": (7_800_000, 10_500_000), "weight": 0.25},
            "AMD Ryzen 9": {"price_range": (11_000_000, 14_500_000), "weight": 0.15},
            "AMD Ryzen 7": {"price_range": (6_500_000, 9_000_000), "weight": 0.25},
        },
        "GPU": {
            "RTX 4090": {"price_range": (38_000_000, 48_000_000), "weight": 0.10},
            "RTX 4080": {"price_range": (25_000_000, 32_000_000), "weight": 0.15},
            "RTX 3060": {"price_range": (6_500_000, 9_000_000), "weight": 0.30},
            "RX 7900 XTX": {"price_range": (22_000_000, 28_000_000), "weight": 0.10},
        },
        "RAM": {
            "32GB DDR5": {"price_range": (2_200_000, 3_500_000), "weight": 0.25},
            "16GB DDR4": {"price_range": (750_000, 1_200_000), "weight": 0.40},
            "64GB DDR5": {"price_range": (4_500_000, 7_000_000), "weight": 0.10},
        },
        "Storage": {
            "2TB SSD": {"price_range": (3_200_000, 5_000_000), "weight": 0.20},
            "1TB SSD": {"price_range": (1_800_000, 2_800_000), "weight": 0.35},
            "4TB HDD": {"price_range": (2_500_000, 3_800_000), "weight": 0.10},
        },
        "Mainboard": {
            "Z790 MB": {"price_range": (5_500_000, 8_500_000), "weight": 0.15},
            "B650 MB": {"price_range": (3_200_000, 5_000_000), "weight": 0.25},
            "X670E MB": {"price_range": (6_000_000, 9_500_000), "weight": 0.10},
        },
        "Monitor": {
            "27-inch 4K": {"price_range": (7_500_000, 12_000_000), "weight": 0.20},
            "24-inch 1080p": {"price_range": (3_000_000, 5_000_000), "weight": 0.35},
            "34-inch Ultrawide": {"price_range": (10_000_000, 18_000_000), "weight": 0.10},
        },
        "Laptop": {
            "Gaming Laptop": {"price_range": (22_000_000, 40_000_000), "weight": 0.15},
            "Ultrabook": {"price_range": (18_000_000, 30_000_000), "weight": 0.15},
            "Business Laptop": {"price_range": (12_000_000, 22_000_000), "weight": 0.20},
        },
        "Accessories": {
            "Mechanical Keyboard": {"price_range": (800_000, 3_500_000), "weight": 0.30},
            "Wireless Mouse": {"price_range": (350_000, 1_800_000), "weight": 0.35},
            "Gaming Headset": {"price_range": (500_000, 3_000_000), "weight": 0.25},
        },
    }

    # === SUPPLIER MAPPING theo category ===
    supplier_mapping = {
        "CPU": ["Supplier A - Intel", "Supplier B - AMD"],
        "GPU": ["Supplier A - Intel", "Supplier B - AMD", "Supplier D - MSI"],
        "RAM": ["Supplier E - Corsair", "Supplier F - Samsung"],
        "Storage": ["Supplier F - Samsung", "Supplier E - Corsair"],
        "Mainboard": ["Supplier C - ASUS", "Supplier D - MSI"],
        "Monitor": ["Supplier C - ASUS", "Supplier F - Samsung"],
        "Laptop": ["Supplier C - ASUS", "Supplier D - MSI"],
        "Accessories": ["Supplier D - MSI", "Supplier E - Corsair", "Supplier C - ASUS"],
    }

    # === SEASONAL DEMAND MULTIPLIER ===
    # Tháng → Hệ số nhu cầu (1.0 = bình thường)
    seasonal_multiplier = {
        1: 0.85,   # Sau Tết, nhu cầu giảm
        2: 0.80,   # Tết Nguyên đán, giảm mạnh
        3: 0.90,   # Phục hồi dần
        4: 0.95,
        5: 1.00,
        6: 1.05,   # Hè bắt đầu
        7: 1.10,   # Mua sắm hè
        8: 1.30,   # Back-to-school cao điểm
        9: 1.25,   # Back-to-school tiếp
        10: 1.05,  # Bình thường
        11: 1.35,  # Black Friday / Singles Day
        12: 1.40,  # Year-end sales, Giáng sinh
    }

    # Category weight cho phân bổ sản phẩm
    category_weights = {
        "GPU": 0.18, "CPU": 0.16, "RAM": 0.14, "Storage": 0.12,
        "Monitor": 0.12, "Laptop": 0.10, "Mainboard": 0.10, "Accessories": 0.08
    }

    categories = list(category_weights.keys())
    cat_probs = [category_weights[c] for c in categories]

    data = []
    # 12 tháng dữ liệu: từ ~1 năm trước đến hôm nay
    end_date = datetime(2026, 7, 20)
    start_date = end_date - timedelta(days=365)

    # Phân bổ records theo tháng dựa trên seasonal multiplier
    total_multiplier = sum(seasonal_multiplier.values())
    records_per_month = {}
    remaining = num_records
    months_list = list(range(1, 13))
    
    for i, m in enumerate(months_list):
        if i < len(months_list) - 1:
            count = int(num_records * (seasonal_multiplier[m] / total_multiplier))
        else:
            count = remaining  # last month gets whatever remains
        records_per_month[m] = count
        remaining -= count

    for month_num in months_list:
        month_count = records_per_month[month_num]
        
        # Xác định ngày bắt đầu/kết thúc của tháng trong khoảng data
        if month_num >= start_date.month or (end_date.year > start_date.year and month_num <= end_date.month):
            if month_num >= start_date.month and start_date.year == 2025:
                year = 2025
            else:
                year = 2026
        else:
            continue

        # Tính ngày bắt đầu và kết thúc chính xác
        import calendar
        if year == 2025 and month_num < start_date.month:
            continue
        
        month_start = datetime(year, month_num, 1)
        days_in_month = calendar.monthrange(year, month_num)[1]
        month_end = datetime(year, month_num, min(days_in_month, 28))
        
        # Kiểm tra phạm vi
        if month_start < start_date:
            month_start = start_date
        if month_end > end_date:
            month_end = end_date
        if month_start > month_end:
            continue

        for _ in range(month_count):
            # Chọn category theo weight
            cat = np.random.choice(categories, p=cat_probs)
            
            # Chọn product theo weight trong category
            prods = products_catalog[cat]
            prod_names = list(prods.keys())
            prod_weights_raw = [prods[p]["weight"] for p in prod_names]
            prod_weights_sum = sum(prod_weights_raw)
            prod_probs = [w / prod_weights_sum for w in prod_weights_raw]
            prod_name = np.random.choice(prod_names, p=prod_probs)
            prod_info = prods[prod_name]

            # Giá realistic với biến thiên nhỏ
            price_low, price_high = prod_info["price_range"]
            unit_price = random.randint(price_low, price_high)
            # Làm tròn giá đến 1000 VND
            unit_price = round(unit_price / 1000) * 1000

            # Quantity phụ thuộc giá: sản phẩm đắt mua ít hơn
            if unit_price > 20_000_000:
                quantity = random.choices([1, 2, 3], weights=[60, 30, 10])[0]
            elif unit_price > 5_000_000:
                quantity = random.choices([1, 2, 3, 4, 5], weights=[30, 30, 20, 15, 5])[0]
            else:
                quantity = random.choices([1, 2, 3, 4, 5, 6, 7, 8, 10], weights=[15, 20, 20, 15, 10, 8, 5, 4, 3])[0]

            # Ngày bán - random trong tháng, tránh cuối tuần ít hơn
            days_range = (month_end - month_start).days
            if days_range <= 0:
                sale_date = month_start
            else:
                day_offset = random.randint(0, days_range)
                sale_date = month_start + timedelta(days=day_offset)
            
            # Weekend giảm xác suất (nhưng vẫn có)
            if sale_date.weekday() >= 5:
                if random.random() < 0.3:  # 30% skip weekend
                    day_offset = random.randint(0, days_range)
                    sale_date = month_start + timedelta(days=day_offset)

            # Customer rating: phân bố hợp lý (4-5 sao chiếm đa số)
            rating = random.choices([1, 2, 3, 4, 5], weights=[3, 5, 15, 35, 42])[0]

            # Status: 80% Completed, 13% Pending, 7% Cancelled
            status = random.choices(
                ["Completed", "Pending", "Cancelled"],
                weights=[80, 13, 7]
            )[0]

            # Supplier 
            supplier = random.choice(supplier_mapping[cat])

            data.append({
                "transaction_id": str(uuid.uuid4()),
                "product_name": prod_name,
                "category": cat,
                "quantity": quantity,
                "unit_price": unit_price,
                "sale_date": sale_date.strftime("%Y-%m-%d"),
                "customer_rating": rating,
                "status": status,
                "supplier_name": supplier,
            })

    df = pd.DataFrame(data)

    print(f"Generated {len(df)} clean records. Introducing Bronze-level noise...")

    # === INTRODUCE BRONZE LEVEL NOISE (deliberate errors) ===

    # 1. Missing values (~5% cho quantity, ~3% cho customer_rating)
    mask_qty = np.random.rand(len(df)) < 0.05
    df.loc[mask_qty, "quantity"] = np.nan
    missing_qty = mask_qty.sum()

    mask_rating = np.random.rand(len(df)) < 0.03
    df.loc[mask_rating, "customer_rating"] = np.nan
    missing_rating = mask_rating.sum()

    # 2. Duplicates (~3%)
    num_duplicates = int(len(df) * 0.03)
    if num_duplicates > 0:
        duplicate_indices = np.random.choice(df.index, size=num_duplicates, replace=False)
        duplicates = df.loc[duplicate_indices]
        df = pd.concat([df, duplicates], ignore_index=True)

    # 3. A few price outliers (~1%) - giá bị nhân 10 (lỗi nhập liệu)
    mask_outlier = np.random.rand(len(df)) < 0.01
    df.loc[mask_outlier, "unit_price"] = df.loc[mask_outlier, "unit_price"] * 10
    outlier_count = mask_outlier.sum()

    # 4. Some invalid quantity values (~2%)
    df["quantity"] = df["quantity"].astype(object)
    mask_invalid = np.random.rand(len(df)) < 0.02
    df.loc[mask_invalid, "quantity"] = "N/A"
    invalid_count = mask_invalid.sum()

    # 5. Inconsistent date format (~2%)
    mask_date = np.random.rand(len(df)) < 0.02
    for idx in df.index[mask_date]:
        original_date = df.at[idx, "sale_date"]
        try:
            d = datetime.strptime(original_date, "%Y-%m-%d")
            # Đổi format: DD/MM/YYYY hoặc MM-DD-YYYY
            if random.random() < 0.5:
                df.at[idx, "sale_date"] = d.strftime("%d/%m/%Y")
            else:
                df.at[idx, "sale_date"] = d.strftime("%m-%d-%Y")
        except (ValueError, TypeError):
            pass

    # Shuffle data ngẫu nhiên
    df = df.sample(frac=1).reset_index(drop=True)

    # Save to CSV
    df.to_csv(output_path, index=False)
    
    print(f"\n=== GENERATION REPORT ===")
    print(f"Total records: {len(df)}")
    print(f"Missing quantity: {missing_qty}")
    print(f"Missing rating: {missing_rating}")
    print(f"Duplicates added: {num_duplicates}")
    print(f"Price outliers: {outlier_count}")
    print(f"Invalid quantity: {invalid_count}")
    print(f"Products: {df['product_name'].nunique()}")
    print(f"Categories: {df['category'].nunique()}")
    print(f"Date range: {df['sale_date'].min()} to {df['sale_date'].max()}")
    print(f"\nCategory distribution:")
    print(df['category'].value_counts().to_string())
    print(f"\nStatus distribution:")
    print(df['status'].value_counts().to_string())
    print(f"\n[SUCCESS] Saved to {output_path}")


if __name__ == "__main__":
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    output_file = os.path.join(output_dir, "sample_bronze_data.csv")
    generate_bronze_sales_data(num_records=5000, output_path=output_file)
