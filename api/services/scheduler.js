const { updateAllRaceStatus } = require('./raceStatusChecker');

// 每6小时更新一次所有赛事状态
setInterval(async () => {
  console.log('开始定时更新赛事报名状态...');
  try {
    await updateAllRaceStatus();
    console.log('赛事状态更新完成');
  } catch (error) {
    console.error('定时更新失败:', error);
  }
}, 6 * 60 * 60 * 1000);

// 启动时立即执行一次
(async () => {
  console.log('服务启动，立即更新赛事状态...');
  try {
    await updateAllRaceStatus();
    console.log('初始更新完成');
  } catch (error) {
    console.error('初始更新失败:', error);
  }
})();
