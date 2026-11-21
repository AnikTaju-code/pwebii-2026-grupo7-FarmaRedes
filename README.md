# FarmaRede — Projecto final PWEB II · Grupo 7

Protótipo académico em Vue 3, Vite, Pinia, Leaflet e Node.js.

## Duas áreas
- **Cliente**: cria conta, consulta medicamentos de farmácias registadas, escolhe farmácia, faz encomendas e escolhe entrega/recolha.
- **Farmácia**: cria conta, coloca nome, endereço, telefone e coordenadas tocando no mapa; mantém stock, preços e acompanha as suas encomendas.

Os novos registos começam vazios: não há contas, encomendas, farmácias ou stocks fictícios.
O catálogo contém nomes genéricos de medicamentos como referência, sem afirmar stock disponível.

## Localmente

Instalar Node.js 20 ou superior.

Terminal 1:
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
Terminal 2:
```bash
cd frontend
npm install
npm run dev
```
Abrir http://localhost:5173 e criar uma conta de farmácia. Depois adicionar stock.

## Render

1. Publicar este projecto num repositório GitHub.
2. No Render, escolher **New > Blueprint** e seleccionar o repositório, usando `render.yaml`.
3. O serviço instala backend/frontend, compila Vue e usa o Express para servir o frontend e a API no mesmo domínio.
4. Render cria JWT_SECRET e monta um disco em `/var/data`. **O disco persistente requer um plano compatível pago**. Sem ele, o ficheiro JSON pode perder-se em reinícios ou novas implantações.
5. Verificar `/api/saude` e criar contas pelo formulário. **Não colocar contas nem passwords em repositórios.**

Para GitHub Pages, o frontend pode ser publicado separadamente, mas necessita de `VITE_API_URL` e configuração de CORS no Render; a configuração padrão é para um serviço único no Render.

## Segurança e âmbito

- Cada gestor acede **apenas** ao stock e às encomendas da sua farmácia.
- Senhas com bcrypt; JWT assinado e guardado no navegador para este protótipo.
- A criação de farmácias é livre no protótipo e **não verifica licenças comerciais**. Em produção seria necessária aprovação.
- M-Pesa/e-Mola: fluxos de teste; **não movimentam dinheiro**. A interface não deve afirmar cobrança real.
- Persistência JSON é adequada para demonstração com um processo. Para utilização comercial ou múltiplas instâncias: PostgreSQL, transacções e integrações verificadas.
- O envio SMS foi programado com a API Twilio, **mas só envia realmente** depois de configurar credenciais e um número de envio válido. O estado do provedor não comprova entrega ao destinatário; testar a recepção no telemóvel antes da apresentação.
- O mapa da aplicação usa OpenStreetMap. Os dados de farmácias registadas são introduzidos pelos utilizadores.

## Ficheiros centrais
- `frontend/src/views/Login.vue`: login e registo (cliente/farmácia).
- `frontend/src/components/SeleccionarLocal.vue`: seleccionar coordenadas no Leaflet.
- `frontend/src/views/Gestao.vue`: stock, preços e encomendas da farmácia.
- `backend/src/server.js`: rotas, autenticação, registo de farmácias, controlo de acesso e SSE.
- `backend/src/store.js`: persistência e estado inicial vazio.

## Colaboração
Cada elemento do Grupo 7 deve realizar commits num branch próprio e abrir um Pull Request. Declarar a utilização de IA no README/BRD.


## SMS: configuração das notificações de encomenda (requisito R3)

1. Criar conta em https://www.twilio.com/ e seguir a configuração de Messaging/SMS. Para ensaios gratuitos, verificar o número destinatário e as restrições de modelos, país e conta. A configuração de SMS real pode requerer conta paga; não há envio real sem credenciais.
2. Em `backend/.env` (não enviar ao GitHub), configurar `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` e `TWILIO_FROM` (ou `TWILIO_MESSAGING_SERVICE_SID`).
3. Reiniciar backend. Verificar `GET /api/saude`: `smsConfigurado` deverá ser `true`.
4. No carrinho, marcar **Quero receber a confirmação ... por SMS** e indicar o telefone. Na nova encomenda, o backend envia a mensagem separadamente; a compra não falha por problemas no fornecedor de SMS.
5. Os números utilizados devem pertencer aos próprios utilizadores ou ter consentimento dos destinatários. Nenhum segredo é enviado ao navegador. O serviço Twilio tem custos/restrições próprios e na conta de avaliação o conteúdo pode ficar limitado a modelos predefinidos.

