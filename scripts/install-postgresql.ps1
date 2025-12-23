# PostgreSQL Windows 安装辅助脚本
# 此脚本帮助检查和引导PostgreSQL安装

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL 安装检查与引导工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否以管理员身份运行
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  警告：建议以管理员身份运行此脚本" -ForegroundColor Yellow
    Write-Host ""
}

# 1. 检查PostgreSQL是否已安装
Write-Host "1. 检查PostgreSQL安装状态..." -ForegroundColor Green

$postgresPath = "C:\Program Files\PostgreSQL"
$psqlCommand = Get-Command psql -ErrorAction SilentlyContinue

if (Test-Path $postgresPath) {
    Write-Host "✅ 发现PostgreSQL安装目录: $postgresPath" -ForegroundColor Green
    
    # 列出已安装的版本
    $versions = Get-ChildItem $postgresPath -Directory | Select-Object -ExpandProperty Name
    Write-Host "   已安装版本: $($versions -join ', ')" -ForegroundColor Cyan
} else {
    Write-Host "❌ 未找到PostgreSQL安装目录" -ForegroundColor Red
    Write-Host ""
    Write-Host "需要安装PostgreSQL。请按照以下步骤操作：" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "步骤1: 下载PostgreSQL" -ForegroundColor Cyan
    Write-Host "  访问: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads" -ForegroundColor White
    Write-Host "  推荐版本: PostgreSQL 14.x 或 15.x (Windows x86-64)" -ForegroundColor White
    Write-Host ""
    Write-Host "步骤2: 运行安装程序" -ForegroundColor Cyan
    Write-Host "  - 选择安装目录（默认即可）" -ForegroundColor White
    Write-Host "  - 勾选所有组件（Server, pgAdmin, Command Line Tools）" -ForegroundColor White
    Write-Host "  - 设置postgres用户密码（请记住！）" -ForegroundColor White
    Write-Host "  - 端口使用默认5432" -ForegroundColor White
    Write-Host ""
    Write-Host "步骤3: 安装完成后重新运行此脚本" -ForegroundColor Cyan
    Write-Host ""
    
    # 询问是否打开下载页面
    $openBrowser = Read-Host "是否现在打开下载页面? (Y/N)"
    if ($openBrowser -eq "Y" -or $openBrowser -eq "y") {
        Start-Process "https://www.enterprisedb.com/downloads/postgres-postgresql-downloads"
    }
    
    exit
}

Write-Host ""

# 2. 检查psql命令是否可用
Write-Host "2. 检查psql命令..." -ForegroundColor Green

