const express = require('express');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取赛事列表（按年份）
router.get('/', async (req, res) => {
  try {
    const { year } = req.query;
    
    if (!year) {
      return res.status(400).json({ error: '请提供年份' });
    }

    const [races] = await pool.query(
      `SELECT id, name, race_date, province, city, distances, 
              reg_start, reg_deadline, status, official_url
       FROM races
       WHERE year = ?
       ORDER BY race_date`,
      [year]
    );

    // 转换 JSON 字段
    const formattedRaces = races.map(race => ({
      ...race,
      distances: typeof race.distances === 'string' 
        ? JSON.parse(race.distances) 
        : race.distances,
      date: race.race_date,
      regStart: race.reg_start,
      regDeadline: race.reg_deadline
    }));

    res.json(formattedRaces);
  } catch (error) {
    console.error('获取赛事列表失败:', error);
    res.status(500).json({ error: '获取赛事列表失败' });
  }
});

// 获取可用年份
router.get('/years', async (req, res) => {
  try {
    const [years] = await pool.query(
      'SELECT DISTINCT year FROM races ORDER BY year DESC'
    );
    res.json(years.map(y => y.year));
  } catch (error) {
    console.error('获取年份列表失败:', error);
    res.status(500).json({ error: '获取年份列表失败' });
  }
});

// 获取我的赛事
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const [myRaces] = await pool.query(
      `SELECT mr.id, mr.status, mr.created_at,
              r.name as race_name, r.race_date, r.city, r.distances,
              mr.custom_name, mr.custom_date, mr.custom_city, mr.custom_distance
       FROM my_races mr
       LEFT JOIN races r ON mr.race_id = r.id
       WHERE mr.user_id = ?
       ORDER BY COALESCE(r.race_date, mr.custom_date) DESC`,
      [req.user.id]
    );

    const formatted = myRaces.map(mr => ({
      id: mr.id,
      name: mr.race_name || mr.custom_name,
      date: mr.race_date || mr.custom_date,
      city: mr.city || mr.custom_city,
      distance: mr.distances 
        ? (typeof mr.distances === 'string' ? JSON.parse(mr.distances)[0] : mr.distances[0])
        : mr.custom_distance,
      status: mr.status,
      createdAt: mr.created_at
    }));

    res.json(formatted);
  } catch (error) {
    console.error('获取我的赛事失败:', error);
    res.status(500).json({ error: '获取我的赛事失败' });
  }
});

// 添加赛事到我的列表
router.post('/my', authenticateToken, async (req, res) => {
  try {
    const { raceId, customName, customDate, customCity, customDistance } = req.body;

    if (!raceId && !customName) {
      return res.status(400).json({ error: '请选择赛事或填写自定义赛事名称' });
    }

    const [result] = await pool.query(
      `INSERT INTO my_races (user_id, race_id, custom_name, custom_date, custom_city, custom_distance)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, raceId, customName, customDate, customCity, customDistance]
    );

    res.json({ message: '赛事添加成功', id: result.insertId });
  } catch (error) {
    console.error('添加赛事失败:', error);
    res.status(500).json({ error: '添加赛事失败' });
  }
});

// 更新我的赛事状态
router.put('/my/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    await pool.query(
      'UPDATE my_races SET status = ? WHERE id = ? AND user_id = ?',
      [status, id, req.user.id]
    );

    res.json({ message: '状态更新成功' });
  } catch (error) {
    console.error('更新赛事状态失败:', error);
    res.status(500).json({ error: '更新赛事状态失败' });
  }
});

// 删除我的赛事
router.delete('/my/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'DELETE FROM my_races WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    res.json({ message: '赛事删除成功' });
  } catch (error) {
    console.error('删除赛事失败:', error);
    res.status(500).json({ error: '删除赛事失败' });
  }
});

module.exports = router;
