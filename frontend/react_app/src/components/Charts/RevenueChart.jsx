import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Spin } from 'antd';

export const RevenueChart = ({ data, loading }) => {
  return (
    <Spin spinning={loading}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => `${value} Triệu VND`} />
          <Legend />
          <Line type="monotone" dataKey="value" name="Doanh số" stroke="#1890ff" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </Spin>
  );
};

export default RevenueChart;
