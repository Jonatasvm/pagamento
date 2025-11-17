# 🚀 Integração Frontend com Backend Flask

## ✅ O que foi implementado

### 1. **apiService.js** (Central de Comunicação)

Todas as chamadas HTTP passam por esta função central que:

- Gerencia tokens automaticamente
- Trata erros de autenticação (401/422)
- Exibe toasts com mensagens amigáveis
- Padroniza todas as requisições

**Funções disponíveis:**

- `login(usuario, password)` - Autentica usuário
- `register(usuario, password, role)` - Registra novo usuário
- `getObras()` - Lista todas as obras
- `createObra(obraData)` - Cria nova obra
- `updateObra(id, obraData)` - Atualiza obra
- `deleteObra(id)` - Deleta obra
- `getUsuarios()` - Lista usuários
- `createUsuario(userData)` - Cria usuário
- `updateUsuario(id, userData)` - Atualiza usuário
- `deleteUsuario(id)` - Deleta usuário

---

## 📝 Endpoints do Backend Mapeados

### AUTH

```javascript
// POST /register
await register("joao", "senha123", "admin");

// POST /login
const res = await login("joao", "senha123");
// Retorna: { access_token: "...", role: "admin", id: 1, usuario: "joao" }
```

### OBRAS

```javascript
// GET /obras
const obras = await getObras();

// POST /obras
await createObra({
  nome: "Obra A",
  endereco: "Rua X",
  status: "ativo",
});

// PUT /obras/{id}
await updateObra(1, {
  nome: "Obra A Atualizada",
  endereco: "Rua Y",
  status: "ativo",
});

// DELETE /obras/{id}
await deleteObra(1);
```

### USUÁRIOS

```javascript
// GET /usuarios
const usuarios = await getUsuarios();

// POST /usuarios
await createUsuario({
  usuario: "maria",
  password: "senha456",
  role: "user",
});

// PUT /usuarios/{id}
await updateUsuario(1, {
  usuario: "maria_atualizado",
  password: "nova_senha",
  role: "admin",
});

// DELETE /usuarios/{id}
await deleteUsuario(1);
```

---

## 📱 Componentes Atualizados

### 1. **Login.jsx**

- ✅ Usa `apiService.js` em vez de axios direto
- ✅ Armazena token, role, user_id e usuario no localStorage
- ✅ Redireciona baseado no role (admin → /dashboard, user → /solicitacao)
- ✅ Feedback visual com loading

### 2. **Register.jsx** (NOVO)

- ✅ Permite registro de novos usuários
- ✅ Validação de senhas iguais
- ✅ Suporte para role admin/user
- ✅ Redireciona para login após sucesso

### 3. **DashboardUsers.jsx**

- ✅ Carrega obras da API ao inicializar (useEffect)
- ✅ Carrega usuários da API ao inicializar (useEffect)
- ✅ `handleAddObra` - Cria obra via API
- ✅ `handleSaveObra` - Atualiza obra via API
- ✅ `handleConfirmRemoveObra` - Deleta obra via API
- ✅ `handleAddNewUser` - Cria usuário via API
- ✅ `handleSaveUser` - Atualiza usuário via API
- ✅ `handleConfirmRemoveUser` - Deleta usuário via API

### 4. **PrivateRoute.jsx**

- ✅ Verifica presença de token
- ✅ Valida role obrigatório se especificado
- ✅ Redireciona para /login se não autenticado
- ✅ Redireciona para rota apropriada se role não corresponde

### 5. **App.jsx**

- ✅ Adicionada rota `/register` para novo componente
- ✅ Adicionada rota `/login` como alias
- ✅ Adicionado `roleRequired` para rotas protegidas
  - `/solicitacao` → roleRequired="user"
  - `/dashboard` → roleRequired="admin"
  - `/dashboard/users` → roleRequired="admin"

---

## 🔑 Fluxo de Autenticação

```
1. Usuário acessa "/" ou "/login"
   ↓
2. Faz login com credenciais
   ↓
3. `login()` chama POST /login
   ↓
4. Backend retorna { access_token, role, id, usuario }
   ↓
5. Frontend armazena token no localStorage
   ↓
6. Redireciona baseado em role:
   - "admin" → /dashboard
   - "user" → /solicitacao
   ↓
7. PrivateRoute valida token em cada acesso protegido
   ↓
8. Se token expirado (401/422) → Limpa storage + redireciona para /login
```

---

## ⚙️ Configuração

### URL Base da API

Editar em `apiService.js`:

```javascript
const API_BASE_URL = "http://127.0.0.1:80";
```

### Roles Válidos

- `"admin"` - Acesso ao dashboard e gerenciamento
- `"user"` - Acesso limitado a solicitações

---

## 🐛 Troubleshooting

### Token não armazenado

**Problema:** Login não funciona

- Verificar se `login()` está retornando `access_token` correto
- Verificar localStorage no DevTools (F12)

### Erro 401 ao chamar API

**Problema:** Token inválido ou expirado

- Verificar se token foi armazenado corretamente
- Verificar formato: `Authorization: Bearer <token>`
- Renovar login

### Usuários não aparecem

**Problema:** `getUsuarios()` retorna erro

- Verificar se está autenticado como admin
- Verificar se role no localStorage é "admin"
- Verificar resposta do backend em Network (F12)

---

## 📊 Estrutura de Dados

### Usuário (POST /usuarios)

```json
{
  "usuario": "string",
  "password": "string",
  "role": "admin | user"
}
```

### Obra (POST /obras)

```json
{
  "nome": "string",
  "endereco": "string",
  "status": "string"
}
```

### Response Login

```json
{
  "access_token": "string",
  "role": "admin | user",
  "id": "number",
  "usuario": "string"
}
```

---

## 🎯 Próximos Passos (Opcionais)

1. Implementar refresh token para melhor segurança
2. Adicionar validação de email para registro
3. Implementar recuperação de senha
4. Adicionar testes unitários
5. Implementar paginação em listas grandes
