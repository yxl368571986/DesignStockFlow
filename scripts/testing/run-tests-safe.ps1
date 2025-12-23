# Safe Test Runner Script
# Runs tests with memory optimization and error handling

Write-Host "Starting tests with memory optimization..." -ForegroundColor Cyan

# Set Node.js memory limit to 4GB
$env:NODE_OPTIONS="--max-old-space-size=4096"

# Run tests
npm test

# Check exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host "All tests passed!" -ForegroundColor Green
} else {
    Write-Host "Some tests failed, please check output above" -ForegroundColor Red
}

exit $LASTEXITCODE
