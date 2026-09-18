const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 注册
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' });
    }

    // 检查邮箱是否已注册
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: '该邮箱已注册' });
    }

    // 密码加密
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 插入用户
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, passwordHash]
    );

    // 创建用户资料
    await pool.query(
      'INSERT INTO user_profiles (user_id) VALUES (?)',
      [result.insertId]
    );

    res.json({ message: '注册成功', userId: result.insertId });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' });
    }

    // 查找用户
    const [users] = await pool.query(
      'SELECT id, email, password_hash, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const user = users[0];

    // 验证密码
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 生成token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.email, u.role, p.nickname, p.city, p.best_marathon_time, p.avatar_url
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const user = users[0];
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      profile: {
        nickname: user.nickname,
        city: user.city,
        bestMarathonTime: user.best_marathon_time,
        avatarUrl: user.avatar_url
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// 更新用户资料
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { nickname, city, bestMarathonTime, avatarUrl } = req.body;

    await pool.query(
      `UPDATE user_profiles 
       SET nickname = ?, city = ?, best_marathon_time = ?, avatar_url = ?
       WHERE user_id = ?`,
      [nickname, city, bestMarathonTime, avatarUrl, req.user.id]
    );

    res.json({ message: '资料更新成功' });
  } catch (error) {
    console.error('更新资料失败:', error);
    res.status(500).json({ error: '更新资料失败' });
  }
});

module.exports = router;
