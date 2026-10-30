# ANTK — Portal Eleitoral

Código-fonte do portal eleitoral de um grupo de amigos, com inscrições, propostas, urna, primeiro e segundo turnos e apuração.

**Hospedagem oficial:** https://antk-eleicoes-do-zap.brenninhodacapadocia.chatgpt.site/

Este repositório é destinado à consulta e ao versionamento do código. Não contém automação de implantação no GitHub Pages nem muda a hospedagem no ChatGPT Sites. Executar uma cópia local não altera a eleição oficial.

## Origem e integridade da exportação

- Exportado diretamente do projeto original no commit `0cb856a76dad97545885688576670d57f8d3d9c6`.
- Inclui os **157 arquivos versionados originais**, com componentes, estilos, servidor, configurações, imagens públicas, migrations, testes, dependências declaradas e lockfile.
- O README original foi preservado em `docs/README-original.md`; este README foi escrito para explicar o projeto ao público.
- `docs/source-manifest.json` registra o tamanho e SHA-256 de cada arquivo original. Para o README original, compare com `docs/README-original.md`.
- `docs/export-verification.json` registra o procedimento de exportação e suas limitações.
- A exportação é uma fotografia do código, sem o histórico `.git` anterior. Isso evita levar configurações e credenciais antigas para o repositório público.

Não foram exportados senhas, tokens conhecidos, arquivos privados de ambiente, credenciais de publicação, dados da eleição, bancos locais, dependências instaladas, caches ou artefatos compilados. O esquema do banco e suas migrations estão incluídos. A inspeção por padrões e valores conhecidos não equivale a uma auditoria independente de segurança.

## Tecnologias

TypeScript, React, CSS/Tailwind, Vinext/Vite, Cloudflare Workers, Cloudflare D1 e Drizzle. O HTML é produzido pelos componentes React e pelo framework; não existe um `index.html` estático autoral que tenha sido omitido.

## Estrutura

| Caminho | Função |
| --- | --- |
| `app/page.tsx`, `app/layout.tsx` | Entrada e estrutura das páginas |
| `app/globals.css` | Identidade visual e estilos |
| `app/election.tsx` | Cadastro, consulta de candidaturas e interface da urna |
| `app/election-server.ts` | Persistência, registro de votos, apuração e transições |
| `app/election-rules.ts` | Validações, normalização dos nomes e classificação |
| `app/api/election/route.ts` | API usada pelos participantes |
| `app/api/admin/route.ts`, `app/admin/` | Autenticação e operações da comissão |
| `app/results.tsx`, `app/counting.ts`, `app/counting-report.tsx` | Resultados e reprodução animada da contagem |
| `app/candidate-photo-match.ts`, `app/candidate-media.tsx` | Associação de imagens aos nomes |
| `app/leaflet.ts`, `app/zip.ts` | Folhetos e arquivos para download |
| `app/urn-sound.ts` | Sons da urna |
| `public/` | Artes e demais recursos públicos |
| `db/`, `drizzle/` | Esquema e migrations do banco |
| `worker/`, `vite.config.ts`, `.openai/hosting.json` | Execução e configuração do ambiente Sites |
| `scripts/` | Ferramentas originais de instalação, desenvolvimento e build |
| `tests/` | Testes unitários e de integração |
| `components/`, `hooks/`, `lib/`, `vendor/`, `examples/` | Componentes e suporte do projeto original |

O identificador de projeto em `.openai/hosting.json` é metadado da hospedagem original, não uma senha. A exportação não fornece credenciais para publicar alterações no site oficial. Não use ferramentas de publicação do Sites para operar esse projeto sem autorização do proprietário.

## Funcionamento eleitoral

