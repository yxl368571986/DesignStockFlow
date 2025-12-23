# PostgreSQL Verification Script

Write-Host "========================================"
Write-Host "PostgreSQL Verification Tool"
Write-Host "========================================"
Write-Host ""

# 1. Check Installation
Write-Host "1. Checking PostgreSQL Installation..." -ForegroundColor Green
$postgresPath = "D:\Program_Files\PostgreSQL"
if (Test-Path $postgresPath) {
    Write-Host "   [OK] PostgreSQL directory: $postgresPath" -ForegroundColor Green
    $version = & "$postgresPath\bin\psql.exe" --version
    Write-Host "   [OK] Version: $version" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] PostgreSQL not found" -ForegroundColor Red
}

Write-Host ""

# 2. Check Service
Write-Host "2. Checking PostgreSQL Service..." -ForegroundColor Green
$service = Get-Service -Name "postgresql-x64-14" -ErrorAction SilentlyContinue
if ($service) {
    if ($service.Status -eq "Running") {
        Write-Host "   [OK] Service: $($service.Name) - Running" -ForegroundColor Green
    } else {
        Write-Host "   [WARNING] Service: $($service.Name) - $($service.Status)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   [ERROR] Service not found" -ForegroundColor Red
}

Write-Host ""

# 3. Check System PATH
Write-Host "3. Checking System PATH..." -ForegroundColor Green
$machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
if ($machinePath -like "*D:\Program_Files\PostgreSQL\bin*") {
    Write-Host "   [OK] PostgreSQL bin in system PATH" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] PostgreSQL bin NOT in system PATH" -ForegroundColor Red
}

Write-Host ""

# 4. Check Current Session
Write-Host "4. Checking Current Session..." -ForegroundColor Green
$psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
if ($psqlCmd) {
    Write-Host "   [OK] psql command available" -ForegroundColor Green
} else {
    Write-Host "   [WARNING] psql not available in current session" -ForegroundColor Yellow
    Write-Host "   Tip: Reopen PowerShell window or run:" -ForegroundColor Cyan
    Write-Host "   `$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine')" -ForegroundColor White
}

Write-Host ""

# 5. Test Database Connection
Write-Host "5. Testing Database Connection..." -ForegroundColor Green
if ($service -and $service.Status -eq "Running") {
    $result = & "$postgresPath\bin\psql.exe" -U postgres -d startide_design -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Database connection successful" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] Database connection failed" -ForegroundColor Red
    }
} else {
    Write-Host "   [SKIP] Service not running" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================"
Write-Host "Verification Complete"
Write-Host "========================================"
Write-Host ""
Write-Host "Quick Commands:" -ForegroundColor Cyan
Write-Host "  psql -U postgres -d startide_design" -ForegroundColor White
Write-Host "  psql -U postgres -c '\l'" -ForegroundColor White
Write-Host ""
Write-Host "Documentation: backend/POSTGRESQL_PATH_FIX_COMPLETED.md" -ForegroundColor Cyan
Write-Host ""
