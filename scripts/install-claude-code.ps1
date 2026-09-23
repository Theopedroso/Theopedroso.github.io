# Instala o Claude Code CLI no Windows.
# Uso (PowerShell): powershell -ExecutionPolicy Bypass -File scripts\install-claude-code.ps1
$ErrorActionPreference = 'Stop'
$Pkg = '@anthropic-ai/claude-code'
$NodeMinMajor = 18

function Log($m)  { Write-Host "==> $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "OK  $m" -ForegroundColor Green }
function Warn($m) { Write-Host "!   $m" -ForegroundColor Yellow }
function Die($m)  { Write-Host "ERR $m" -ForegroundColor Red; exit 1 }
function Has($c)  { [bool](Get-Command $c -ErrorAction SilentlyContinue) }
function Run($cmd) {
  Write-Host "> $cmd" -ForegroundColor DarkGray
  $global:LASTEXITCODE = 0
  try { Invoke-Expression $cmd | Out-Host } catch { Write-Host $_ -ForegroundColor Red; return $false }
  return ($LASTEXITCODE -eq 0)
}

function Refresh-Path {
  $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
}
function Add-UserPath($dir) {
  $user = [Environment]::GetEnvironmentVariable('Path','User')
  if (-not (($user -split ';') -contains $dir)) {
    [Environment]::SetEnvironmentVariable('Path', ($user.TrimEnd(';') + ";$dir"), 'User')
    Ok "Adicionado ao PATH do usuario: $dir"
  }
  if (-not (($env:Path -split ';') -contains $dir)) { $env:Path += ";$dir" }
}

if ($null -ne $IsWindows -and -not $IsWindows) {
  Die 'Este script e para Windows. No macOS use: bash scripts/install-claude-code.sh'
}
Log "Sistema detectado: Windows $([Environment]::OSVersion.Version) ($env:PROCESSOR_ARCHITECTURE)"

$Mgr = if (Has winget) { 'winget' } elseif (Has choco) { 'choco' } else { $null }
if ($Mgr) { Ok "Gerenciador de pacotes: $Mgr" } else { Warn 'winget/chocolatey nao encontrados; usando instaladores diretos.' }

function Install-Pkg($wingetId, $chocoId, $fallback) {
  $done = $false
  if (Has winget) { $done = Run "winget install --id $wingetId -e --silent --accept-package-agreements --accept-source-agreements" }
  if (-not $done -and (Has choco)) { $done = Run "choco install $chocoId -y" }
  if (-not $done -and $fallback) { & $fallback; $done = $true }
  Refresh-Path
  return $done
}

# ---------- Git (inclui Git Bash, exigido pelo Claude Code no Windows) ----------
if (Has git) { Ok "Git ja instalado: $(git --version)" }
else {
  Log 'Instalando Git...'
  Install-Pkg 'Git.Git' 'git' {
    $rel = Invoke-RestMethod 'https://api.github.com/repos/git-for-windows/git/releases/latest'
    $asset = $rel.assets | Where-Object name -match '64-bit\.exe$' | Select-Object -First 1
    $exe = Join-Path $env:TEMP $asset.name
    Invoke-WebRequest $asset.browser_download_url -OutFile $exe
    Start-Process $exe -ArgumentList '/VERYSILENT /NORESTART' -Wait
  } | Out-Null
  if (-not (Has git)) { Add-UserPath "$env:ProgramFiles\Git\cmd" }
  if (-not (Has git)) { Die 'Git nao ficou disponivel no PATH.' }
  Ok "$(git --version)"
}

# CLAUDE_CODE_GIT_BASH_PATH
$gitBash = @("$env:ProgramFiles\Git\bin\bash.exe", "${env:ProgramFiles(x86)}\Git\bin\bash.exe", "$env:LOCALAPPDATA\Programs\Git\bin\bash.exe") |
  Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if (-not $gitBash) {
  $gitExe = (Get-Command git).Source
  $cand = Join-Path (Split-Path (Split-Path $gitExe)) 'bin\bash.exe'
  if (Test-Path $cand) { $gitBash = $cand }
}
if ($gitBash) {
  [Environment]::SetEnvironmentVariable('CLAUDE_CODE_GIT_BASH_PATH', $gitBash, 'User')
  $env:CLAUDE_CODE_GIT_BASH_PATH = $gitBash
  Ok "CLAUDE_CODE_GIT_BASH_PATH=$gitBash"
} else { Warn 'bash.exe do Git nao encontrado; defina CLAUDE_CODE_GIT_BASH_PATH manualmente.' }

# ---------- Node.js LTS + npm ----------
function Node-Ok {
  if (-not ((Has node) -and (Has npm))) { return $false }
  return ([int]((node -v).TrimStart('v').Split('.')[0]) -ge $NodeMinMajor)
}
if (Node-Ok) { Ok "Node.js ja instalado: $(node -v) / npm $(npm -v)" }
else {
  if (Has node) { Warn "Node.js $(node -v) e antigo (minimo v$NodeMinMajor); atualizando." }
  Log 'Instalando Node.js LTS...'
  Install-Pkg 'OpenJS.NodeJS.LTS' 'nodejs-lts' {
    $idx = Invoke-RestMethod 'https://nodejs.org/dist/index.json'
    $v = ($idx | Where-Object { $_.lts } | Select-Object -First 1).version
    $msi = Join-Path $env:TEMP "node-$v-x64.msi"
    Invoke-WebRequest "https://nodejs.org/dist/$v/node-$v-x64.msi" -OutFile $msi
    Start-Process msiexec.exe -ArgumentList "/i `"$msi`" /qn /norestart" -Wait
  } | Out-Null
  if (-not (Has node)) { Add-UserPath "$env:ProgramFiles\nodejs" }
  if (-not (Node-Ok)) { Die 'Falha ao instalar Node.js LTS.' }
  Ok "Node.js $(node -v) / npm $(npm -v)"
}

# ---------- PATH do npm global ----------
$npmPrefix = (npm prefix -g).Trim()
Add-UserPath $npmPrefix

# ---------- Claude Code CLI ----------
if ((Has claude) -and (claude --version 2>$null)) { Ok "Claude Code ja instalado: $(claude --version)" }
else {
  Log "Instalando $Pkg globalmente..."
  $ok = Run "npm install -g $Pkg"
  if (-not $ok) { Warn 'Tentando novamente apos limpar cache do npm...'; npm cache clean --force *> $null; $ok = Run "npm install -g $Pkg" }
  if (-not $ok) {
    Warn 'Tentando instalador nativo...'
    Invoke-RestMethod https://claude.ai/install.ps1 | Invoke-Expression
    Add-UserPath "$env:USERPROFILE\.local\bin"
  }
  Refresh-Path; Add-UserPath $npmPrefix
}

# ---------- Variaveis de ambiente ----------
if ($env:ANTHROPIC_API_KEY) {
  [Environment]::SetEnvironmentVariable('ANTHROPIC_API_KEY', $env:ANTHROPIC_API_KEY, 'User')
  Ok 'ANTHROPIC_API_KEY persistida para o usuario.'
} else {
  Warn "ANTHROPIC_API_KEY nao definida: o login sera feito via navegador ao executar 'claude'."
}

# ---------- Validacao ----------
Log 'Validacao'
if (-not (Has claude)) { Die "'claude' nao esta no PATH. Abra um novo terminal." }
"node   $(node -v)"
"npm    $(npm -v)"
"git    $(git --version)"
"claude $(claude --version)"
"path   $((Get-Command claude).Source)"
claude --help *> $null
if ($LASTEXITCODE -eq 0) { Ok "'claude --help' executou com sucesso" } else { Die "'claude --help' falhou" }
if ($env:ANTHROPIC_API_KEY) { claude -p 'Responda apenas: OK' 2>&1 | Select-Object -First 3 }
Ok "Pronto. Abra um novo terminal e execute: claude"
