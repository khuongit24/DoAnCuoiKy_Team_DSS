import React from 'react';
import { Table, Input, Space, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import styles from './DataTable.module.css';

const { Search } = Input;

export const DataTable = React.memo(({ 
  columns, 
  dataSource, 
  loading, 
  pagination, 
  onChange,
  onSearch,
  searchPlaceholder = "Tìm kiếm...",
  rowKey = "id",
  extraActions
}) => {
  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableToolbar}>
        <div className={styles.searchSection}>
          {onSearch && (
            <Search
              placeholder={searchPlaceholder}
              allowClear
              onSearch={onSearch}
              style={{ width: 250 }}
            />
          )}
        </div>
        {extraActions && (
          <div className={styles.actionSection}>
            <Space>{extraActions}</Space>
          </div>
        )}
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey={rowKey}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
        }}
        onChange={onChange}
        className={styles.customTable}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
});

DataTable.displayName = 'DataTable';
