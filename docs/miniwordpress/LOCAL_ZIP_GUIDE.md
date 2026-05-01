# Local ZIP Guide

Este guia e para gerar um ZIP local do Mini WordPress no seu PC.

## Importante

Este ZIP local inclui:

- `.env.local`
- `cloudflared.exe`

Isso facilita reusar no seu computador, mas nao e apropriado para publicar em GitHub publico, enviar para terceiros ou usar como pacote limpo de deploy.

## Comando

Na raiz de `miniwordpress-product`:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\create-local-zip.ps1
```

O arquivo sera criado em:

```text
..\miniwordpress-product-local.zip
```

## Antes de zipar

Opcionalmente rode:

```powershell
npm.cmd install
npm.cmd run build
```

Se quiser testar Supabase:

```powershell
npm.cmd run supabase:verify
```

## ZIP seguro

Para um ZIP seguro/compartilhavel, remova antes:

- `.env.local`
- chaves e tokens
- credenciais Supabase
- arquivos de tunnel privados
- dumps de banco
- dados sensiveis de clientes/projetos
