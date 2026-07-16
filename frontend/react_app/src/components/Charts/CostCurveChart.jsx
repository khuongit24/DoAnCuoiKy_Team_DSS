import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export const CostCurveChart = ({ data, formatVND }) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="quantity" label={{ value: 'Số lượng đặt (Q)', position: 'insideBottom', offset: -10 }} />
        <YAxis tickFormatter={(val) => `${(val/1000000).toFixed(1)}M`} />
        <RechartsTooltip 
          formatter={(value) => (formatVND ? formatVND(value) : value)} 
          labelFormatter={(val) => `Số lượng: ${val}`} 
        />
        <Legend verticalAlign="top" />
        <Line type="monotone" dataKey="totalCost" name="Tổng chi phí" stroke="#ff4d4f" strokeWidth={3} dot={false} />
        <Line type="monotone" dataKey="holdingCost" name="CP Lưu kho" stroke="#1890ff" strokeDasharray="5 5" dot={false} />
        <Line type="monotone" dataKey="orderingCost" name="CP Đặt hàng" stroke="#52c41a" strokeDasharray="5 5" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default CostCurveChart;
