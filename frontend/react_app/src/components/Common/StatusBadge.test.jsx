import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders SAFE for OK status', () => {
    render(<StatusBadge status="OK" />);
    expect(screen.getByText('SAFE')).toBeInTheDocument();
  });

  it('renders SAFE for SAFE status', () => {
    render(<StatusBadge status="safe" />);
    expect(screen.getByText('SAFE')).toBeInTheDocument();
  });

  it('renders WARNING for WARNING status', () => {
    render(<StatusBadge status="WARNING" />);
    expect(screen.getByText('WARNING')).toBeInTheDocument();
  });

  it('renders CRITICAL for DANGER status', () => {
    render(<StatusBadge status="danger" />);
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });

  it('renders default text for unknown status', () => {
    render(<StatusBadge status="UNKNOWN" />);
    expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
  });
});
