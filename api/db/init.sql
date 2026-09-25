-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 用户资料表
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id INT PRIMARY KEY,
  nickname VARCHAR(100),
  city VARCHAR(100),
  best_marathon_time VARCHAR(50),
  avatar_url VARCHAR(500),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 赛事表（替代 JSON 文件）
CREATE TABLE IF NOT EXISTS races (
  id INT AUTO_INCREMENT PRIMARY KEY,
  year INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  race_date DATE NOT NULL,
  province VARCHAR(50),
  city VARCHAR(100),
  distances JSON,
  reg_start DATE,
  reg_deadline DATE,
  status ENUM('upcoming', 'open', 'closed') DEFAULT 'closed',
  official_url VARCHAR(500),
  logo_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_year (year),
  INDEX idx_date (race_date)
);

-- 我的赛事表
CREATE TABLE IF NOT EXISTS my_races (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  race_id INT,
  custom_name VARCHAR(200),
  custom_date DATE,
  custom_city VARCHAR(100),
  custom_distance VARCHAR(50),
  status ENUM('planned', 'registered', 'completed') DEFAULT 'planned',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE SET NULL
);

-- 管理员日志表
CREATE TABLE IF NOT EXISTS admin_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 赛事报名状态缓存表
CREATE TABLE IF NOT EXISTS race_status_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  race_id INT NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE,
  INDEX idx_expires (expires_at)
);

-- 插入默认管理员（密码: admin123）
INSERT INTO users (email, password_hash, role) VALUES 
('admin@marathon.com', '$2a$10$rDqH8xKZJZm5XZm5XZm5XOq5XZm5XZm5XZm5XZm5XZm5XZm5XZm5', 'admin')
ON DUPLICATE KEY UPDATE email=email;

-- 插入示例赛事数据（2026年）
INSERT INTO races (year, name, race_date, province, city, distances, reg_start, reg_deadline, status, official_url) VALUES
(2026, '厦门马拉松', '2026-01-05', '福建', '厦门', '["全程马拉松"]', '2025-11-01', '2025-11-30', 'closed', 'http://www.xmmarathon.com'),
(2026, '重庆马拉松', '2026-03-22', '重庆', '重庆', '["全程马拉松","半程马拉松"]', '2026-01-15', '2026-02-15', 'closed', 'http://www.cqmarathon.com'),
(2026, '无锡马拉松', '2026-03-22', '江苏', '无锡', '["全程马拉松","半程马拉松"]', '2026-01-20', '2026-02-20', 'closed', 'http://www.wuximarathon.com'),
(2026, '武汉马拉松', '2026-04-12', '湖北', '武汉', '["全程马拉松","半程马拉松"]', '2026-02-01', '2026-03-01', 'closed', 'http://www.wuhanmarathon.org'),
(2026, '北京马拉松', '2026-11-01', '北京', '北京', '["全程马拉松"]', '2026-08-15', '2026-09-15', 'upcoming', 'http://www.beijing-marathon.com');