if ($psqlCommand) {
    $psqlVersion = & psql --version
    Write-Host "✅ psql命令可用: $psqlVersion" -ForegroundColor Green
} else {
    Write-Host "❌ psql命令不可用（未添加到PATH）" -ForegroundColor Red
    Write-Host ""
    Write-Host "需要添加PostgreSQL到系统PATH：" -ForegroundColor Yellow
    
    # 尝试找到bin目录
    $binPaths = Get-ChildItem "$postgresPath\*\bin" -Directory -ErrorAction SilentlyContinue
    if ($binPaths) {
        $binPath = $binPaths[0].FullName
        Write-Host "  找到bin目录: $binPath" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "请手动添加到PATH，或运行以下命令（需要管理员权限）：" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  [Environment]::SetEnvironmentVariable('Path', `$env:Path + ';$binPath', 'Machine')" -ForegroundColor White
        Write-Host ""
        
        if ($isAdmin) {
            $addPath = Read-Host "是否现在添加到PATH? (Y/N)"
            if ($addPath -eq "Y" -or $addPath -eq "y") {
                try {
                    $currentPath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
                    if ($currentPath -notlike "*$binPath*") {
                        [Environment]::SetEnvironmentVariable('Path', $currentPath + ";$binPath", 'Machine')
                        Write-Host "已添加到PATH, 请重新打开PowerShell窗口" -ForegroundColor Green
                    } else {
                        Write-Host "PATH中已存在此目录" -ForegroundColor Green
                    }
                } catch {
                    Write-Host "添加失败: $_" -ForegroundColor Red
                }
            }
        }
    }
}

Write-Host ""

# 3. 检查PostgreSQL服务
Write-Host "3. 检查PostgreSQL服务..." -ForegroundColor Green

$services = Get-Service | Where-Object { $_.Name -like "*postgresql*" }

if ($services) {
    foreach ($service in $services) {
        $status = $service.Status
        $statusColor = if ($status -eq "Running") { "Green" } else { "Yellow" }
        Write-Host "  服务名: $($service.Name)" -ForegroundColor Cyan
        Write-Host "  状态: $status" -ForegroundColor $statusColor
        
        if ($status -ne "Running") {
            Write-Host ""
            $startService = Read-Host "  是否启动此服务? (Y/N)"
            if ($startService -eq "Y" -or $startService -eq "y") {
                try {
                    Start-Service $service.Name
                    Write-Host "  服务已启动" -ForegroundColor Green
                } catch {
                    Write-Host "  启动失败: $_" -ForegroundColor Red
                    Write-Host "  请尝试以管理员身份运行: net start $($service.Name)" -ForegroundColor Yellow
                }
            }
        }
    }
} else {
    Write-Host "❌ 未找到PostgreSQL服务" -ForegroundColor Red
    Write-Host "   可能的原因：" -ForegroundColor Yellow
    Write-Host "   1. PostgreSQL未正确安装" -ForegroundColor White
    Write-Host "   2. 安装时未选择安装为服务" -ForegroundColor White
    Write-Host ""
    Write-Host "   建议重新安装PostgreSQL" -ForegroundColor Yellow
}

Write-Host ""

# 4. 测试数据库连接
Write-Host "4. 测试数据库连接..." -ForegroundColor Green

if ($psqlCommand -and $services -and ($services | Where-Object { $_.Status -eq "Running" })) {
    Write-Host "  尝试连接到PostgreSQL..." -ForegroundColor Cyan
    Write-Host "  （如果提示输入密码，请输入安装时设置的postgres用户密码）" -ForegroundColor Yellow
    Write-Host ""
    
    # 测试连接
    $testConnection = Read-Host "是否测试连接? (Y/N)"
    if ($testConnection -eq "Y" -or $testConnection -eq "y") {
        Write-Host ""
        Write-Host "执行命令: psql -U postgres -c '\l'" -ForegroundColor Cyan
        & psql -U postgres -c "\l"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "数据库连接成功!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "连接失败, 请检查密码是否正确" -ForegroundColor Red
        }
    }
} else {
    Write-Host "⚠️  跳过连接测试（服务未运行或psql不可用）" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "检查完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 5. 显示下一步操作
Write-Host "下一步操作：" -ForegroundColor Green
Write-Host ""
Write-Host "1. 如果PostgreSQL未安装，请按照提示下载并安装" -ForegroundColor White
Write-Host "2. 如果已安装但服务未运行，请启动服务" -ForegroundColor White
Write-Host "3. 创建项目数据库：" -ForegroundColor White
Write-Host "   psql -U postgres -c 'CREATE DATABASE startide_design;'" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. 配置项目环境变量（backend/.env）：" -ForegroundColor White
Write-Host "   DATABASE_URL=`"postgresql://postgres:你的密码@localhost:5432/startide_design?schema=public`"" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. 初始化数据库：" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Cyan
Write-Host "   npm run prisma:generate" -ForegroundColor Cyan
Write-Host "   npm run prisma:migrate" -ForegroundColor Cyan
Write-Host "   npm run prisma:seed" -ForegroundColor Cyan
Write-Host ""
Write-Host "详细安装指南请查看: backend/POSTGRESQL_WINDOWS_INSTALLATION.md" -ForegroundColor Yellow
Write-Host ""

Read-Host "按Enter键退出"
