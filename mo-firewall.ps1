# Mo port 8000 cho app cham cong (BAT BUOC chay voi quyen Administrator)
# Tuong thich PowerShell 5.1 (Windows mac dinh)
$ErrorActionPreference = "Stop"

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)

if (-not $isAdmin) {
    Write-Host ""
    Write-Host "LOI: Can quyen Administrator!" -ForegroundColor Red
    Write-Host "Chuot phai mo-firewall.bat -> Run as administrator"
    Write-Host ""
    Read-Host "Enter de dong"
    exit 1
}

$ruleName = "ChamCongKhuonMat Port 8000"
$rulePublic = "$ruleName Public"
$created = 0

function Ensure-Rule {
    param([string]$Name, [string[]]$Profiles)
    $existing = Get-NetFirewallRule -DisplayName $Name -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "Rule da ton tai: $Name" -ForegroundColor Yellow
        return
    }
    New-NetFirewallRule -DisplayName $Name `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort 8000 `
        -Action Allow `
        -Profile $Profiles `
        | Out-Null
    Write-Host "Da tao rule: $Name ($($Profiles -join ', '))" -ForegroundColor Green
    $script:created++
}

try {
    Ensure-Rule -Name $ruleName -Profiles @("Private", "Domain")
    Ensure-Rule -Name $rulePublic -Profiles @("Public")

    # Cho phep python.exe nhan ket noi tu mang LAN
    $pyRules = @(
        "ChamCongKhuonMat Python In",
        "ChamCongKhuonMat Python In Public"
    )
    $pyProfiles = @(@("Private", "Domain"), @("Public"))
    $pyCmd = Get-Command python -ErrorAction SilentlyContinue
    $py = $null
    if ($pyCmd) {
        $py = $pyCmd.Source
    }

    for ($i = 0; $i -lt $pyRules.Count; $i++) {
        $name = $pyRules[$i]
        $profiles = $pyProfiles[$i]
        $existing = Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue
        if ($existing) {
            Write-Host "Rule da ton tai: $name" -ForegroundColor Yellow
            continue
        }
        if (-not $py) {
            Write-Host "Khong tim thay python.exe - bo qua rule Python" -ForegroundColor Yellow
            break
        }
        New-NetFirewallRule -DisplayName $name `
            -Direction Inbound `
            -Program $py `
            -Action Allow `
            -Profile $profiles `
            | Out-Null
        Write-Host "Da tao rule Python: $name" -ForegroundColor Green
        $created++
    }

    Write-Host ""
    if ($created -eq 0) {
        Write-Host "Port 8000 da duoc mo tu truoc." -ForegroundColor Cyan
    } else {
        Write-Host "Da mo port 8000 thanh cong!" -ForegroundColor Green
    }
    Write-Host ""
    Write-Host "Tren tablet mo trinh duyet thu:"
    Write-Host "  http://IP-PC:8000/api/ping"
    Write-Host ""
    Write-Host "IP PC (ipconfig -> IPv4):"
    Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object { $_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -ne "WellKnown" } |
        ForEach-Object { Write-Host "  $($_.IPAddress)" -ForegroundColor Cyan }
} catch {
    Write-Host ""
    Write-Host "LOI: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Enter de dong"
    exit 1
}

Read-Host "Enter de dong"
