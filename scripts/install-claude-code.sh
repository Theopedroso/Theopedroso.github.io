#!/usr/bin/env bash
# Instala o Claude Code CLI no macOS (e Linux como fallback).
# Uso: bash scripts/install-claude-code.sh
set -uo pipefail

PKG="@anthropic-ai/claude-code"
NODE_MIN_MAJOR=18

log()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m✔\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m✖\033[0m %s\n' "$*" >&2; exit 1; }
has()  { command -v "$1" >/dev/null 2>&1; }
run()  { printf '\033[2m$ %s\033[0m\n' "$*"; "$@"; }

OS="$(uname -s)"
case "$OS" in
  Darwin) OS=macos ;;
  Linux)  OS=linux ;;
  *) die "Sistema não suportado: $OS (use install-claude-code.ps1 no Windows)" ;;
esac
log "Sistema detectado: $OS ($(uname -m))"

# Arquivo de perfil do shell para persistir PATH/variáveis
case "${SHELL##*/}" in
  zsh)  RC="$HOME/.zshrc" ;;
  bash) [ "$OS" = macos ] && RC="$HOME/.bash_profile" || RC="$HOME/.bashrc" ;;
  *)    RC="$HOME/.profile" ;;
esac

persist() { # persist "linha"
  grep -qsF "$1" "$RC" || { echo "$1" >> "$RC"; ok "Adicionado a $RC: $1"; }
}

# ---------- Homebrew (macOS) ----------
if [ "$OS" = macos ]; then
  for p in /opt/homebrew/bin/brew /usr/local/bin/brew; do
    [ -x "$p" ] && ! has brew && eval "$("$p" shellenv)"
  done
  if ! has brew; then
    log "Homebrew não encontrado; instalando..."
    NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" \
      && for p in /opt/homebrew/bin/brew /usr/local/bin/brew; do
           [ -x "$p" ] && eval "$("$p" shellenv)" && persist "eval \"\$($p shellenv)\"" && break
         done \
      || warn "Falha ao instalar Homebrew; usando alternativas."
  fi
  has brew && ok "Homebrew $(brew --version | head -1 | awk '{print $2}')"
fi

# ---------- Git ----------
if has git && git --version >/dev/null 2>&1; then
  ok "Git já instalado: $(git --version)"
else
  log "Instalando Git..."
  if has brew; then run brew install git
  elif [ "$OS" = macos ]; then run xcode-select --install; warn "Conclua a instalação das Command Line Tools e rode o script de novo."; exit 1
  elif has apt-get; then run sudo apt-get update -y && run sudo apt-get install -y git
  elif has dnf; then run sudo dnf install -y git
  elif has pacman; then run sudo pacman -S --noconfirm git
  else die "Não foi possível instalar o Git automaticamente."; fi
  has git || die "Git não ficou disponível no PATH."
  ok "$(git --version)"
fi

# ---------- Node.js LTS + npm ----------
node_ok() { has node && has npm && [ "$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)" -ge "$NODE_MIN_MAJOR" ]; }

install_node_nvm() {
  log "Instalando Node.js LTS via nvm..."
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] || curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh" && nvm install --lts && nvm alias default 'lts/*'
}

if node_ok; then
  ok "Node.js já instalado: $(node -v) / npm $(npm -v)"
else
  has node && warn "Node.js $(node -v) é antigo (mínimo v$NODE_MIN_MAJOR); atualizando."
  if has brew; then
    run brew install node || install_node_nvm
  elif [ "$OS" = linux ] && has apt-get; then
    { curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && run sudo apt-get install -y nodejs; } || install_node_nvm
  else
    install_node_nvm
  fi
  hash -r
  node_ok || die "Falha ao instalar Node.js LTS."
  ok "Node.js $(node -v) / npm $(npm -v)"
fi

# ---------- Prefixo global do npm (evita sudo/EACCES) ----------
NPM_PREFIX="$(npm prefix -g)"
mkdir -p "$NPM_PREFIX/lib" 2>/dev/null
if [ ! -w "$NPM_PREFIX/lib" ]; then
  warn "Prefixo npm ($NPM_PREFIX) sem permissão de escrita; usando ~/.npm-global"
  mkdir -p "$HOME/.npm-global"
  run npm config set prefix "$HOME/.npm-global"
  NPM_PREFIX="$HOME/.npm-global"
fi
ensure_npm_bin() {
  NPM_BIN="$(npm prefix -g)/bin"
  case ":$PATH:" in *":$NPM_BIN:"*) ;; *)
    export PATH="$NPM_BIN:$PATH"
    persist "export PATH=\"$NPM_BIN:\$PATH\"" ;;
  esac
}
ensure_npm_bin

# ---------- Claude Code CLI ----------
if has claude && claude --version >/dev/null 2>&1; then
  ok "Claude Code já instalado: $(claude --version)"
else
  log "Instalando $PKG globalmente..."
  run npm install -g "$PKG" \
    || { warn "Tentando novamente após limpar cache do npm..."; npm cache clean --force >/dev/null 2>&1; run npm install -g "$PKG"; } \
    || { warn "Tentando instalador nativo..."; curl -fsSL https://claude.ai/install.sh | bash; export PATH="$HOME/.local/bin:$PATH"; persist 'export PATH="$HOME/.local/bin:$PATH"'; } \
    || die "Não foi possível instalar o Claude Code."
  ensure_npm_bin; hash -r
fi

# ---------- Variáveis de ambiente ----------
if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
  persist "export ANTHROPIC_API_KEY=\"$ANTHROPIC_API_KEY\""
else
  warn "ANTHROPIC_API_KEY não definida: o login será feito via navegador ao executar 'claude' (conta Claude Pro/Max ou Console)."
fi

# ---------- Validação ----------
log "Validação"
has claude || die "'claude' não está no PATH. Abra um novo terminal ou rode: source $RC"
echo "node   $(node -v)"
echo "npm    $(npm -v)"
echo "git    $(git --version | awk '{print $3}')"
echo "claude $(claude --version)"
echo "path   $(command -v claude)"
claude --help >/dev/null 2>&1 && ok "'claude --help' executou com sucesso" || die "'claude --help' falhou"
if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
  claude -p "Responda apenas: OK" 2>&1 | head -3
fi
ok "Pronto. Abra um novo terminal (ou 'source $RC') e execute: claude"
