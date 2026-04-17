# Supabase Setup

Esta pasta guarda a base versionada do banco para o SaaS escolar.

## O que esta migration cria

- `public.schools`: cadastro das escolas atendidas pelo sistema
- `public.profiles`: perfil basico do usuario autenticado
- `public.school_memberships`: vinculo do usuario com cada escola e seu papel
- `public.platform_staff`: equipe interna do produto com acesso global
- enums de papel e status: `app_role` e `membership_status`
- enum global: `platform_role`
- trigger para sincronizar `auth.users` -> `public.profiles`
- RLS inicial para multi-escola
- funcoes para cadastrar equipe global e criar escola com diretor

## Modelo multi-escola

O sistema foi preparado para multi-tenant desde o inicio:

- uma escola possui muitos usuarios
- um usuario pode participar de mais de uma escola
- o papel do usuario e definido por escola, nao globalmente
- a equipe da plataforma fica separada da estrutura da escola

Os papeis iniciais sao:

- `director`
- `secretary`
- `teacher`
- `student`

Os papeis globais da plataforma sao:

- `owner`: voce, como Gestor do Sistema, com controle total da equipe global
- `education_secretary`: papel operacional principal para cadastrar escolas e diretores
- `admin`: equipe interna complementar, com acesso operacional global
- `support`: apoio com leitura global

## Camadas de acesso

Existem duas camadas distintas:

1. `platform_staff`
   Equipe do seu SaaS. O `owner` cadastra o `education_secretary`, e esse papel passa a operar escolas e diretores.

2. `school_memberships`
   Usuarios internos de cada escola. Diretor, secretaria, professor e aluno.

Isso evita misturar o "gestor do sistema" com um diretor de escola.

## Bootstrap do Gestor do Sistema

Depois que a migration for aplicada, voce precisa marcar o seu usuario como `owner` no banco. Esse `owner` representa o papel de Gestor do Sistema.

1. Crie ou acesse seu usuario em `Authentication > Users`.
2. Pegue o `user_id`.
3. Rode no SQL Editor:

```sql
insert into public.platform_staff (user_id, role, status)
values ('SEU_USER_ID_AQUI', 'owner', 'active')
on conflict (user_id) do update
set role = 'owner',
    status = 'active',
    updated_at = timezone('utc', now());
```

## Como cadastrar sua equipe

Depois que voce ja for `owner`, pode promover alguem da sua equipe para acesso global:

```sql
select public.assign_platform_staff(
  'USER_ID_DA_EQUIPE',
  'education_secretary',
  'active'
);
```

## Como cadastrar uma escola e o diretor

### Opcao 1: tela da plataforma

1. Aplique as migrations com `supabase db push`.
2. Publique as Edge Functions com:
   `supabase functions deploy platform-create-school`
   `supabase functions deploy platform-manage-staff`
3. Acesse a rota `/plataforma` no app.
4. Cadastre primeiro o `Secretario de Educacao` na equipe global.
5. Depois entre com esse perfil para cadastrar escolas e diretores pelo formulario visual.

Essa tela:

- cria a escola
- localiza ou convida o diretor por email
- vincula o diretor automaticamente em `school_memberships`

### Opcao 2: SQL manual

Fluxo recomendado:

1. Crie o usuario do diretor em `Authentication > Users` ou via backend com a Admin API.
2. Pegue o `user_id` do diretor.
3. Rode:

```sql
select public.create_school_with_director(
  'Colegio Exemplo',
  'colegio-exemplo',
  'USER_ID_DO_DIRETOR',
  'Colegio Exemplo Ltda',
  '00.000.000/0001-00'
);
```

Esse fluxo:

- cria a escola
- registra quem criou a escola na plataforma
- vincula o diretor automaticamente em `school_memberships`

## Edge Functions da plataforma

Foram adicionadas as funcoes:

