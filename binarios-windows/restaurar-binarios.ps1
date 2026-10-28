# Restaura os binarios nativos do Windows que a rede corporativa bloqueia no
# "npm install" (esbuild, Rolldown, LightningCSS, Tailwind oxide, TypeScript 7...).
#
# Le o package-lock.json do projeto, descobre quais binarios win32-x64 ele precisa,
# confere a assinatura (sha512) de cada .tgz desta pasta e extrai na node_modules.
#
# Uso, de dentro da pasta do projeto:
#   npm install --ignore-scripts
#   powershell -ExecutionPolicy Bypass -File "CAMINHO\binarios-windows\restaurar-binarios.ps1"
#   npm run dev

param([string]$Projeto = (Get-Location).Path)

$ErrorActionPreference = 'Stop'
$pasta = $PSScriptRoot
$lockPath = Join-Path $Projeto 'package-lock.json'

if (-not (Test-Path $lockPath)) {
    Write-Host "ERRO: nao encontrei package-lock.json em $Projeto" -ForegroundColor Red
    Write-Host "Rode 'npm install --ignore-scripts' primeiro, dentro da pasta do projeto." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path (Join-Path $Projeto 'node_modules'))) {
    Write-Host "ERRO: a pasta node_modules nao existe. Rode 'npm install --ignore-scripts' primeiro." -ForegroundColor Red
    exit 1
}

# O PowerShell 5 nao aceita chave vazia no JSON (a raiz do lockfile usa "").
$raw = Get-Content $lockPath -Raw
$raw = $raw -replace '"packages"\s*:\s*\{\s*""\s*:', '"packages": { "__raiz__":'
$lock = $raw | ConvertFrom-Json

$faltando = @()
$falhou = $false
$sha = [System.Security.Cryptography.SHA512]::Create()

foreach ($prop in $lock.packages.PSObject.Properties) {
    $chave = $prop.Name
    $info = $prop.Value
    if (-not $info.os -or ($info.os -notcontains 'win32')) { continue }
    if ($info.cpu -and ($info.cpu -notcontains 'x64')) { continue }

    $nome = $chave -replace '^.*node_modules/', ''
    $versao = $info.version
    $tgzNome = (($nome -replace '^@', '') -replace '/', '-') + '-' + $versao + '.tgz'
    $destino = Join-Path $Projeto ($chave -replace '/', '\')

    $pj = Join-Path $destino 'package.json'
    if (Test-Path $pj) {
        $instalada = (Get-Content $pj -Raw | ConvertFrom-Json).version
        if ($instalada -eq $versao) {
            Write-Host ("Ja instalado: " + $nome + "@" + $versao) -ForegroundColor DarkGray
            continue
        }
    }

    $tgz = Join-Path $pasta $tgzNome
    if (-not (Test-Path $tgz)) {
        $faltando += ($nome + "@" + $versao)
        continue
    }

    if ($info.integrity -like 'sha512-*') {
        $hash = 'sha512-' + [Convert]::ToBase64String($sha.ComputeHash([System.IO.File]::ReadAllBytes($tgz)))
        if ($hash -ne $info.integrity) {
            Write-Host ("ERRO: assinatura nao confere para " + $tgzNome + " (arquivo corrompido?)") -ForegroundColor Red
            $falhou = $true
            continue
        }
    }

    if (Test-Path $destino) { Remove-Item -Recurse -Force $destino }
    New-Item -ItemType Directory -Force -Path $destino | Out-Null
    tar -xzf $tgz -C $destino --strip-components=1
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $pj)) {
        Write-Host ("ERRO ao extrair " + $tgzNome + " (antivirus?)") -ForegroundColor Red
        $falhou = $true
        continue
    }
    Write-Host ("OK: " + $nome + "@" + $versao) -ForegroundColor Green
}

if ($faltando.Count -gt 0) {
    Write-Host ""
    Write-Host "Estes binarios nao estao nesta pasta (peca ao Claude para baixa-los):" -ForegroundColor Yellow
    $faltando | ForEach-Object { Write-Host ("  - " + $_) -ForegroundColor Yellow }
    $falhou = $true
}

if ($falhou) { exit 1 }
Write-Host ""
Write-Host "Pronto. Agora rode: npm run dev" -ForegroundColor Cyan
