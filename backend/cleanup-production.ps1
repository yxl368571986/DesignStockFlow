# ==========================================
# 生产环境数据清理自动化脚本
# ==========================================

param(
    [string]$DBHost = "localhost",
    [string]$DBUser = "postgres",
    [string]$DBName = "startide_design",
    [string]$DBPassword = "",
    [switch]$SkipBackup = $false,
    [switch]$AutoConfirm = $false
)

# 颜色输出函数
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# 错误处理
$ErrorActionPreference = "Stop"

# 显示标题
Write-ColorOutput "`n========================================" "Cyan"
Write-ColorOutput "生产环境数据清理脚本" "Cyan"
Write-ColorOutput "========================================`n" "Cyan"

# 检查必要的工具
Write-ColorOutput "检查必要工具..." "Yellow"
try {
    $null = Get-Command psql -ErrorAction Stop
    $null = Get-Command pg_dump -ErrorAction Stop
    Write-ColorOutput "✓ PostgreSQL 工具已安装`n" "Green"
} catch {
    Write-ColorOutput "✗ 错误：未找到 PostgreSQL 工具（psql, pg_dump）" "Red"
    Write-ColorOutput "请先安装 PostgreSQL 客户端工具" "Red"
    exit 1
}

# 获取数据库密码
if ([string]::IsNullOrEmpty($DBPassword)) {
    $SecurePassword = Read-Host "请输入数据库密码" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
    $DBPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

# 设置环境变量
$env:PGPASSWORD = $DBPassword
$env:PGCLIENTENCODING = 'UTF8'

# 测试数据库连接
Write-ColorOutput "测试数据库连接..." "Yellow"
try {
    $result = psql -h $DBHost -U $DBUser -d $DBName -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "连接失败"
    }
    Write-ColorOutput "✓ 数据库连接成功`n" "Green"
} catch {
    Write-ColorOutput "✗ 错误：无法连接到数据库" "Red"
    Write-ColorOutput "请检查数据库连接信息是否正确" "Red"
    exit 1
}

# 步骤 1: 备份数据库
if (-not $SkipBackup) {
    Write-ColorOutput "========================================" "Cyan"
    Write-ColorOutput "步骤 1: 备份数据库" "Cyan"
    Write-ColorOutput "========================================`n" "Cyan"
    
    $BackupFile = "backup_before_cleanup_$(Get-Date -Format 'yyyyMMdd_HHmmss').backup"
    Write-ColorOutput "正在备份数据库到: $BackupFile" "Yellow"
    
    try {
        pg_dump -h $DBHost -U $DBUser -d $DBName -F c -f $BackupFile
        if ($LASTEXITCODE -eq 0) {
            $BackupSize = (Get-Item $BackupFile).Length / 1MB
            Write-ColorOutput "✓ 备份完成！文件大小: $([math]::Round($BackupSize, 2)) MB`n" "Green"
        } else {
            throw "备份失败"
        }
    } catch {
        Write-ColorOutput "✗ 错误：备份失败" "Red"
        Write-ColorOutput $_.Exception.Message "Red"
        exit 1
    }
} else {
    Write-ColorOutput "⚠ 警告：跳过备份步骤（不推荐）`n" "Yellow"
}

# 步骤 2: 清理前验证
Write-ColorOutput "========================================" "Cyan"
Write-ColorOutput "步骤 2: 清理前验证" "Cyan"
Write-ColorOutput "========================================`n" "Cyan"

try {
    psql -h $DBHost -U $DBUser -d $DBName -f verify-before-cleanup.sql
    Write-ColorOutput "`n✓ 验证完成`n" "Green"
} catch {
    Write-ColorOutput "✗ 错误：验证失败" "Red"
    exit 1
}

# 确认执行
if (-not $AutoConfirm) {
    Write-ColorOutput "========================================" "Yellow"
    Write-ColorOutput "⚠ 警告：即将执行数据清理操作" "Yellow"
    Write-ColorOutput "========================================" "Yellow"
    Write-ColorOutput "此操作将：" "Yellow"
    Write-ColorOutput "  • 删除除 13900000000 外的所有用户" "Yellow"
    Write-ColorOutput "  • 删除所有关联的订单、资源、记录" "Yellow"
    Write-ColorOutput "  • 此操作不可逆！" "Red"
    Write-ColorOutput "`n请仔细检查上面的验证信息" "Yellow"
    
    $Confirmation = Read-Host "`n确认执行清理？(输入 YES 继续)"
    if ($Confirmation -ne "YES") {
        Write-ColorOutput "`n操作已取消" "Yellow"
        exit 0
    }
}

# 步骤 3: 执行清理
Write-ColorOutput "`n========================================" "Cyan"
Write-ColorOutput "步骤 3: 执行数据清理" "Cyan"
Write-ColorOutput "========================================`n" "Cyan"

try {
    Write-ColorOutput "正在清理数据..." "Yellow"
    psql -h $DBHost -U $DBUser -d $DBName -f production-data-cleanup.sql
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "`n✓ 清理完成`n" "Green"
    } else {
        throw "清理失败"
    }
} catch {
    Write-ColorOutput "✗ 错误：清理失败" "Red"
    Write-ColorOutput "建议从备份恢复数据库" "Red"
    exit 1
}

# 步骤 4: 清理后验证
Write-ColorOutput "========================================" "Cyan"
Write-ColorOutput "步骤 4: 清理后验证" "Cyan"
Write-ColorOutput "========================================`n" "Cyan"

try {
    psql -h $DBHost -U $DBUser -d $DBName -f verify-after-cleanup.sql
    Write-ColorOutput "`n✓ 验证完成`n" "Green"
} catch {
    Write-ColorOutput "✗ 错误：验证失败" "Red"
    exit 1
}

# 步骤 5: 优化数据库
Write-ColorOutput "========================================" "Cyan"
Write-ColorOutput "步骤 5: 优化数据库" "Cyan"
Write-ColorOutput "========================================`n" "Cyan"

try {
    Write-ColorOutput "正在执行 VACUUM ANALYZE..." "Yellow"
    psql -h $DBHost -U $DBUser -d $DBName -c "VACUUM ANALYZE;"
    Write-ColorOutput "✓ 优化完成`n" "Green"
} catch {
    Write-ColorOutput "⚠ 警告：优化失败（不影响使用）`n" "Yellow"
}

# 完成
Write-ColorOutput "========================================" "Green"
Write-ColorOutput "数据清理完成！" "Green"
Write-ColorOutput "========================================`n" "Green"

Write-ColorOutput "后续步骤：" "Cyan"
Write-ColorOutput "1. 使用 13900000000 登录管理后台测试" "White"
Write-ColorOutput "2. 注册新用户测试注册流程" "White"
Write-ColorOutput "3. 上传测试资源验证功能" "White"
Write-ColorOutput "4. 检查系统配置（VIP套餐、充值套餐等）" "White"
Write-ColorOutput "5. 配置生产环境参数（支付密钥、短信服务等）`n" "White"

if (-not $SkipBackup) {
    Write-ColorOutput "备份文件位置: $BackupFile" "Yellow"
    Write-ColorOutput "如需回滚，执行: pg_restore -h $DBHost -U $DBUser -d $DBName -c $BackupFile`n" "Yellow"
}

# 清理环境变量
$env:PGPASSWORD = $null
