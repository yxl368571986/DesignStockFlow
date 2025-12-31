# 数据清理脚本使用说明

## 快速开始

### 方式一：使用自动化脚本（推荐）

```powershell
# 在 backend 目录下执行
.\cleanup-production.ps1
```

脚本会自动完成：
1. ✅ 检查工具是否安装
2. ✅ 测试数据库连接
3. ✅ 自动备份数据库
4. ✅ 执行清理前验证
5. ✅ 执行数据清理
6. ✅ 执行清理后验证
7. ✅ 优化数据库

### 方式二：手动执行（更灵活）

```powershell
# 1. 设置环境变量
$env:PGPASSWORD='your_password'
$env:PGCLIENTENCODING='UTF8'

# 2. 备份数据库
pg_dump -h localhost -U postgres -d startide_design -F c -f backup.backup

# 3. 清理前验证
psql -h localhost -U postgres -d startide_design -f verify-before-cleanup.sql

# 4. 执行清理
psql -h localhost -U postgres -d startide_design -f production-data-cleanup.sql

# 5. 清理后验证
psql -h localhost -U postgres -d startide_design -f verify-after-cleanup.sql
```

## 文件说明

| 文件名 | 说明 |
|--------|------|
| `cleanup-production.ps1` | 自动化清理脚本（推荐使用） |
| `production-data-cleanup.sql` | 数据清理SQL脚本 |
| `verify-before-cleanup.sql` | 清理前验证脚本 |
| `verify-after-cleanup.sql` | 清理后验证脚本 |
| `PRODUCTION_CLEANUP_GUIDE.md` | 详细操作指南 |

## 脚本参数

```powershell
# 自定义数据库连接
.\cleanup-production.ps1 -DBHost "localhost" -DBUser "postgres" -DBName "startide_design"

# 跳过备份（不推荐）
.\cleanup-production.ps1 -SkipBackup

# 自动确认（用于自动化部署）
.\cleanup-production.ps1 -AutoConfirm

# 组合使用
.\cleanup-production.ps1 -DBHost "192.168.1.100" -DBPassword "mypassword" -AutoConfirm
```

## 清理内容

### ✅ 会被删除
- 除 `13900000000` 外的所有用户
- 所有订单和支付记录
- 所有资源（非管理员上传的）
- 所有下载和收藏记录
- 所有日志记录

### ✅ 会被保留
- 管理员账号 `13900000000`
- 系统配置（VIP套餐、充值套餐、积分规则等）
- 分类数据
- 角色和权限配置

## 安全检查

执行前请确认：
- [ ] 已阅读 `PRODUCTION_CLEANUP_GUIDE.md`
- [ ] 已备份数据库
- [ ] 管理员账号 `13900000000` 存在
- [ ] 在测试环境验证过脚本
- [ ] 了解清理的内容和影响

## 常见问题

**Q: 如果管理员账号不是 13900000000？**
```sql
-- 修改 production-data-cleanup.sql 中的手机号
WHERE phone = '你的管理员手机号'
```

**Q: 如何回滚？**
```powershell
pg_restore -h localhost -U postgres -d startide_design -c backup.backup
```

**Q: 清理失败怎么办？**
1. 查看错误信息
2. 从备份恢复
3. 检查数据库连接
4. 查看详细指南

## 获取帮助

详细说明请查看：`PRODUCTION_CLEANUP_GUIDE.md`

---

**⚠️ 重要提醒：数据无价，谨慎操作！**
