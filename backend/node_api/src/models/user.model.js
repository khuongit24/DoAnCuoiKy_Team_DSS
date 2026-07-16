const { query } = require('../config/database');

class UserModel {
    static async findByEmail(email) {
        const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
        return rows[0];
    }

    static async findByUsername(username) {
        const { rows } = await query('SELECT * FROM users WHERE username = $1', [username]);
        return rows[0];
    }

    static async findById(id) {
        const { rows } = await query('SELECT * FROM users WHERE user_id = $1', [id]);
        return rows[0];
    }

    static async create(userData) {
        const { username, email, password_hash, full_name, role } = userData;
        const { rows } = await query(
            `INSERT INTO users (username, email, password_hash, full_name, role) 
             VALUES ($1, $2, $3, $4, $5) RETURNING user_id, username, email, full_name, role, is_active, created_at`,
            [username, email, password_hash, full_name, role]
        );
        return rows[0];
    }

    static async updateRefreshToken(userId, token) {
        await query(
            `UPDATE users SET refresh_token = $1, last_login = NOW() WHERE user_id = $2`,
            [token, userId]
        );
    }
}

module.exports = UserModel;
