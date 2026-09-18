# 跑马助手 Agent

马拉松赛事日历与 AI 备赛助手，支持用户登录、赛事管理、训练计划生成。

## 功能特性

- **AI 智能备赛** - 根据目标赛事生成个性化训练计划
- **赛事日历** - 2024-2026 年全国马拉松赛事日历
- **我的赛事** - 管理个人参赛记录，支持截图识别导入
- **用户系统** - 注册登录，数据云端同步
- **后台管理** - 赛事数据管理，用户管理

## 技术栈

- **前端**: HTML5 + CSS3 + JavaScript (原生)
- **后端**: Node.js + Express
- **数据库**: MySQL 8.0
- **部署**: Docker + Docker Compose + Nginx

## 快速部署

### 方式一：Docker Compose（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/liujian2020/marathon-assistant.git
cd marathon-assistant

# 2. 启动所有服务
docker-compose up -d

# 3. 访问应用
# 前端: http://localhost:80
# API: http://localhost:3000
```

### 方式二：本地开发

```bash
# 1. 安装依赖
cd api
npm install

# 2. 配置环境变量
cp ../.env.example ../.env
# 编辑 .env 文件，配置数据库连接

# 3. 初始化数据库
mysql -u root -p < db/init.sql

# 4. 启动后端
npm start

# 5. 启动前端（另开终端）
cd ..
python3 -m http.server 8080
```

## 默认账号

- **管理员**: admin@marathon.com / admin123
- 首次登录后请立即修改密码

## 目录结构

```
.
├── index.html              # 前端页面
├── data/                   # 赛事数据（JSON）
│   ├── races-2024.json
│   ├── races-2025.json
│   └── races-2026.json
├── api/                    # 后端 API
│   ├── server.js          # Express 入口
│   ├── routes/            # 路由
│   │   ├── auth.js       # 认证相关
│   │   └── races.js      # 赛事相关
│   ├── middleware/        # 中间件
│   │   └── auth.js       # JWT 认证
│   └── db/                # 数据库
│       ├── init.sql      # 初始化脚本
│       └── pool.js       # 连接池
├── nginx/                  # Nginx 配置
│   └── default.conf
├── docker-compose.yml      # Docker 编排
└── .env                    # 环境变量
```

## API 接口

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户

### 赛事
- `GET /api/races?year=2026` - 获取赛事列表
- `GET /api/races/years` - 获取可用年份
- `GET /api/races/my` - 获取我的赛事
- `POST /api/races/my` - 添加赛事
- `PUT /api/races/my/:id` - 更新赛事状态
- `DELETE /api/races/my/:id` - 删除赛事

## 环境变量

```env
# 数据库配置
DB_HOST=db
DB_PORT=3306
DB_USER=root
DB_PASSWORD=marathon2026
DB_NAME=marathon_assistant

# JWT 密钥（生产环境请修改）
JWT_SECRET=your-secret-key-change-in-production-marathon-2026

# 服务端口
PORT=3000
```

## 生产部署建议

1. **修改 JWT_SECRET** - 使用强随机字符串
2. **修改数据库密码** - 更新 .env 和 docker-compose.yml
3. **配置 HTTPS** - 使用 Let's Encrypt 或云服务商证书
4. **关闭数据库公网访问** - 仅允许内网连接
5. **启用日志** - 配置 Nginx 和 Node.js 日志
6. **定期备份** - 数据库定时备份脚本

## 开发计划

- [x] 基础赛事日历
- [x] AI 备赛方案生成
- [x] 用户登录系统
- [x] Docker 部署
- [ ] 后台管理界面
- [ ] 赛事数据批量导入
- [ ] 训练计划可视化
- [ ] 移动端适配优化

## License

MIT
