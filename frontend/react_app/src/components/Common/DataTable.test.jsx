import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataTable } from './DataTable';

describe('DataTable', () => {
  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Age', dataIndex: 'age', key: 'age' },
  ];
  const dataSource = [
    { id: 1, name: 'John Brown', age: 32 },
    { id: 2, name: 'Jim Green', age: 42 },
  ];

  it('renders table with columns and data', () => {
    render(<DataTable columns={columns} dataSource={dataSource} />);
    expect(screen.getAllByText('Name').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Age').length).toBeGreaterThan(0);
    expect(screen.getByText('John Brown')).toBeInTheDocument();
    expect(screen.getByText('Jim Green')).toBeInTheDocument();
  });

  it('renders search input when onSearch is provided', () => {
    const onSearchMock = vi.fn();
    render(<DataTable columns={columns} dataSource={dataSource} onSearch={onSearchMock} searchPlaceholder="Search text..." />);
    
    const searchInput = screen.getByPlaceholderText('Search text...');
    expect(searchInput).toBeInTheDocument();
  });
});
