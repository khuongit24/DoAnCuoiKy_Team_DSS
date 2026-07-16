class EOQROPService {
    calculateEOQ(annualDemand, orderingCost, holdingCost) {
        if (annualDemand <= 0 || orderingCost <= 0 || holdingCost <= 0) {
            throw new Error('Tất cả tham số phải > 0');
        }
        const eoq = Math.ceil(Math.sqrt((2 * annualDemand * orderingCost) / holdingCost));
        const ordersPerYear = annualDemand / eoq;
        const annualOrderingCost = ordersPerYear * orderingCost;
        const annualHoldingCost = (eoq / 2) * holdingCost;
        const totalAnnualCost = annualOrderingCost + annualHoldingCost;
        return {
            eoq,
            orders_per_year: Math.round(ordersPerYear * 100) / 100,
            annual_ordering_cost: Math.round(annualOrderingCost),
            annual_holding_cost: Math.round(annualHoldingCost),
            total_annual_cost: Math.round(totalAnnualCost)
        };
    }

    calculateSafetyStock(serviceLevel, demandStdDev, leadTime) {
        const Z_SCORES = {
            0.85: 1.036, 0.90: 1.282, 0.95: 1.645, 0.975: 1.960, 0.99: 2.326
        };
        const z = Z_SCORES[serviceLevel];
        if (!z) throw new Error('Service level không hợp lệ. Chọn: 0.85, 0.90, 0.95, 0.975, 0.99');
        return Math.ceil(z * demandStdDev * Math.sqrt(leadTime));
    }

    calculateROP(dailyDemand, leadTime, safetyStock) {
        if (dailyDemand < 0 || leadTime < 0 || safetyStock < 0) {
            throw new Error('Các tham số phải >= 0');
        }
        const demandDuringLeadTime = dailyDemand * leadTime;
        const rop = Math.ceil(demandDuringLeadTime + safetyStock);
        return {
            rop,
            demand_during_lead_time: Math.round(demandDuringLeadTime),
            safety_stock: safetyStock
        };
    }

    getStockStatus(currentStock, rop, safetyStock) {
        if (currentStock <= safetyStock) return 'CRITICAL';
        if (currentStock <= rop) return 'WARNING';
        return 'SAFE';
    }

    getDemandStdDev(dailySalesArray) {
        if (!Array.isArray(dailySalesArray) || dailySalesArray.length < 2) {
             throw new Error('Cần ít nhất 2 ngày dữ liệu bán hàng để tính độ lệch chuẩn');
        }
        const n = dailySalesArray.length;
        const mean = dailySalesArray.reduce((sum, val) => sum + val, 0) / n;
        const squaredDiffs = dailySalesArray.map(val => Math.pow(val - mean, 2));
        const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / (n - 1);
        return Math.sqrt(variance);
    }
    
    getFullRecommendation(annualDemand, orderingCost, holdingCost, dailyDemand, leadTime, serviceLevel, demandStdDev, currentStock) {
        const eoqResult = this.calculateEOQ(annualDemand, orderingCost, holdingCost);
        const safetyStock = this.calculateSafetyStock(serviceLevel, demandStdDev, leadTime);
        const ropResult = this.calculateROP(dailyDemand, leadTime, safetyStock);
        const status = this.getStockStatus(currentStock, ropResult.rop, safetyStock);
        return {
            eoq_result: eoqResult,
            rop_result: ropResult,
            stock_status: status,
            recommendation_message: status === 'CRITICAL' ? 'Đặt hàng khẩn cấp ngay lập tức' :
                                    status === 'WARNING' ? 'Lên kế hoạch đặt hàng' : 'Không cần hành động'
        };
    }
}
module.exports = new EOQROPService();
