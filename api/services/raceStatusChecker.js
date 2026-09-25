const axios = require('axios');
const cheerio = require('cheerio');
const pool = require('../db/pool');

// 报名平台URL映射
const registrationPlatforms = {
  // 马拉马拉
  'maramara': {
    baseUrl: 'https://www.maramara.com',
    checkStatus: async (raceName) => {
      try {
        const searchUrl = `https://www.maramara.com/search?q=${encodeURIComponent(raceName)}`;
        const { data } = await axios.get(searchUrl, { timeout: 5000 });
        const $ = cheerio.load(data);
        
        // 查找赛事卡片
        const raceCard = $('.race-card').first();
        if (raceCard.length === 0) return null;
        
        const statusText = raceCard.find('.status').text().trim();
        if (statusText.includes('报名中')) return 'open';
        if (statusText.includes('已截止')) return 'closed';
        if (statusText.includes('即将')) return 'upcoming';
        return 'unknown';
      } catch (error) {
        console.error(`马拉马拉查询失败: ${error.message}`);
        return null;
      }
    }
  },
  
  // 数字心动
  'sportnano': {
    baseUrl: 'https://www.sportnano.com',
    checkStatus: async (raceName) => {
      try {
        const searchUrl = `https://www.sportnano.com/search?keyword=${encodeURIComponent(raceName)}`;
        const { data } = await axios.get(searchUrl, { timeout: 5000 });
        const $ = cheerio.load(data);
        
        const raceItem = $('.race-item').first();
        if (raceItem.length === 0) return null;
        
        const statusText = raceItem.find('.race-status').text().trim();
        if (statusText.includes('报名中')) return 'open';
        if (statusText.includes('报名截止')) return 'closed';
        return 'unknown';
      } catch (error) {
        console.error(`数字心动查询失败: ${error.message}`);
        return null;
      }
    }
  },
  
  // 官网直接查询（示例）
  'official': {
    checkStatus: async (raceUrl) => {
      try {
        const { data } = await axios.get(raceUrl, { timeout: 5000 });
        const $ = cheerio.load(data);
        
        // 通用逻辑：查找包含"报名"的按钮或链接
        const buttons = $('button, a').filter((i, el) => {
          const text = $(el).text().trim();
          return text.includes('报名') || text.includes('立即报名');
        });
        
        if (buttons.length > 0) {
          const buttonText = buttons.first().text().trim();
          if (buttonText.includes('截止') || buttonText.includes('结束')) return 'closed';
          return 'open';
        }
        
        return 'unknown';
      } catch (error) {
        console.error(`官网查询失败: ${error.message}`);
        return null;
      }
    }
  }
};

// 检查赛事报名状态
async function checkRaceStatus(raceId) {
  const [races] = await pool.query(
    'SELECT id, name, official_url FROM races WHERE id = ?',
    [raceId]
  );
  
  if (races.length === 0) return null;
  const race = races[0];
  
  // 先查缓存
  const [cached] = await pool.query(
    'SELECT status FROM race_status_cache WHERE race_id = ? AND expires_at > NOW()',
    [raceId]
  );
  
  if (cached.length > 0) {
    return cached[0].status;
  }
  
  // 尝试多个平台查询
  let status = null;
  
  // 1. 先查马拉马拉
  status = await registrationPlatforms.maramara.checkStatus(race.name);
  
  // 2. 如果没查到，查数字心动
  if (!status || status === 'unknown') {
    status = await registrationPlatforms.sportnano.checkStatus(race.name);
  }
  
  // 3. 如果有官网URL，直接查官网
  if ((!status || status === 'unknown') && race.official_url) {
    status = await registrationPlatforms.official.checkStatus(race.official_url);
  }
  
  // 如果还是没查到，使用默认状态
  if (!status || status === 'unknown') {
    status = 'unknown';
  }
  
  // 缓存结果（1小时过期）
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO race_status_cache (race_id, status, expires_at) 
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE status = ?, expires_at = ?, checked_at = NOW()`,
    [raceId, status, expiresAt, status, expiresAt]
  );
  
  return status;
}

// 批量更新所有赛事状态
async function updateAllRaceStatus() {
  const [races] = await pool.query('SELECT id FROM races');
  
  for (const race of races) {
    try {
      await checkRaceStatus(race.id);
      // 避免请求过快被封
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`更新赛事 ${race.id} 状态失败:`, error);
    }
  }
}

module.exports = {
  checkRaceStatus,
  updateAllRaceStatus
};