## Validação M-Pesa / e-Mola

- M-Pesa: 84 ou 85 + sete dígitos; e-Mola: 86 ou 87 + sete dígitos.
- Um número de outro operador devolve erro de validação antes de reservar stock.
- `PAYMENT_MODE=demo` activa apenas o fluxo de pagamento de teste; não há débito bancário, callback ou confirmação oficial de operadora. Não apresentar transacção de teste como cobrança real.
- Testes automáticos: `cd backend && npm test`.

## GitHub Pages + Render (requisitos R4-R6)

O enunciado exige **ambos**: código num GitHub público e o frontend acessível pelo **GitHub Pages**; o **Render** fica com a API Node.js e os dados.

1. Criar repositório público, colocar a pasta `frontend/`, `backend/`, `render.yaml` e `.github/workflows/pages.yml` na raiz.
2. Cada membro cria branch próprio, faz commit e abre Pull Request, revisto por outro colega, com merge no `main`. Não criar commits por terceiros nem partilhar segredos.
3. Criar no Render o serviço pelo `render.yaml`, configurar `JWT_SECRET` (gerado), `FRONTEND_ORIGIN=https://<utilizador>.github.io` e as variáveis Twilio em **Environment**. O plano com disco persistente é pago. Se se desejar ambiente gratuito com persistência, substituir o JSON por uma base de dados alojada externamente.
4. No repositório GitHub, em **Settings > Secrets and variables > Actions > Variables**, criar `VITE_API_URL` com `https://<nome-do-servico>.onrender.com` (sem `/api`).
5. Em **Settings > Pages**, usar a fonte **GitHub Actions**. O workflow compila o frontend com a base correcta do nome do repositório.
6. Confirmar no GitHub Pages mapa, login, detalhe `#/medicamento/:id`, carrinho, notificações e estados vazios/erro. Confirmar nas DevTools que os pedidos `/api` vão para o Render.
7. Inserir os links do repositório e GitHub Pages na capa do BRD e no README antes da entrega.

### Requisitos do enunciado (estado)

| Código | Entrega no projecto | Confirmação exigida |
|---|---|---|
| R1 | Vue 3, Vite, Composition API | `npm run build` e navegador |
| R2 | Overpass / OpenStreetMap Maputo com `fetch`, loading e erro | Testar a API em ligação real |
| R3 | Envio SMS através da API Twilio no backend | Configurar conta e receber SMS |
| R4 | Workflow de GitHub Pages incluído | Publicar e testar link público |
| R5 | README + estrutura para GitHub | Criar repositório público |
| R6 | Instruções para branches e PRs | Cada integrante deve realizar a sua contribuição |

Também inclui rota dinâmica `/medicamento/:id`, rota inexistente, componentes com `props`/`emits`, composable e validação de formulário.

### Dados e fontes
- Farmácias no mapa: OpenStreetMap, consultado por Overpass API, `amenity=pharmacy` em Maputo. A disponibilidade da API pública e o conteúdo podem variar.
- OSM licencia os dados sob ODbL e exige atribuição; os dados de localização não incluem inventário.
- O catálogo genérico e os registos de stock são dados da aplicação; não são extraídos do OpenStreetMap.

### Ferramentas utilizadas
ChatGPT (OpenAI) auxiliou a estruturação, a revisão e partes do código. Os membros do grupo devem testar e compreender a aplicação e declarar esse uso na submissão.

## Responsabilidades do Grupo 7

Consultar [`RESPONSABILIDADES_GRUPO7.md`](./RESPONSABILIDADES_GRUPO7.md) para a ligação entre cada membro, os ficheiros concretos desta versão, tarefas, branches e ordem de integração. Os guias individuais acompanham a entrega do grupo.
