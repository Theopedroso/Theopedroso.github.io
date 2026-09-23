# Instalação do Claude Code CLI

Scripts idempotentes: só instalam o que estiver faltando.

| Sistema | Comando |
|---|---|
| macOS (e Linux) | `bash scripts/install-claude-code.sh` |
| Windows (PowerShell) | `powershell -ExecutionPolicy Bypass -File scripts\install-claude-code.ps1` |

O que fazem:
1. Detectam o SO e o gerenciador de pacotes (Homebrew / winget → chocolatey → instalador direto).
2. Garantem Git (no Windows, também definem `CLAUDE_CODE_GIT_BASH_PATH` para o Git Bash).
3. Garantem Node.js LTS (≥ 18) e npm (fallback: nvm no macOS/Linux, MSI oficial no Windows).
4. Colocam o diretório global do npm no PATH (no macOS usam `~/.npm-global` se o prefixo exigir sudo).
5. Instalam `@anthropic-ai/claude-code` via npm (tenta de novo após limpar o cache, e depois usa o instalador nativo).
6. Se `ANTHROPIC_API_KEY` estiver definida, gravam a variável no perfil do usuário; caso contrário, o login é feito pelo navegador no primeiro `claude`.
7. Validam: versões de node/npm/git/claude, `claude --help` e, com a API key, `claude -p`.

Depois, abra um novo terminal e execute `claude`.