- `supabase/functions/platform-create-school`
- `supabase/functions/platform-manage-staff`
- `supabase/functions/platform-school-catalog`
- `supabase/functions/platform-import-school-catalog`
- `supabase/functions/platform-import-school-catalog-batch`

Deploy:

```bash
supabase functions deploy platform-create-school
supabase functions deploy platform-manage-staff
supabase functions deploy platform-school-catalog
supabase functions deploy platform-import-school-catalog
supabase functions deploy platform-import-school-catalog-batch
```

Essas funcoes:

- valida a sessao autenticada
- exigem papel global compativel com a operacao
- usam `service_role` apenas dentro da function
- criam ou convidam usuarios por email com seguranca
- chamam as funcoes SQL versionadas com o contexto do usuario autenticado

### Catalogo escolar por cidade

A function `platform-school-catalog` atende a tela de escolas da plataforma.

Fluxo atual:

- o frontend tenta primeiro essa function do Supabase
- a function consulta primeiro o cache salvo em `public.school_catalog_cache`
- o caminho recomendado para alimentar esse cache e a importacao manual do CSV oficial do INEP
- se o cache estiver vazio ou vencido, ela tenta sincronizar em tempo real com a Base dos Dados via BigQuery
- se voce configurar `VITE_BD_CATALOG_SYNC_URL`, essa URL vira um override opcional do frontend
- se nenhuma sincronizacao estiver disponivel, o app cai para a base homologada de contingencia
- essa function foi deixada sem exigencia de JWT no gateway porque entrega apenas catalogo escolar publico por cidade

Ela aceita um corpo JSON como:

```json
{
  "city": "Sobral",
  "state": "CE",
  "ibgeCode": "2312908"
}
```

Resposta esperada:

```json
{
  "sourceLabel": "Catalogo Supabase",
  "sourceType": "seed",
  "advisory": "Catalogo servido pela function do Supabase.",
  "schools": [
    {
      "id": "inep-23045678",
      "inepCode": "23045678",
      "name": "EMEF Padre Osvaldo Chaves",
      "city": "Sobral",
      "state": "CE",
      "zone": "Urbana",
      "educationStages": ["Anos Iniciais", "Anos Finais"]
    }
  ]
}
```

Para ligar a sua sincronizacao server-side da Base dos Dados, publique a function e depois defina os secrets:

```bash
supabase secrets set BD_CATALOG_SYNC_URL=https://seu-backend.example.com/catalog/schools
supabase secrets set BD_CATALOG_SYNC_TOKEN=seu-token-opcional
```

Com isso:

- a Edge Function continua sendo o endpoint consumido pelo frontend
- o fetch externo passa a acontecer no servidor
- a tela passa a preferir o cache sincronizado no Supabase
- a base homologada embutida na function vira apenas contingencia
- o frontend nao depende da sessao autenticada para buscar o catalogo publico

### Importacao manual do CSV do INEP

Para municipios que voce usa pouco, essa e a abordagem mais leve:

1. exporte o CSV do Catalogo de Escolas do INEP
2. entre na tela `Escolas por Secretaria`
3. escolha a secretaria da cidade
4. envie o arquivo `.csv`
5. o sistema grava as escolas em `public.school_catalog_cache`

Essa importacao usa a function `platform-import-school-catalog`, que:

- exige usuario autenticado da camada da plataforma
- aceita o CSV bruto exportado do INEP
- filtra apenas a cidade e UF da secretaria selecionada
- normaliza escola, codigo INEP, localizacao, telefone, etapas e demais campos
- substitui o cache anterior da cidade pelos registros do arquivo atual

Deploy:

```bash
supabase functions deploy platform-import-school-catalog --no-verify-jwt
```

Essa e a opcao recomendada para evitar dependencia de Google Cloud quando a atualizacao do catalogo e eventual.

### Importacao INEP Brasil

Quando voce tiver o CSV nacional completo, use a pagina separada `Importacao INEP Brasil`.

Esse fluxo foi desenhado para arquivo grande, como um CSV de ~80 MB:

