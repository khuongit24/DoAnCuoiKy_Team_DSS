import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export const InventoryBarChart = ({ data, bars = [], height = "100%", margin = { top: 10, right: 10, left: -20, bottom: 0 }, xAxisKey = "name", tickProps = { fontSize: 10 }, tooltipFormatter }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={margin}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey={xAxisKey} tick={tickProps} />
        <YAxis />
        {tooltipFormatter ? (
          <RechartsTooltip formatter={tooltipFormatter} />
        ) : (
          <RechartsTooltip />
        )}
        <Legend />
        {bars.map((bar, index) => (
          <Bar key={index} dataKey={bar.dataKey} name={bar.name || bar.dataKey} fill={bar.fill} stackId={bar.stackId} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default InventoryBarChart;
