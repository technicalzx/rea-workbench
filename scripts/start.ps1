param([int]$Port = 4317)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $root
if (-not (Test-Path node_modules)) { throw 'Run npm ci in this directory first.' }
Write-Host "Open http://127.0.0.1:$Port in your browser. Ctrl+C stops the dashboard."
node.exe bin/reaw.js serve $Port