- o navegador le o arquivo em streaming
- o frontend normaliza as linhas em lotes menores
- cada lote e enviado para `platform-import-school-catalog-batch`
- o banco faz `upsert` por `inep_code`

Assim, voce evita:

- upload unico enorme para uma function
- dependencia de Google Cloud para um uso eventual
- travamentos mais severos na tela durante a carga

Deploy do endpoint em lotes:

```bash
supabase functions deploy platform-import-school-catalog-batch --no-verify-jwt
```

Importante:

- a configuracao `verify_jwt = false` precisa ficar em `supabase/config.toml`, na secao `[functions.platform-school-catalog]`
- a importacao nacional em lotes tambem precisa de `verify_jwt = false` no gateway, porque o navegador envia `OPTIONS` antes do `POST` autenticado
- se voce quiser forcar isso no deploy imediatamente, use:

```bash
supabase functions deploy platform-school-catalog --no-verify-jwt
```

### Sincronizacao real com a Base dos Dados

Esse bloco passa a ser opcional e mais avancado. So vale a pena se voce quiser sincronizacao automatica sem subir CSV manualmente.

O caminho implementado no projeto usa a propria Edge Function para consultar o BigQuery e preencher a tabela `public.school_catalog_cache`.

O fluxo server-side ficou assim:

1. a function recebe `city`, `state` e `ibgeCode`
2. verifica se ja existe cache recente no Supabase
3. se precisar atualizar, consulta a tabela `basedosdados.br_inep_censo_escolar.escola` no BigQuery
4. normaliza os registros e salva o resultado no cache local
5. devolve o catalogo para o frontend

Isso evita depender de uma API intermediaria separada.

### O que voce precisa configurar no Google Cloud

Segundo a documentacao oficial do Google para contas de servico e da API REST do BigQuery, voce precisa de:

- um projeto GCP com faturamento habilitado para executar queries
- BigQuery API habilitada
- uma service account com chave JSON
- permissao para essa conta executar consultas no projeto de billing

No Supabase, publique os secrets:

```bash
supabase secrets set BD_BIGQUERY_BILLING_PROJECT_ID=seu-projeto-gcp
supabase secrets set BD_GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"..."}'
supabase secrets set BD_BIGQUERY_LOCATION=US
supabase secrets set SCHOOL_CATALOG_CACHE_MAX_AGE_HOURS=168
```

Opcionalmente:

```bash
supabase secrets set BD_BIGQUERY_MAX_BYTES_BILLED=2000000000
```

Se preferir evitar problemas com aspas no terminal, voce tambem pode salvar a credencial em base64 e usar:

```bash
supabase secrets set BD_GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=SEU_JSON_EM_BASE64
```

### Ordem recomendada de deploy

```bash
supabase db push
supabase functions deploy platform-school-catalog --no-verify-jwt
```

Depois disso, ao abrir a tela de escolas de uma secretaria com `IBGE` conhecido, o catalogo ja deve sincronizar automaticamente e preencher o cache.

## Como aplicar no projeto Supabase

1. Instale ou habilite a Supabase CLI na sua maquina.
2. Na raiz deste repositorio, rode `supabase init` caso ainda nao tenha inicializado a pasta local do CLI.
3. Conecte o repositorio ao projeto remoto com `supabase link --project-ref <seu-project-ref>`.
4. Envie a migration com `supabase db push`.

Se voce ja criou tabelas manualmente no Dashboard antes de versionar o banco, faca antes:

1. `supabase db pull`
2. Revise a migration gerada
3. Depois consolide com esta migration inicial

## Proximo passo recomendado

Depois de aplicar essa base, o proximo passo no app sera:

1. carregar no frontend se o usuario eh `platform_staff` ou membro de escola
2. mostrar navegacao diferente para equipe da plataforma e para a escola
3. criar fluxo visual para trocar papel e desativar membros da equipe global
4. conectar as telas reais ao banco
