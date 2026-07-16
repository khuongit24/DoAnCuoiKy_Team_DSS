const getPaginationParams = (query, defaultLimit = 20, maxLimit = 100) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    let limit = parseInt(query.limit, 10) || defaultLimit;
    
    if (limit > maxLimit) limit = maxLimit;
    if (limit < 1) limit = defaultLimit;

    const offset = (page - 1) * limit;

    return { page, limit, offset };
};

const getPaginationMeta = (total, page, limit) => {
    return {
        total: parseInt(total, 10),
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

module.exports = {
    getPaginationParams,
    getPaginationMeta
};
