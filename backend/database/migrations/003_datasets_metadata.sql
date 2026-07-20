-- ============================================================
-- Migration: Add datasets table for Bronze/Silver/Gold metadata
-- ============================================================

CREATE TABLE IF NOT EXISTS datasets (
    dataset_id SERIAL PRIMARY KEY,
    dataset_name VARCHAR(255) NOT NULL,
    source VARCHAR(255),
    layer VARCHAR(20) NOT NULL CHECK (layer IN ('bronze', 'silver', 'gold')),
    file_path VARCHAR(255) NOT NULL,
    schema_metadata JSONB,
    algorithms_applied JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Note: update_modified_column() is already defined in 001_initial_schema.sql
CREATE TRIGGER trg_datasets_updated BEFORE UPDATE ON datasets
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
