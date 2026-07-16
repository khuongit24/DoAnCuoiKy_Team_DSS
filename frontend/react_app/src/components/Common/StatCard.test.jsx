import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('renders title and value correctly', () => {
    render(<StatCard title="Total Revenue" value={10000} />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('10,000')).toBeInTheDocument();
  });

  it('renders prefix and suffix correctly', () => {
    render(<StatCard title="Revenue" value={10000} prefix="$" suffix="USD" />);
    expect(screen.getByText('$')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
  });

  it('renders positive trend correctly', () => {
    render(<StatCard title="Revenue" value={10000} trend={15} />);
    expect(screen.getByText('15%')).toBeInTheDocument();
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('renders negative trend correctly', () => {
    render(<StatCard title="Revenue" value={10000} trend={-10} />);
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });
});
