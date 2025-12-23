# PostgreSQL 检查脚本
Write-Host "========================================"
Write-Host "PostgreSQL 安装检查工具"
Write-Host "========================================"
Write-Host ""

# 检查PostgreSQL安装目录
Write-Host "1. 检查PostgreSQL安装..." -ForegroundColor Green
$postgresPath = "C:\Program Files\PostgreSQL"

if (Test-Path $postgresPath) {
    Write-Host "[OK] 发现PostgreSQL安装目录: $postgresPath" -ForegroundColor Green
    $versions = Get-ChildItem $postgresPath -Directory | Select-Object -ExpandProperty Name
    Write-Host "    已安装版本: $($versions -join ', ')" -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] 未找到PostgreSQL安装目录" -ForegroundColor Red
    Write-Host ""
    Write-Host "请下载并安装PostgreSQL:" -ForegroundColor Yellow
    Write-Host "https://www.enterprisedb.com/downloads/postgres-postgresql-downloads" -ForegroundColor White
    Write-Host ""
    Write-Host "详细安装指南: backend/POSTGRESQL_QUICK_FIX.md" -ForegroundColor Cyan
    exit
}

Write-Host ""

# 检查psql命令
Write-Host "2. 检查psql命令..." -ForegroundColor Green
$psqlCommand = Get-Command psql -ErrorAction SilentlyContinue

if ($psqlCommand) {
    $psqlVersion = & psql --version
    Write-Host "[OK] psql命令可用: $psqlVersion" -ForegroundColor Green
} else {
    Write-Host "[ERROR] psql命令不可用" -ForegroundColor Red
    Write-Host "    需要添加到PATH: C:\Program Files\PostgreSQL\14\bin" -ForegroundColor Yellow
}

Write-Host ""

# 检查服务
Write-Host "3. 检查PostgreSQL服务..." -ForegroundColor Green
$services = Get-Service | Where-Object { $_.Name -like "*postgresql*" }

if ($services) {
    foreach ($service in $services) {
        $status = $service.Status
        if ($status -eq "Running") {
            Write-Host "[OK] 服务 $($service.Name) 正在运行" -ForegroundColor Green
        } else {
            Write-Host "[WARNING] 服务 $($service.Name) 未运行 (状态: $status)" -ForegroundColor Yellow
            Write-Host "    启动命令: net start $($service.Name)" -ForegroundColor Cyan
        }
    }
} else {
    Write-Host "[ERROR] 未找到PostgreSQL服务" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================"
Write-Host "检查完成"
Write-Host "========================================"
Write-Host ""
Write-Host "下一步操作:" -ForegroundColor Green
Write-Host "1. 如果PostgreSQL未安装, 请查看: POSTGRESQL_QUICK_FIX.md" -ForegroundColor White
Write-Host "2. 如果已安装, 创建数据库:" -ForegroundColor White
Write-Host "   psql -U postgres -c 'CREATE DATABASE startide_design;'" -ForegroundColor Cyan
Write-Host "3. 配置 .env 文件中的 DATABASE_URL" -ForegroundColor White
Write-Host "4. 运行数据库初始化:" -ForegroundColor White
Write-Host "   npm run prisma:generate" -ForegroundColor Cyan
Write-Host "   npm run prisma:migrate" -ForegroundColor Cyan
Write-Host "   npm run prisma:seed" -ForegroundColor Cyan
Write-Host ""
