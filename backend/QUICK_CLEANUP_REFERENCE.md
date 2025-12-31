# 数据清理快速参考

## 🚀 一键执行

```powershell
cd backend
.\cleanup-production.ps1
```

## 📋 执行清单

```
□ 1. 阅读 PRODUCTION_CLEANUP_GUIDE.md
□ 2. 备份数据库
□ 3. 执行清理前验证
□ 4. 确认清理内容
□ 5. 执行数据清理
□ 6. 执行清理后验证
□ 7. 功能测试
```

## 🔧 手动命令

```powershell
# 环境变量
$env:PGPASSWORD='password'; $env:PGCLIENTENCODING='UTF8'

# 备份
pg_dump -h localhost -U postgres -d startide_design -F c -f backup.backup

# 验证
psql -h localhost -U postgres -d startide_design -f verify-before-cleanup.sql

# 清理
psql -h localhost -U postgres -d startide_design -f production-data-cleanup.sql

# 验证
psql -h localhost -U postgres -d startide_design -f verify-after-cleanup.sql

# 优化
psql -h localhost -U postgres -d startide_design -c "VACUUM ANALYZE;"
```

## 🔄 回滚

```powershell
pg_restore -h localhost -U postgres -d startide_design -c backup.backup
```

## ✅ 验证点

- [ ] 管理员账号 13900000000 存在
- [ ] 用户总数 = 1
- [ ] 系统配置完整
- [ ] 分类资源计数正确
- [ ] 无孤立数据
- [ ] 管理员可以登录

## 📞 紧急联系

如遇问题：
1. 立即停止操作
2. 从备份恢复
3. 查看错误日志
4. 联系技术支持

---

**保留账号：13900000000**