1. Na etapa de inscrições, a pessoa informa nome, número exclusivo de dois dígitos e propostas.
2. A comissão encerra candidaturas; essa ação é separada da abertura da votação.
3. No primeiro turno, o servidor aceita um voto por nome normalizado e bloqueia autovoto quando o nome declarado corresponde ao do candidato escolhido.
4. Depois do encerramento, o sistema apresenta totais, percentuais, brancos e apuração animada.
5. O segundo turno é aberto pela comissão entre os dois classificados. Em empate na classificação, a comissão seleciona os finalistas elegíveis segundo o acordo do grupo; o código restringe a seleção aos classificados/empatados permitidos.
6. O segundo turno tem votação independente. Empate final permite uma nova votação de desempate.

### Limitações que devem ser conhecidas

- A identificação é baseada no **nome informado**, sem comprovação de identidade. O bloqueio não garante uma pessoa física por voto e não impede alguém de declarar outro nome.
- O hash usado para limitar repetição de nomes não resolve essa limitação de identidade.
- Os nomes e escolhas são guardados no servidor e divulgados após o encerramento de cada turno, com aceite solicitado antes do voto. O projeto **não oferece sigilo permanente do voto**.
- A animação é uma apresentação dos registros após o encerramento, não uma certificação externa nem uma contagem independente.
- Código público permite inspeção, mas não prova sozinho qual versão está rodando nem impede alterações por quem administra hospedagem e banco.
- A autenticação do comitê protege operações administrativas; a senha não é parte do código público.
- Não se trata de um sistema oficial do Governo Federal ou da Justiça Eleitoral.

## Como executar localmente

Requer Node.js **22.13 ou superior**, npm e acesso à internet para instalar as dependências. Para os testes com importação direta de TypeScript, recomenda-se Node.js 24.

```sh
npm ci
```

Crie uma **chave própria de desenvolvimento**, diferente da usada na eleição oficial. O comando abaixo cria o arquivo local `.dev.vars`, ignorado pelo Git:

```sh
node -e "require('node:fs').writeFileSync('.dev.vars','ANTK_ADMIN_KEY='+require('node:crypto').randomBytes(32).toString('hex')+'\n')"
```

Guarde essa chave somente no seu ambiente. Ela controla apenas sua instância local. Não copie a senha oficial para o repositório.

Gere a configuração de execução:

```sh
npm run build
```

Aplique **uma vez**, em ordem, as migrations no banco local vazio:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_legal_the_fury.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_late_shatterstar.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_fast_talisman.sql
```

Todos esses comandos usam `--local`: não conectam ao banco de produção. Não reaplique migrations em uma base já inicializada.

Inicie a prévia de desenvolvimento:

```sh
npm run dev
```

Abra o endereço local indicado, normalmente `http://127.0.0.1:5173`. O painel fica em `/admin` e usa a chave **local** criada acima. Como alternativa para visualizar o build, execute `npm start`. A base local não contém os cadastros ou votos reais da eleição.

O README original em `docs/README-original.md` descreve detalhes adicionais dos perfis de execução e da infraestrutura fornecida pelo starter.

## Testes

Testes locais das regras, contagem, fotos e tamanho de propostas:

```sh
node tests/election-rules.test.mjs
node tests/counting.test.mjs
node tests/candidate-photo-match.test.mjs
node tests/proposal-length.test.mjs
```

Os testes de integração `election.integration.mjs` e `candidate-removal.integration.mjs` alteram dados de teste e exigem servidor isolado em `http://127.0.0.1:5174`, chave local e base vazia separada. Não os execute contra a base de uso cotidiano. Eles bloqueiam o uso de outro endereço.

## GitHub e publicação

O GitHub será usado somente para distribuir e versionar estes arquivos. Esta exportação **não cria automaticamente um repositório remoto**. Não há implantação automática para o site oficial.

Ao criar `antk-eleicoes`, publique a pasta exportada como um novo repositório e mantenha fora dela qualquer `.dev.vars`, `.env`, token, banco de dados ou configuração pessoal de autenticação. O histórico antigo não está incluído.

## Licenças

Avisos e licenças de código de terceiros foram preservados em `vendor/` e `scripts/vite/`. Não foi adicionada uma licença geral nova ao código do projeto; disponibilização pública não deve ser confundida com concessão de uma licença que o autor não escolheu.
