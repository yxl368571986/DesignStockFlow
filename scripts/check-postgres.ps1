# PostgreSQL Installation Check Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Installation Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check PostgreSQL installation directory
Write-Host "1. Checking PostgreSQL installation..." -ForegroundColor Green
$postgresPath = "C:\Program Files\PostgreSQL"

if (Test-Path $postgresPath) {
    Write-Host "   [OK] PostgreSQL directory found: $postgresPath" -ForegroundColor Green
    $versions = Get-ChildItem $postgresPath -Directory -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name
    if ($versions) {
        Write-Host "   Installed versions: $($versions -join ', ')" -ForegroundColor Cyan
    }
} else {
    Write-Host "   [ERROR] PostgreSQL NOT installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Please download and install PostgreSQL:" -ForegroundColor Yellow
    Write-Host "   https://www.enterprisedb.com/downloads/postgres-postgresql-downloads" -ForegroundColor White
    Write-Host ""
    Write-Host "   See: backend/POSTGRESQL_QUICK_FIX.md for detailed instructions" -ForegroundColor Cyan
    Write-Host ""
    exit
}

Write-Host ""

# Check psql command
Write-Host "2. Checking psql command..." -ForegroundColor Green
$psqlCommand = Get-Command psql -ErrorAction SilentlyContinue

if ($psqlCommand) {
    try {
        $psqlVersion = & psql --version 2>&1
        Write-Host "   [OK] psql available: $psqlVersion" -ForegroundColor Green
    } catch {
        Write-Host "   [WARNING] psql found but cannot execute" -ForegroundColor Yellow
    }
} else {
    Write-Host "   [ERROR] psql command not available" -ForegroundColor Red
    Write-Host "   Need to add to PATH: C:\Program Files\PostgreSQL\14\bin" -ForegroundColor Yellow
}

Write-Host ""

# Check PostgreSQL service
Write-Host "3. Checking PostgreSQL service..." -ForegroundColor Green
$services = Get-Service -Name "*postgresql*" -ErrorAction SilentlyContinue

if ($services) {
    foreach ($service in $services) {
        $status = $service.Status
        if ($status -eq "Running") {
            Write-Host "   [OK] Service $($service.Name) is running" -ForegroundColor Green
        } else {
            Write-Host "   [WARNING] Service $($service.Name) is NOT running (Status: $status)" -ForegroundColor Yellow
            Write-Host "   Start command: net start $($service.Name)" -ForegroundColor Cyan
        }
    }
} else {
    Write-Host "   [ERROR] No PostgreSQL service found" -ForegroundColor Red
    Write-Host "   PostgreSQL may not be installed as a Windows service" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Check Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Green
Write-Host ""
Write-Host "1. If PostgreSQL is NOT installed:" -ForegroundColor White
Write-Host "   - See: backend/POSTGRESQL_QUICK_FIX.md" -ForegroundColor Cyan
Write-Host "   - Download from: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. If PostgreSQL IS installed, create database:" -ForegroundColor White
Write-Host "   psql -U postgres -c ""CREATE DATABASE startide_design;""" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Configure .env file:" -ForegroundColor White
Write-Host "   DATABASE_URL=""postgresql://postgres:YOUR_PASSWORD@localhost:5432/startide_design?schema=public""" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Initialize database:" -ForegroundColor White
Write-Host "   npm run prisma:generate" -ForegroundColor Cyan
Write-Host "   npm run prisma:migrate" -ForegroundColor Cyan
Write-Host "   npm run prisma:seed" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to exit"
