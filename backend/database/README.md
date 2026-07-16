# DSS Database

## Migrations

Chạy lần lượt các file trong thư mục `migrations/` để setup database:

```bash
psql -U postgres -d dss_db -f migrations/001_initial_schema.sql
psql -U postgres -d dss_db -f migrations/002_seed_data.sql
```

Đảm bảo database `dss_db` đã tồn tại trước khi chạy.
