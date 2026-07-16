const eoqRopService = require('../../src/services/eoqRopService');

describe('EOQ ROP Service', () => {
    describe('calculateEOQ', () => {
        it('should calculate EOQ correctly for normal values', () => {
            const result = eoqRopService.calculateEOQ(1800, 500000, 120000);
            expect(result.eoq).toBe(123);
            expect(result.orders_per_year).toBeCloseTo(14.63, 2);
        });

        it('should throw error for zero demand', () => {
            expect(() => eoqRopService.calculateEOQ(0, 500000, 120000)).toThrow('Tất cả tham số phải > 0');
        });

        it('should throw error for negative costs', () => {
            expect(() => eoqRopService.calculateEOQ(1800, -100, 120000)).toThrow('Tất cả tham số phải > 0');
        });
    });

    describe('calculateSafetyStock', () => {
        it('should calculate correctly for 95% service level', () => {
            const result = eoqRopService.calculateSafetyStock(0.95, 10, 4);
            expect(result).toBe(Math.ceil(1.645 * 10 * 2)); // 33
        });

        it('should throw error for invalid service level', () => {
            expect(() => eoqRopService.calculateSafetyStock(0.999, 10, 4)).toThrow('Service level không hợp lệ');
        });
    });

    describe('calculateROP', () => {
        it('should calculate ROP correctly', () => {
            const result = eoqRopService.calculateROP(5, 7, 15);
            expect(result.rop).toBe(50);
        });

        it('should throw error for negative values', () => {
            expect(() => eoqRopService.calculateROP(-5, 7, 15)).toThrow('Các tham số phải >= 0');
        });
    });

    describe('getStockStatus', () => {
        it('should return CRITICAL if stock <= safety stock', () => {
            expect(eoqRopService.getStockStatus(10, 50, 15)).toBe('CRITICAL');
        });

        it('should return WARNING if safety stock < stock <= ROP', () => {
            expect(eoqRopService.getStockStatus(30, 50, 15)).toBe('WARNING');
        });

        it('should return SAFE if stock > ROP', () => {
            expect(eoqRopService.getStockStatus(60, 50, 15)).toBe('SAFE');
        });
    });

    describe('getDemandStdDev', () => {
        it('should calculate std dev correctly', () => {
            // Data: [2, 4, 4, 4, 5, 5, 7, 9] -> mean=5, var=4.57, std=2.138
            const data = [2, 4, 4, 4, 5, 5, 7, 9];
            const std = eoqRopService.getDemandStdDev(data);
            expect(std).toBeCloseTo(2.138, 3);
        });

        it('should throw error for array length < 2', () => {
            expect(() => eoqRopService.getDemandStdDev([5])).toThrow('Cần ít nhất 2 ngày dữ liệu');
        });
    });
});
