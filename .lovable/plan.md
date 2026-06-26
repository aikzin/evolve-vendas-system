
# Plano de implementação

Vou apenas **adicionar** funcionalidades. Nenhuma tela existente terá visual ou comportamento alterados — apenas a fonte de dados (localStorage → Supabase) será trocada por baixo dos panos, mantendo a mesma interface dos hooks.

---

## 1. Ativar Lovable Cloud (Supabase)

Habilitar o backend gerenciado. Sem isso nada do resto funciona.

---

## 2. Banco de dados (multi-tenant via `user_id`)

Criar migration com as tabelas abaixo no schema `public`, todas com `user_id uuid` ligado a `auth.users`, RLS ativo e policies `auth.uid() = user_id` para SELECT/INSERT/UPDATE/DELETE. GRANTs para `authenticated` e `service_role` (sem `anon`).

| Tabela | Campos principais (espelhando `src/types/index.ts`) |
|---|---|
| `clientes` | id, user_id, nome, email, telefone, endereco, data_cadastro, total_compras, ultima_compra |
| `produtos_estoque` | id, user_id, nome, preco, estoque, estoque_minimo, categoria, descricao |
| `vendas` | id, user_id, cliente_id, produtos (jsonb), total, tipo_pagamento, origem_pedido, data_venda, status, observacoes |
| `configuracoes` | id, user_id (unique), dados (jsonb — guarda config geral + Evolution API + número de alerta de estoque) |
| `agendamentos` | id, user_id, cliente_id, titulo, descricao, data_hora, status (`agendado`/`confirmado`/`cancelado`/`concluido`), lembrete_enviado bool |

Trigger `handle_new_user` cria linha default em `configuracoes` no signup.

---

## 3. Autenticação

- Nova página `/auth` (login + cadastro e-mail/senha) — design alinhado ao atual.
- Novo `AuthProvider` (`src/contexts/AuthContext.tsx`) com `onAuthStateChange` + `getSession`.
- Novo componente `ProtectedRoute` envolvendo todas as rotas internas em `App.tsx`. Usuários não logados → redirect `/auth`.
- Botão "Sair" adicionado no rodapé do `Sidebar` existente (única adição visual, sem mexer no resto).

---

## 4. Migração localStorage → Supabase (sem mudar telas)

Estratégia: **manter o nome `useLocalStorage` intacto** para não quebrar nada, e criar novos hooks específicos por entidade que as telas passarão a importar. Como cada tela já desestrutura `[data, setData]`, vou criar hooks com **a mesma assinatura `[T, setT]`**:

- `useClientes()` → `[Cliente[], setClientes]`
- `useVendas()` → `[Venda[], setVendas]`
- `useProdutos()` → `[Produto[], setProdutos]`
- `useConfiguracoes()` → `[Config, setConfig]`
- `useAgendamentos()` → `[Agendamento[], setAgendamentos]`

Internamente fazem `select` no Supabase ao montar e sincronizam mutations (upsert/delete por diff). Isso permite trocar apenas a linha de import nas páginas — nenhum JSX muda.

---

## 5. WhatsApp ligado à lógica de negócio

Criar Edge Function `whatsapp-send` que recebe `{ phone, message }`, lê config Evolution API do usuário (via JWT) e dispara `POST /message/sendText/{instance}`.

Gatilhos (no client, após mutation bem-sucedida):

1. **Confirmação de venda**: após `INSERT venda` com status `paga`, busca telefone do cliente e chama `whatsapp-send`.
2. **Alerta de estoque baixo**: após `UPDATE produtos_estoque`, se `estoque < estoque_minimo`, envia para `numero_alerta` em `configuracoes`.
3. **Confirmação/Lembrete agendamento**: envio imediato ao criar; Edge Function agendada `agendamento-lembrete` (cron diário) varre agendamentos das próximas 24h ainda não lembrados e dispara.

Todos os envios são **silenciosos em caso de falha** (toast warning, não bloqueia operação) para não quebrar fluxo se Evolution API estiver offline.

---

## 6. Módulo Agendamentos (novo)

- Nova página `src/pages/Agendamentos.tsx` (criar/listar/cancelar) seguindo o mesmo padrão visual de `Vendas.tsx` (Card + Badge + filtros).
- Item "Agendamentos" adicionado no `Sidebar` existente (adição, não edição).
- Rota `/agendamentos` registrada no `App.tsx`.

---

## 7. Detalhes técnicos

- `configuracoes.dados` jsonb evita migration nova a cada novo campo de config.
- Hooks fazem invalidate local após mutation (sem TanStack Query para não mudar arquitetura existente das telas).
- Edge function usa `corsHeaders` do SDK e valida JWT em código.
- Migration única com todas as tabelas + RLS + GRANTs + trigger.

---

## Arquivos novos

```
src/contexts/AuthContext.tsx
src/components/ProtectedRoute.tsx
src/integrations/supabase/client.ts            (gerado pelo Cloud)
src/hooks/useClientes.ts
src/hooks/useVendas.ts
src/hooks/useProdutos.ts
src/hooks/useConfiguracoes.ts
src/hooks/useAgendamentos.ts
src/lib/whatsapp.ts                            (helper que chama edge function)
src/pages/Auth.tsx
src/pages/Agendamentos.tsx
supabase/functions/whatsapp-send/index.ts
supabase/functions/agendamento-lembrete/index.ts
```

## Arquivos editados (mínimo)

```
src/App.tsx                 → AuthProvider + ProtectedRoute + rotas /auth e /agendamentos
src/components/layout/Sidebar.tsx → adiciona item Agendamentos + botão Sair
src/pages/Clientes.tsx      → troca import useLocalStorage → useClientes (1 linha)
src/pages/Vendas.tsx        → troca imports + chama sendVendaConfirmacao após salvar
src/pages/Estoque.tsx       → troca import + checa estoque mínimo
src/pages/Configuracoes.tsx → troca import + campos Evolution API/alerta
src/pages/ConectarWhatsApp.tsx → lê config do Supabase em vez de localStorage
src/pages/Dashboard.tsx, Relatorios.tsx, ExportarDados.tsx → troca imports
```

`useLocalStorage.ts` **permanece intacto** (não removo nada).

---

Confirma para eu executar? É um trabalho grande (≈15 arquivos novos, ~10 editados) e vai consumir bastante crédito — quer que eu faça tudo de uma vez ou prefere dividir em fases (ex: Fase 1 = Cloud+Auth+DB, Fase 2 = WhatsApp+Agendamentos)?
