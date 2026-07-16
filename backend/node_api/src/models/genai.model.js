const BaseModel = require('./base.model');
const { query } = require('../config/database');

class GenAIConversationModel extends BaseModel {
    constructor() {
        super('genai_conversations', 'conversation_id');
    }

    async findRecentHistory(userId, limit = 10) {
        const sql = `
            SELECT message_role, message_content 
            FROM ${this.tableName} 
            WHERE user_id = $1 
            ORDER BY created_at DESC 
            LIMIT $2
        `;
        const { rows } = await query(sql, [userId, limit]);
        return rows.reverse(); // Đảo ngược để theo thứ tự thời gian cũ -> mới
    }
}

module.exports = new GenAIConversationModel();
