<!DOCTYPE html>
<html lang="pt-BR" class="h-full bg-gray-50">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solicitação de Pagamentos</title>
    <!-- Carrega o Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Carrega a biblioteca 'xlsx' para gerar CSV (na verdade, usaremos CSV puro) -->
    <!-- (Não é necessário para CSV, mas útil se fosse Excel) -->
    <!-- Ícones (Heroicons) -->
    <script type="module" src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js"></script>
    <script nomodule src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.js"></script>
    <style>
        /* Estilo para o spinner de carregamento */
        .spinner {
            border-top-color: #3498db;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        /* Oculta setas de input[type=number] */
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        input[type=number] {
            -moz-appearance: textfield;
        }
    </style>
</head>
<body class="h-full font-sans text-gray-800">

    <!-- Container Principal -->
    <div id="app-container" class="min-h-full">

        <!-- Tela de Carregamento Global -->
        <div id="global-loader" class="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div class="spinner h-16 w-16 rounded-full border-4 border-gray-200"></div>
            <p class="ml-4 text-lg font-medium">Carregando...</p>
        </div>

        <!-- Tela de Login -->
        <div id="login-screen" class="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div class="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                    Acessar sua conta
                </h2>
            </div>

            <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div class="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
                    <form class="space-y-6" id="login-form">
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                            <div class="mt-1">
                                <input id="login-email" name="email" type="email" autocomplete="email" required
                                    class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm">
                            </div>
                        </div>

                        <div>
                            <label for="password" class="block text-sm font-medium text-gray-700">Senha</label>
                            <div class="mt-1">
                                <input id="login-password" name="password" type="password" autocomplete="current-password"
                                    required
                                    class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm">
                            </div>
                        </div>

                        <div id="login-error" class="hidden text-sm text-red-600"></div>

                        <div>
                            <button type="submit"
                                class="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                                Entrar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Tela do Usuário (Cadastro de Solicitação) -->
        <div id="user-screen" class="hidden min-h-full">
            <!-- Header -->
            <nav class="bg-white shadow-sm">
                <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div class="flex h-16 justify-between">
                        <div class="flex">
                            <div class="flex flex-shrink-0 items-center">
                                <h1 class="text-xl font-bold text-blue-600">Solicitar Pagamento</h1>
                            </div>
                        </div>
                        <div class="flex items-center">
                            <span class="mr-4 text-sm font-medium" id="user-name-header"></span>
                            <button id="logout-button-user" type="button"
                                class="rounded-md border border-gray-300 bg-white py-1 px-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <!-- Formulário -->
            <div class="py-10">
                <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <form class="space-y-6 rounded-lg border border-gray-200 bg-white p-8 shadow-md" id="payment-request-form">
                        <div>
                            <h3 class="text-lg font-medium leading-6 text-gray-900">Informações da Solicitação</h3>
                            <p class="mt-1 text-sm text-gray-500">Preencha os dados para o pagamento.</p>
                        </div>

                        <!-- Obras -->
                        <div>
                            <label for="obra" class="block text-sm font-medium text-gray-700">Obra</label>
                            <select id="obra" name="obra" required
                                class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                                <option value="">Selecione uma obra...</option>
                                <!-- Opções carregadas via JS -->
                            </select>
                        </div>

                        <!-- Referente -->
                        <div>
                            <label for="referente" class="block text-sm font-medium text-gray-700">Referente a</label>
                            <input type="text" name="referente" id="referente" required
                                placeholder="Ex: Material elétrico"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                        </div>
                        
                        <!-- Valor -->
                        <div>
                            <label for="valor" class="block text-sm font-medium text-gray-700">Valor Total (R$)</label>
                            <input type="number" name="valor" id="valor" step="0.01" min="0.01" required
                                placeholder="1250,50"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                        </div>
                        
                        <!-- Anexo -->
                        <div>
                            <label for="anexo" class="block text-sm font-medium text-gray-700">Anexar arquivo (NF, Boleto, etc.)</label>
                            <input type="file" name="anexo" id="anexo"
                                class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:py-2 file:px-4 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"/>
                            <div id="upload-progress-container" class="hidden mt-2">
                                <span id="upload-status" class="text-sm"></span>
                                <div class="w-full bg-gray-200 rounded-full h-2.5">
                                    <div id="upload-progress-bar" class="bg-blue-600 h-2.5 rounded-full" style="width: 0%"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Dados do Recebedor -->
                        <div class="border-t border-gray-200 pt-6">
                            <h3 class="text-lg font-medium leading-6 text-gray-900">Dados do Recebedor</h3>
                        </div>

                        <!-- Titular -->
                        <div>
                            <label for="titular" class="block text-sm font-medium text-gray-700">Titular (Fornecedor)</label>
                            <input type="text" name="titular" id="titular" list="fornecedores-list" required
                                placeholder="Digite para buscar..."
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                            <datalist id="fornecedores-list">
                                <!-- Opções carregadas via JS -->
                            </datalist>
                        </div>
                        
                        <!-- CPF/CNPJ -->
                        <div>
                            <label for="cpf_cnpj" class="block text-sm font-medium text-gray-700">CPF/CNPJ</label>
                            <input type="text" name="cpf_cnpj" id="cpf_cnpj" required
                                placeholder="CPF ou CNPJ do titular"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                        </div>

                        <!-- Forma de Pagamento -->
                        <div class="border-t border-gray-200 pt-6">
                            <h3 class="text-lg font-medium leading-6 text-gray-900">Forma de Pagamento</h3>
                        </div>
                        
                        <div>
                            <label for="forma_pagamento" class="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                            <select id="forma_pagamento" name="forma_pagamento" required
                                class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                                <option value="">Selecione...</option>
                                <option value="pix">PIX</option>
                                <option value="boleto">Boleto</option>
                                <option value="cheque">Cheque</option>
                            </select>
                        </div>

                        <!-- Campos Condicionais de Pagamento -->
                        <div id="payment-details-container" class="space-y-4">
                            
                            <!-- PIX -->
                            <div id="pix-details" class="hidden space-y-4">
                                <div>
                                    <label for="pix-chave" class="block text-sm font-medium text-gray-700">Chave PIX</label>
                                    <input type="text" name="pix-chave" id="pix-chave"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                                </div>
                                <div>
                                    <label for="data_pagamento_pix" class="block text-sm font-medium text-gray-700">Data para Pagamento</label>
                                    <input type="date" name="data_pagamento_pix" id="data_pagamento_pix"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                                </div>
                            </div>
                            
                            <!-- CHEQUE -->
                            <div id="cheque-details" class="hidden space-y-4">
                                <div>
                                    <label for="data_pagamento_cheque" class="block text-sm font-medium text-gray-700">Data para Pagamento</label>
                                    <input type="date" name="data_pagamento_cheque" id="data_pagamento_cheque"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                                </div>
                            </div>

                            <!-- BOLETO -->
                            <div id="boleto-details" class="hidden space-y-4">
                                <div>
                                    <label for="parcelas_qty" class="block text-sm font-medium text-gray-700">Quantidade de Parcelas</label>
                                    <input type="number" name="parcelas_qty" id="parcelas_qty" min="1" max="24" value="1"
                                        class="mt-1 block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                                </div>
                                <div id="parcelas-container" class="space-y-4">
                                    <!-- Parcelas geradas via JS -->
                                </div>
                            </div>

                        </div>

                        <!-- Ações -->
                        <div class="flex justify-end pt-6 border-t border-gray-200">
                            <button type="submit" id="submit-request-button"
                                class="flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-6 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                                Enviar Solicitação
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Tela do Admin (Gerência) -->
        <div id="admin-screen" class="hidden min-h-full">
            <!-- Header -->
            <nav class="bg-white shadow-sm">
                <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div class="flex h-16 justify-between">
                        <div class="flex">
                            <div class="flex flex-shrink-0 items-center">
                                <h1 class="text-xl font-bold text-blue-600">Gerenciar Pagamentos</h1>
                            </div>
                        </div>
                        <div class="flex items-center">
                            <span class="mr-4 text-sm font-medium" id="admin-name-header"></span>
                            <button id="logout-button-admin" type="button"
                                class="rounded-md border border-gray-300 bg-white py-1 px-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <!-- Filtros e Ações -->
            <div class="mx-auto max-w-full bg-gray-50/50 py-6 px-4 sm:px-6 lg:px-8">
                <div class="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <!-- Filtro Data Início -->
                        <div>
                            <label for="filter-date-start" class="block text-sm font-medium text-gray-700">De</label>
                            <input type="date" id="filter-date-start" name="filter-date-start"
                                class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                        </div>
                        <!-- Filtro Data Fim -->
                        <div>
                            <label for="filter-date-end" class="block text-sm font-medium text-gray-700">Até</label>
                            <input type="date" id="filter-date-end" name="filter-date-end"
                                class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                        </div>
                        <!-- Filtro Status -->
                        <div>
                            <label for="filter-status" class="block text-sm font-medium text-gray-700">Status</label>
                            <select id="filter-status" name="filter-status"
                                class="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                                <option value="nao-gerados">Não Gerados</option>
                                <option value="ja-gerados">Já Gerados</option>
                                <option value="todos">Todos</option>
                            </select>
                        </div>
                        <!-- Botão Aplicar Filtro -->
                        <div class="self-end">
                            <button id="apply-filters-button" type="button"
                                class="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                                <ion-icon name="filter-outline" class="mr-2 h-5 w-5"></ion-icon>
                                Aplicar Filtros
                            </button>
                        </div>
                    </div>
                    
                    <div class="flex flex-col gap-4 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
                        <button id="save-changes-button" type="button"
                            class="flex w-full justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:w-auto">
                            <ion-icon name="save-outline" class="mr-2 h-5 w-5"></ion-icon>
                            Salvar Alterações
                        </button>
                        <button id="generate-csv-button" type="button"
                            class="flex w-full justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 sm:w-auto">
                            <ion-icon name="download-outline" class="mr-2 h-5 w-5"></ion-icon>
                            Gerar CSV
                        </button>
                    </div>
                </div>
            </div>

            <!-- Tabela de Gerência -->
            <div class="mx-auto max-w-full px-4 sm:px-6 lg:px-8 pb-10">
                <div id="admin-loader" class="hidden text-center py-10">
                    <div class="spinner mx-auto h-12 w-12 rounded-full border-4 border-gray-200"></div>
                    <p class="mt-4 text-gray-600">Buscando dados...</p>
                </div>
                <div id="admin-no-data" class="hidden text-center py-10">
                    <p class="text-gray-600">Nenhum registro encontrado para os filtros selecionados.</p>
                </div>
                <div id="admin-grid-container" class="overflow-x-auto shadow-md rounded-lg border border-gray-200 bg-white">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th scope="col" class="sticky left-0 top-0 z-10 bg-gray-50 px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                                    <input type="checkbox" id="select-all-checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                </th>
                                <th scope="col" class="sticky left-10 top-0 z-10 bg-gray-50 px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style="min-width: 200px;">Titular</th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style="min-width: 150px;">Solicitante</th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style="min-width: 150px;">Valor (R$)</th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style="min-width: 150px;">Forma Pag.</th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style="min-width: 150px;">Data Lanç.</th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style="min-width: 150px;">Data Compet.</th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style="min-width: 150px;">Data P/ Pag.</th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style="min-width: 250px;">Referente</th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style="min-width: 150px;">PIX</th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style="min-width: 150px;">CPF/CNPJ</th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style="min-width: 150px;">Obra</th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style="min-width: 150px;">Conta</th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style="min-width: 100px;">Categoria</th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style="min-width: 100px;">Quem Paga</th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style="min-width: 100px;">Status</th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style="min-width: 100px;">Anexo</th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style="min-width: 100px;">Data Pag.</th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style="min-width: 100px;">Indice Etapa</th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style="min-width: 100px;">Coluna 20</th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style="min-width: 100px;">Coluna 21</th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style="min-width: 150px;">Observações</th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" style="min-width: 180px;">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody id="admin-grid-body" class="divide-y divide-gray-200 bg-white">
                            <!-- Linhas geradas via JS -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

    </div> <!-- Fim #app-container -->

    <!-- Modal de Notificação -->
    <div id="notification-modal" class="fixed inset-0 z-50 hidden items-center justify-center" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
        <div class="relative z-10 transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div class="sm:flex sm:items-start">
                    <div id="notification-icon-container" class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10">
                        <!-- Ícone (sucesso ou erro) -->
                    </div>
                    <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 class="text-lg font-medium leading-6 text-gray-900" id="notification-title"></h3>
                        <div class="mt-2">
                            <p class="text-sm text-gray-500" id="notification-message"></p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button type="button" id="notification-close-button" class="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                    Fechar
                </button>
            </div>
        </div>
    </div>


    <!-- Scripts do Firebase -->
    <script type="module">
        // Importa os módulos do Firebase
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { 
            getAuth, 
            signInWithEmailAndPassword, 
            onAuthStateChanged, 
            signOut,
            signInWithCustomToken,
            signInAnonymously
        } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { 
            getFirestore, 
            doc, 
            getDoc, 
            setDoc, 
            addDoc, 
            updateDoc, 
            collection, 
            query, 
            where, 
            getDocs, 
            Timestamp,
            onSnapshot,
            writeBatch
        } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
        import { 
            getStorage, 
            ref, 
            uploadBytesResumable, 
            getDownloadURL 
        } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
        import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";

        // --- Configuração e Variáveis Globais ---

        // ATENÇÃO: Cole sua configuração do Firebase aqui
        // Você pode encontrar isso no console do Firebase do seu projeto
        // const firebaseConfig = {
        //     apiKey: "SEU_API_KEY",
        //     authDomain: "SEU_AUTH_DOMAIN",
        //     projectId: "SEU_PROJECT_ID",
        //     storageBucket: "SEU_STORAGE_BUCKET",
        //     messagingSenderId: "SEU_MESSAGING_SENDER_ID",
        //     appId: "SEU_APP_ID"
        // };
        
        // Use a configuração fornecida pelo ambiente (se existir)
        const firebaseConfig = typeof __firebase_config !== 'undefined' 
            ? JSON.parse(__firebase_config) 
            : { /* Cole sua config aqui como fallback */ };
            
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

        // Inicializa o Firebase
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        const storage = getStorage(app);
        const analytics = getAnalytics(app);

        // Referências das telas
        const globalLoader = document.getElementById('global-loader');
        const loginScreen = document.getElementById('login-screen');
        const userScreen = document.getElementById('user-screen');
        const adminScreen = document.getElementById('admin-screen');
        
        // Elementos do Modal de Notificação
        const notificationModal = document.getElementById('notification-modal');
        const notificationTitle = document.getElementById('notification-title');
        const notificationMessage = document.getElementById('notification-message');
        const notificationIconContainer = document.getElementById('notification-icon-container');
        const notificationCloseButton = document.getElementById('notification-close-button');

        // Mapas de cache para "joins"
        let obrasMap = {};
        let contasMap = {};
        let fornecedoresMap = {};
        
        let currentUserData = null;
        let unsubscribeAdminListener = null; // Para desligar o listener do admin

        // --- Funções Auxiliares ---

        /** Mostra uma notificação modal */
        function showNotification(title, message, isError = false) {
            notificationTitle.textContent = title;
            notificationMessage.textContent = message;

            notificationIconContainer.innerHTML = ''; // Limpa ícone anterior
            if (isError) {
                notificationIconContainer.className = 'mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10';
                notificationIconContainer.innerHTML = '<ion-icon name="close-outline" class="h-6 w-6 text-red-600"></ion-icon>';
            } else {
                notificationIconContainer.className = 'mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10';
                notificationIconContainer.innerHTML = '<ion-icon name="checkmark-outline" class="h-6 w-6 text-green-600"></ion-icon>';
            }
            
            notificationModal.classList.remove('hidden');
            notificationModal.classList.add('flex');
        }
        
        notificationCloseButton.addEventListener('click', () => {
             notificationModal.classList.add('hidden');
             notificationModal.classList.remove('flex');
        });

        /** Converte data do formato AAAA-MM-DD para DD/MM/AAAA */
        function formatDateBR(dateString) {
            if (!dateString) return '';
            try {
                // Se for um objeto Timestamp do Firebase
                if (dateString.toDate) {
                    dateString = dateString.toDate();
                }
                // Se for uma string de data (ex: 2024-10-25)
                else if (typeof dateString === 'string' && dateString.includes('-')) {
                    const parts = dateString.split('-');
                    if (parts.length === 3) {
                         // new Date(year, monthIndex, day)
                        dateString = new Date(parts[0], parts[1] - 1, parts[2]);
                    } else {
                         dateString = new Date(dateString);
                    }
                }
                // Se for um objeto Date
                else {
                    dateString = new Date(dateString);
                }
                
                if (isNaN(dateString.getTime())) return ''; // Data inválida
                
                return dateString.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            } catch (e) {
                console.warn("Erro ao formatar data:", dateString, e);
                return '';
            }
        }
        
        /** Converte data do formato DD/MM/AAAA para AAAA-MM-DD (para input[type=date]) */
        function formatDateISO(dateString) {
             if (!dateString) return '';
             try {
                // Se for objeto Timestamp
                if (dateString.toDate) {
                    return dateString.toDate().toISOString().split('T')[0];
                }
                // Se for DD/MM/AAAA
                if (dateString.includes('/')) {
                    const [day, month, year] = dateString.split('/');
                    if (day && month && year && year.length === 4) {
                        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    }
                }
                // Se já for ISO (AAAA-MM-DD)
                if (dateString.includes('-') && dateString.length === 10) {
                    return dateString;
                }
             } catch(e) {
                console.warn("Erro ao formatar data para ISO:", dateString, e);
             }
             return '';
        }
        
        /** Formata um número para BRL (R$ 1.234,50) */
        function formatCurrency(value) {
            const number = parseFloat(value);
            if (isNaN(number)) return '';
            return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
        
         /** Pega o valor formatado (ex: 1.250,50) e converte para número (1250.50) */
        function parseCurrency(value) {
            if (typeof value !== 'string') return value;
            return parseFloat(value.replace(/\./g, '').replace(',', '.'));
        }

        /** Formata Timestamp do Firebase */
        function formatTimestamp(timestamp) {
            if (!timestamp || !timestamp.toDate) return '';
            return timestamp.toDate().toLocaleString('pt-BR');
        }

        /** Define os valores padrão dos filtros de data (Hoje) */
        function setDefaultDates() {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('filter-date-start').value = today;
            document.getElementById('filter-date-end').value = today;
        }

        // --- Lógica de Autenticação ---

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Usuário está logado
                try {
                    // 1. Busca os dados do usuário (para saber o 'role' e 'nome')
                    const userDocRef = doc(db, `artifacts/${appId}/users`, user.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        currentUserData = { uid: user.uid, ...userDoc.data() };
                    } else {
                        // Se não existir, cria um usuário 'normal' por padrão
                        currentUserData = { 
                            uid: user.uid, 
                            email: user.email, 
                            nome: user.email.split('@')[0], // Nome padrão
                            role: 'user' 
                        };
                        // Salva esse usuário padrão
                        // Nota: Isso pode falhar se as regras de segurança não permitirem a criação do próprio doc
                        try {
                            await setDoc(userDocRef, { 
                                email: currentUserData.email, 
                                nome: currentUserData.nome, 
                                role: 'user' 
                            });
                        } catch (e) {
                            console.warn("Não foi possível salvar o doc do usuário, pode ser regra de segurança:", e.message);
                        }
                    }

                    // 2. Pré-carrega dados essenciais (Obras, Contas, Fornecedores)
                    await preloadEssentialData();

                    // 3. Redireciona com base na 'role'
                    if (currentUserData.role === 'admin') {
                        document.getElementById('admin-name-header').textContent = `Admin: ${currentUserData.nome}`;
                        adminScreen.classList.remove('hidden');
                        loginScreen.classList.add('hidden');
                        userScreen.classList.add('hidden');
                        setDefaultDates();
                        await loadAdminData(); // Carrega os dados do admin
                    } else {
                        document.getElementById('user-name-header').textContent = `Solicitante: ${currentUserData.nome}`;
                        userScreen.classList.remove('hidden');
                        loginScreen.classList.add('hidden');
                        adminScreen.classList.add('hidden');
                        await loadUserFormData(); // Carrega dados do formulário do usuário
                    }
                } catch (error) {
                    console.error("Erro ao buscar dados do usuário:", error);
                    showNotification("Erro de Permissão", `Erro ao carregar dados: ${error.message}`, true);
                    await handleLogout();
                }
            } else {
                // Usuário está deslogado
                currentUserData = null;
                loginScreen.classList.remove('hidden');
                userScreen.classList.add('hidden');
                adminScreen.classList.add('hidden');
                globalLoader.classList.add('hidden'); // Esconde o loader global
                
                // Limpa dados das telas
                document.getElementById('obra').innerHTML = '<option value="">Selecione uma obra...</option>';
                document.getElementById('fornecedores-list').innerHTML = '';
                document.getElementById('admin-grid-body').innerHTML = '';
                
                // Para o listener do admin se estiver ativo
                if (unsubscribeAdminListener) {
                    unsubscribeAdminListener();
                    unsubscribeAdminListener = null;
                }
            }
        });
        
        /** Tenta autenticar via token ou anônimo */
        async function initialAuth() {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                    console.warn("Nenhum token inicial. Logado anonimamente. O app pode não funcionar como esperado.");
                    // Em um app real com login/senha, não faríamos login anônimo
                    // Mas para este caso, o usuário precisa estar logado para ver o login
                    // A linha abaixo é para o app real
                    globalLoader.classList.add('hidden'); 
                }
            } catch (error) {
                console.error("Falha na autenticação inicial:", error);
                globalLoader.classList.add('hidden');
                showNotification("Erro de Autenticação", "Não foi possível conectar. Verifique sua configuração do Firebase.", true);
            }
        }

        // Lógica de Login (Email/Senha) - Se for usar login/senha em vez de anônimo/token
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            globalLoader.classList.remove('hidden');
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const errorDiv = document.getElementById('login-error');
            
            errorDiv.classList.add('hidden');
            
            try {
                // ATENÇÃO: O signInWithEmailAndPassword é para o app real
                // Se estiver usando o __initial_auth_token, esta tela não deve ser usada
                // Comente a linha abaixo se estiver usando o modo de token/anônimo
                // await signInWithEmailAndPassword(auth, email, password);
                
                // Simulação para o ambiente de teste (já que estamos logados anonimamente)
                // Em um app real, o onAuthStateChanged cuidaria disso
                console.warn("Login com email/senha não implementado no modo de teste. Use as credenciais do ambiente.");
                showNotification("Modo de Teste", "Login simulado. O onAuthStateChanged deve tratar a troca de usuário.", true);
                
                // Simulação de busca de usuário para teste
                 if (email.startsWith("admin@")) {
                     currentUserData = { uid: auth.currentUser.uid, role: 'admin', nome: 'Admin Teste' };
                     await loadAdminData();
                 } else {
                     currentUserData = { uid: auth.currentUser.uid, role: 'user', nome: 'Usuário Teste' };
                     await loadUserFormData();
                 }
                
            } catch (error) {
                console.error("Erro no login:", error);
                errorDiv.textContent = "Email ou senha inválidos.";
                errorDiv.classList.remove('hidden');
                globalLoader.classList.add('hidden');
            }
        });

        /** Lógica de Logout */
        async function handleLogout() {
            globalLoader.classList.remove('hidden');
            try {
                await signOut(auth);
                // O onAuthStateChanged vai cuidar de limpar a tela
                
                // Se não estiver usando login/senha, precisamos logar anonimamente de novo
                // await initialAuth(); 
            } catch (error) {
                console.error("Erro no logout:", error);
                globalLoader.classList.add('hidden');
            }
        }
        document.getElementById('logout-button-user').addEventListener('click', handleLogout);
        document.getElementById('logout-button-admin').addEventListener('click', handleLogout);

        // --- Funções de Carregamento de Dados (Pré-carga) ---
        
        async function preloadEssentialData() {
            try {
                 // Carrega Obras
                const obrasRef = collection(db, `artifacts/${appId}/public/data/obras`);
                const obrasSnap = await getDocs(obrasRef);
                obrasMap = {};
                obrasSnap.forEach(doc => {
                    obrasMap[doc.id] = { id: doc.id, ...doc.data() };
                });

                // Carrega Contas
                const contasRef = collection(db, `artifacts/${appId}/public/data/contas`);
                const contasSnap = await getDocs(contasRef);
                contasMap = {};
                contasSnap.forEach(doc => {
                    contasMap[doc.id] = { id: doc.id, ...doc.data() };
                });
                
                // Carrega Fornecedores
                const fornecedoresRef = collection(db, `artifacts/${appId}/public/data/fornecedores`);
                const fornecedoresSnap = await getDocs(fornecedoresRef);
                fornecedoresMap = {};
                const datalist = document.getElementById('fornecedores-list');
                datalist.innerHTML = '';
                fornecedoresSnap.forEach(doc => {
                    const data = doc.data();
                    fornecedoresMap[data.nome] = data; // Mapeia por nome
                    const option = document.createElement('option');
                    option.value = data.nome;
                    option.textContent = `${data.cpf_cnpj}`; // Ajuda visual
                    datalist.appendChild(option);
                });

            } catch (e) {
                 console.error("Erro fatal ao pré-carregar dados:", e);
                 showNotification("Erro de Dados", "Não foi possível carregar dados essenciais (Obras, Contas). O app não pode continuar.", true);
                 // Trava o app
                 globalLoader.classList.remove('hidden');
                 document.getElementById('global-loader').querySelector('p').textContent = "Erro fatal. Atualize a página.";
            }
        }

        // --- Lógica da Tela do Usuário (Cadastro) ---

        const userForm = document.getElementById('payment-request-form');
        const obraSelect = document.getElementById('obra');
        const titularInput = document.getElementById('titular');
        const cpfCnpjInput = document.getElementById('cpf_cnpj');
        const formaPagamentoSelect = document.getElementById('forma_pagamento');
        const pixDetails = document.getElementById('pix-details');
        const chequeDetails = document.getElementById('cheque-details');
        const boletoDetails = document.getElementById('boleto-details');
        const parcelasQtyInput = document.getElementById('parcelas_qty');
        const parcelasContainer = document.getElementById('parcelas-container');
        const valorTotalInput = document.getElementById('valor');
        const fileInput = document.getElementById('anexo');
        const uploadProgressContainer = document.getElementById('upload-progress-container');
        const uploadProgressBar = document.getElementById('upload-progress-bar');
        const uploadStatus = document.getElementById('upload-status');
        const submitButton = document.getElementById('submit-request-button');

        /** Carrega dados iniciais do formulário do usuário */
        async function loadUserFormData() {
            globalLoader.classList.remove('hidden'); // Mostra loader da tela
            
            // Filtra obras do usuário logado
            obraSelect.innerHTML = '<option value="">Carregando obras...</option>';
            const userObras = Object.values(obrasMap).filter(obra => obra.id_user === currentUserData.uid);
            
            obraSelect.innerHTML = '<option value="">Selecione uma obra...</option>';
            if (userObras.length > 0) {
                 userObras.forEach(obra => {
                    const option = document.createElement('option');
                    option.value = obra.id;
                    option.textContent = obra.nome_obra;
                    option.dataset.contaId = obra.id_conta; // Armazena o ID da conta
                    obraSelect.appendChild(option);
                });
            } else {
                 obraSelect.innerHTML = '<option value="">Nenhuma obra encontrada</option>';
            }

            // O datalist de fornecedores já foi carregado no preload()
            
            globalLoader.classList.add('hidden'); // Esconde loader global
        }
        
        /** Atualiza o CPF/CNPJ quando um fornecedor é selecionado */
        titularInput.addEventListener('input', () => {
            const selectedFornecedor = fornecedoresMap[titularInput.value];
            if (selectedFornecedor) {
                cpfCnpjInput.value = selectedFornecedor.cpf_cnpj || '';
                cpfCnpjInput.readOnly = true;
            } else {
                 cpfCnpjInput.value = '';
                 cpfCnpjInput.readOnly = false;
            }
        });

        /** Controla a exibição dos campos de pagamento */
        formaPagamentoSelect.addEventListener('change', () => {
            const method = formaPagamentoSelect.value;
            pixDetails.classList.toggle('hidden', method !== 'pix');
            chequeDetails.classList.toggle('hidden', method !== 'cheque');
            boletoDetails.classList.toggle('hidden', method !== 'boleto');

            // Define 'required' dinamicamente
            document.getElementById('pix-chave').required = (method === 'pix');
            document.getElementById('data_pagamento_pix').required = (method === 'pix');
            document.getElementById('data_pagamento_cheque').required = (method === 'cheque');
            document.getElementById('parcelas_qty').required = (method === 'boleto');

            if(method === 'boleto') {
                generateParcelas();
            } else {
                parcelasContainer.innerHTML = '';
            }
        });
        
        /** Gera os campos de parcela para boleto */
        function generateParcelas() {
            const qty = parseInt(parcelasQtyInput.value) || 1;
            const valorTotal = parseCurrency(valorTotalInput.value) || 0;
            const valorParcela = (valorTotal / qty).toFixed(2);
            
            parcelasContainer.innerHTML = '';
            
            for (let i = 1; i <= qty; i++) {
                const div = document.createElement('div');
                div.className = 'grid grid-cols-1 sm:grid-cols-2 gap-4 items-center border-t border-gray-200 pt-4';
                
                div.innerHTML = `
                    <p class="text-sm font-medium text-gray-700 col-span-1 sm:col-span-2">Parcela ${i} de ${qty}</p>
                    <div>
                        <label for="parcela_valor_${i}" class="block text-sm font-medium text-gray-700">Valor (R$)</label>
                        <input type="number" step="0.01" id="parcela_valor_${i}" name="parcela_valor_${i}" value="${valorParcela}" required
                            class="parcela-valor mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    </div>
                    <div>
                        <label for="parcela_vencimento_${i}" class="block text-sm font-medium text-gray-700">Vencimento</label>
                        <input type="date" id="parcela_vencimento_${i}" name="parcela_vencimento_${i}" required
                            class="parcela-vencimento mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    </div>
                `;
                parcelasContainer.appendChild(div);
            }
        }
        
        parcelasQtyInput.addEventListener('change', generateParcelas);
        valorTotalInput.addEventListener('input', generateParcelas); // Atualiza parcelas ao mudar valor total


        /** Envio do Formulário de Solicitação */
        userForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            submitButton.disabled = true;
            submitButton.textContent = "Enviando...";
            globalLoader.classList.remove('hidden');

            try {
                let anexoUrl = null;
                let anexoNome = null;
                const file = fileInput.files[0];

                // 1. Upload do Arquivo (se existir)
                if (file) {
                    const storageRef = ref(storage, `payment_attachments/${currentUserData.uid}/${Date.now()}_${file.name}`);
                    const uploadTask = uploadBytesResumable(storageRef, file);

                    uploadProgressContainer.classList.remove('hidden');
                    
                    await new Promise((resolve, reject) => {
                        uploadTask.on('state_changed', 
                            (snapshot) => {
                                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                uploadProgressBar.style.width = progress + '%';
                                uploadStatus.textContent = `Enviando arquivo... ${Math.round(progress)}%`;
                            }, 
                            (error) => {
                                console.error("Erro no upload:", error);
                                reject(error);
                            }, 
                            async () => {
                                anexoUrl = await getDownloadURL(uploadTask.snapshot.ref);
                                anexoNome = file.name;
                                uploadStatus.textContent = "Upload completo!";
                                resolve();
                            }
                        );
                    });
                }

                // 2. Coletar dados do formulário
                const formData = new FormData(userForm);
                const selectedObraOption = obraSelect.options[obraSelect.selectedIndex];
                const obraId = selectedObraOption.value;
                const obraData = obrasMap[obraId];

                // 3. Coletar dados de pagamento (Boleto, PIX, etc.)
                const formaPagamento = formaPagamentoSelect.value;
                let parcelasData = [];
                let pixChave = null;
                let dataPrevisaoPagamento = null;
                
                if (formaPagamento === 'boleto') {
                    const valorInputs = document.querySelectorAll('.parcela-valor');
                    const vencimentoInputs = document.querySelectorAll('.parcela-vencimento');
                    let valorTotalCalculado = 0;
                    
                    for(let i = 0; i < valorInputs.length; i++) {
                        const valor = parseCurrency(valorInputs[i].value);
                        valorTotalCalculado += valor;
                        parcelasData.push({
                            valor: valor,
                            vencimento: vencimentoInputs[i].value // Salva como AAAA-MM-DD
                        });
                    }
                    
                    // Validação simples de valor
                    const valorTotalForm = parseCurrency(valorTotalInput.value);
                    if (Math.abs(valorTotalCalculado - valorTotalForm) > 0.01 * parcelasData.length) { // Tolerância
                         throw new Error(`A soma das parcelas (R$ ${valorTotalCalculado.toFixed(2)}) não bate com o valor total (R$ ${valorTotalForm.toFixed(2)}).`);
                    }

                } else if (formaPagamento === 'pix') {
                    pixChave = document.getElementById('pix-chave').value;
                    dataPrevisaoPagamento = document.getElementById('data_pagamento_pix').value;
                } else if (formaPagamento === 'cheque') {
                    dataPrevisaoPagamento = document.getElementById('data_pagamento_cheque').value;
                }

                // 4. Montar o objeto para o Firestore
                const newRequest = {
                    // IDs e Nomes
                    solicitanteId: currentUserData.uid,
                    solicitanteNome: currentUserData.nome,
                    obraId: obraId,
                    obraNome: obraData.nome_obra,
                    contaId: obraData.id_conta, // ID da conta vindo da obra
                    
                    // Dados do Formulário
                    referente: formData.get('referente'),
                    valor: parseCurrency(formData.get('valor')),
                    titularNome: formData.get('titular'),
                    titularCpfCnpj: formData.get('cpf_cnpj'),
                    
                    // Dados de Pagamento
                    formaPagamento: formaPagamento,
                    pixChave: pixChave,
                    parcelas: parcelasData, // Array (vazio se não for boleto)
                    dataPrevisaoPagamento: dataPrevisaoPagamento, // (null se for boleto)
                    
                    // Arquivo
                    anexoUrl: anexoUrl,
                    anexoNome: anexoNome,
                    
                    // Metadados (Admin)
                    timestamp: Timestamp.now(), // Carimbo de data/hora
                    dataLancamento: new Date().toISOString().split('T')[0], // AAAA-MM-DD
                    dataCompetencia: new Date().toISOString().split('T')[0], // AAAA-MM-DD
                    categoria: "sem NF", // Fixo
                    quemPaga: "empresa", // Fixo
                    status: "pendente", // Status inicial
                    
                    // Campos vazios (para o admin preencher)
                    dataPagamentoReal: null,
                    indiceEtapaItem: "",
                    coluna20: "",
                    coluna21: "",
                    observacoes: ""
                };

                // 5. Salvar no Firestore
                const docRef = await addDoc(collection(db, `artifacts/${appId}/public/data/solicitacoes_pagamento`), newRequest);

                // 6. Sucesso
                showNotification("Sucesso!", "Solicitação de pagamento enviada.");
                userForm.reset();
                parcelasContainer.innerHTML = '';
                pixDetails.classList.add('hidden');
                chequeDetails.classList.add('hidden');
                boletoDetails.classList.add('hidden');
                uploadProgressContainer.classList.add('hidden');
                uploadProgressBar.style.width = '0%';
                uploadStatus.textContent = '';
                
            } catch (error) {
                console.error("Erro ao enviar solicitação:", error);
                showNotification("Erro", `Não foi possível enviar: ${error.message}`, true);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = "Enviar Solicitação";
                globalLoader.classList.add('hidden');
            }
        });
        
        
        // --- Lógica da Tela do Admin (Gerência) ---

        const adminLoader = document.getElementById('admin-loader');
        const adminNoData = document.getElementById('admin-no-data');
        const adminGridContainer = document.getElementById('admin-grid-container');
        const adminGridBody = document.getElementById('admin-grid-body');
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        
        /** Carrega os dados na grid do admin com base nos filtros */
        async function loadAdminData() {
            if (unsubscribeAdminListener) {
                unsubscribeAdminListener(); // Para o listener anterior
            }
            
            adminLoader.classList.remove('hidden');
            adminNoData.classList.add('hidden');
            adminGridBody.innerHTML = '';
            
            try {
                // 1. Montar a query
                let q = collection(db, `artifacts/${appId}/public/data/solicitacoes_pagamento`);
                
                // 2. Filtro de Status
                const statusFilter = document.getElementById('filter-status').value;
                if (statusFilter === 'nao-gerados') {
                    q = query(q, where("status", "==", "pendente"));
                } else if (statusFilter === 'ja-gerados') {
                    q = query(q, where("status", "==", "gerado"));
                }
                // Se for 'todos', não adiciona filtro de status
                
                // 3. Filtro de Data (timestamp)
                const dateStart = document.getElementById('filter-date-start').value;
                const dateEnd = document.getElementById('filter-date-end').value;
                
                if (dateStart) {
                     const startTimestamp = Timestamp.fromDate(new Date(dateStart + 'T00:00:00'));
                     q = query(q, where("timestamp", ">=", startTimestamp));
                }
                 if (dateEnd) {
                     const endTimestamp = Timestamp.fromDate(new Date(dateEnd + 'T23:59:59'));
                     q = query(q, where("timestamp", "<=", endTimestamp));
                }
                
                // ATENÇÃO: Queries complexas (range em um campo, == em outro) podem exigir
                // a criação de um índice no Firestore. Se der erro no console,
                // o Firebase fornecerá um link para criar o índice.
                
                // 4. Usar onSnapshot para dados em tempo real
                unsubscribeAdminListener = onSnapshot(q, (querySnapshot) => {
                    adminGridBody.innerHTML = ''; // Limpa a grid
                    if (querySnapshot.empty) {
                        adminNoData.classList.remove('hidden');
                    } else {
                         adminNoData.classList.add('hidden');
                         
                         // Ordena em memória por timestamp (mais recente primeiro)
                         const docs = querySnapshot.docs.sort((a, b) => b.data().timestamp.toMillis() - a.data().timestamp.toMillis());
                         
                         docs.forEach(doc => {
                            renderAdminRow(doc.id, doc.data());
                         });
                    }
                    adminLoader.classList.add('hidden');
                    globalLoader.classList.add('hidden'); // Esconde o loader global
                }, (error) => {
                    console.error("Erro ao buscar dados do admin:", error);
                    showNotification("Erro de Dados", `Não foi possível carregar os registros: ${error.message}`, true);
                    adminLoader.classList.add('hidden');
                    globalLoader.classList.add('hidden');
                });
                
            } catch (error) {
                 console.error("Erro ao montar query do admin:", error);
                 showNotification("Erro de Filtro", `Filtro inválido: ${error.message}`, true);
                 adminLoader.classList.add('hidden');
                 globalLoader.classList.add('hidden');
            }
        }
        
        /** Renderiza uma única linha na grid do admin */
        function renderAdminRow(docId, data) {
            const tr = document.createElement('tr');
            tr.dataset.id = docId; // Armazena o ID do documento na linha
            tr.className = data.status === 'gerado' ? 'bg-green-50' : 'bg-white';
            
            // Busca o nome da conta (usando os maps pré-carregados)
            const obra = obrasMap[data.obraId];
            const conta = obra ? contasMap[obra.id_conta] : null;
            const nomeConta = conta ? conta.nome_conta : (obra ? 'Conta não encontrada' : 'Obra não encontrada');

            // Formata data de previsão (que pode ser de PIX/Cheque ou 1º venc. Boleto)
            let dataPrevisao = data.dataPrevisaoPagamento ? formatDateBR(data.dataPrevisaoPagamento) : '';
            if (data.formaPagamento === 'boleto' && data.parcelas && data.parcelas.length > 0) {
                dataPrevisao = formatDateBR(data.parcelas[0].vencimento);
            }
            
            // Coluna de Anexo
            let anexoHtml = '';
            if (data.anexoUrl) {
                anexoHtml = `<a href="${data.anexoUrl}" target="_blank" class="text-blue-600 hover:text-blue-800" title="${data.anexoNome || 'Ver anexo'}">
                                <ion-icon name="document-attach-outline" class="h-5 w-5"></ion-icon>
                           </a>`;
            }

            // Define quais colunas são editáveis
            // 'data-field' mapeia para a chave no Firestore
            tr.innerHTML = `
                <td class="sticky left-0 z-[5] px-3 py-3 text-sm text-gray-500 ${tr.className}">
                    <input type="checkbox" class="row-checkbox h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" data-id="${docId}">
                </td>
                <td class="sticky left-10 z-[5] px-3 py-3 text-sm font-medium text-gray-900 ${tr.className}" contenteditable="true" data-field="titularNome" style="min-width: 200px;">${data.titularNome || ''}</td>
                <td class="px-3 py-3 text-sm text-gray-500" style="min-width: 150px;">${data.solicitanteNome || ''}</td>
                <td class="px-3 py-3 text-sm text-gray-500" contenteditable="true" data-field="valor" data-type="currency" style="min-width: 150px;">${(data.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="px-3 py-3 text-sm text-gray-500" contenteditable="true" data-field="formaPagamento" style="min-width: 150px;">${data.formaPagamento || ''}</td>
                <td class="px-3 py-3 text-sm text-gray-500" contenteditable="true" data-field="dataLancamento" data-type="date" style="min-width: 150px;">${formatDateBR(data.dataLancamento) || ''}</td>
                <td class="px-3 py-3 text-sm text-gray-500" contenteditable="true" data-field="dataCompetencia" data-type="date" style="min-width: 150px;">${formatDateBR(data.dataCompetencia) || ''}</td>
                <td class="px-3 py-3 text-sm text-gray-500" style="min-width: 150px;">${dataPrevisao}</td>
                <td class="px-3 py-3 text-sm text-gray-500" contenteditable="true" data-field="referente" style="min-width: 250px;">${data.referente || ''}</td>
                <td class="px-3 py-3 text-sm text-gray-500" contenteditable="true" data-field="pixChave" style="min-width: 150px;">${data.pixChave || ''}</td>
                <td class="px-3 py-3 text-sm text-gray-500" contenteditable="true" data-field="titularCpfCnpj" style="min-width: 150px;">${data.titularCpfCnpj || ''}</td>
                <td class="px-3 py-3 text-sm text-gray-500" contenteditable="true" data-field="obraNome" style="min-width: 150px;">${data.obraNome || ''}</td>
                <td class="px-3 py-3 text-sm text-gray-500" style="min-width: 150px;">${nomeConta}</td>
                <td class="px-3 py-3 text-sm text-gray-500" contenteditable="true" data-field="categoria" style="min-width: 100px;">${data.categoria || 'sem NF'}</td>
                <td class="px-3 py-3 text-sm text-gray-500" contenteditable="true" data-field="quemPaga" style="min-width: 100px;">${data.quemPaga || 'empresa'}</td>
                <td class="px-3 py-3 text-sm font-medium ${data.status === 'gerado' ? 'text-green-600' : 'text-yellow-600'}" style="min-width: 100px;">${data.status === 'gerado' ? 'Gerado' : 'Pendente'}</td>
                <td class="px-3 py-3 text-sm text-gray-500 text-center" style="min-width: 100px;">${anexoHtml}</td>
                <td class="px-3 py-3 text-sm text-gray-500" contenteditable="true" data-field="dataPagamentoReal" data-type="date" style="min-width: 100px;">${formatDateBR(data.dataPagamentoReal) || ''}</td>
                <td class="px-3 py-3 text-sm text-gray-500" contenteditable="true" data-field="indiceEtapaItem" style="min-width: 100px;">${data.indiceEtapaItem || ''}</td>
                <td class="px-3 py-3 text-sm text-gray-500" contenteditable="true" data-field="coluna20" style="min-width: 100px;">${data.coluna20 || ''}</td>
                <td class="px-3 py-3 text-sm text-gray-500" contenteditable="true" data-field="coluna21" style="min-width: 100px;">${data.coluna21 || ''}</td>
                <td class="px-3 py-3 text-sm text-gray-500" contenteditable="true" data-field="observacoes" style="min-width: 150px;">${data.observacoes || ''}</td>
                <td class="px-3 py-3 text-sm text-gray-500" style="min-width: 180px;">${formatTimestamp(data.timestamp)}</td>
            `;
            
            // Adiciona listener para marcar linha como 'editada'
            tr.querySelectorAll('[contenteditable="true"]').forEach(cell => {
                cell.addEventListener('input', () => {
                    tr.classList.add('edited'); // Marca a linha como editada
                    tr.classList.add('bg-yellow-50');
                });
            });
            
            adminGridBody.appendChild(tr);
        }
        
        // Botão Aplicar Filtros
        document.getElementById('apply-filters-button').addEventListener('click', () => {
             globalLoader.classList.remove('hidden');
             loadAdminData();
        });

        // Checkbox "Selecionar Todos"
        selectAllCheckbox.addEventListener('change', () => {
            const checkboxes = adminGridBody.querySelectorAll('.row-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = selectAllCheckbox.checked;
            });
        });
        
        // --- Ações do Admin: Salvar e Gerar CSV ---

        /** Salva as alterações feitas na grid */
        document.getElementById('save-changes-button').addEventListener('click', async () => {
            const editedRows = adminGridBody.querySelectorAll('tr.edited');
            if (editedRows.length === 0) {
                showNotification("Aviso", "Nenhuma alteração detectada para salvar.");
                return;
            }
            
            globalLoader.classList.remove('hidden');
            const batch = writeBatch(db);
            let updatesCount = 0;

            try {
                editedRows.forEach(row => {
                    const docId = row.dataset.id;
                    if (!docId) return;

                    const docRef = doc(db, `artifacts/${appId}/public/data/solicitacoes_pagamento`, docId);
                    const updateData = {};
                    
                    row.querySelectorAll('td[data-field]').forEach(cell => {
                        const field = cell.dataset.field;
                        const type = cell.dataset.type;
                        let value = cell.textContent.trim();
                        
                        // Converte os tipos de dados
                        if (type === 'currency') {
                            value = parseCurrency(value);
                        } else if (type === 'date') {
                            value = formatDateISO(value); // Converte DD/MM/AAAA para AAAA-MM-DD
                        }
                        
                        updateData[field] = value;
                    });
                    
                    batch.update(docRef, updateData);
                    updatesCount++;
                });

                await batch.commit();
                
                editedRows.forEach(row => {
                    row.classList.remove('edited', 'bg-yellow-50');
                });
                
                showNotification("Sucesso!", `${updatesCount} registros foram atualizados.`);
                
            } catch (error) {
                console.error("Erro ao salvar alterações:", error);
                showNotification("Erro ao Salvar", `Não foi possível atualizar: ${error.message}`, true);
            } finally {
                globalLoader.classList.add('hidden');
            }
        });
        
        /** Gera o CSV e atualiza o status */
        document.getElementById('generate-csv-button').addEventListener('click', async () => {
            const checkedBoxes = adminGridBody.querySelectorAll('.row-checkbox:checked');
            if (checkedBoxes.length === 0) {
                showNotification("Aviso", "Selecione pelo menos um registro para gerar o CSV.");
                return;
            }

            // 1. Salva alterações pendentes primeiro
            await document.getElementById('save-changes-button').click();
            globalLoader.classList.remove('hidden');
            
            const docIdsToExport = Array.from(checkedBoxes).map(cb => cb.dataset.id);
            let csvContent = [];
            
            // Cabeçalho do CSV (conforme colunas do admin)
            const headers = [
                "Timestamp", "Solicitante", "Data Lançamento", "Data Competência", "Valor", 
                "Titular", "Referente", "PIX", "Categoria", "Data para Pagamento", 
                "Quem Paga", "Conta", "Obra", "Indice Etapa Item", "Data de Pagamento", 
                "Forma de Pagamento", "Status", "CPF-CNPJ Titular", "Coluna 20", "Coluna 21", 
                "Anexo Link", "Observações"
            ];
            csvContent.push(headers.join(';'));
            
            const batch = writeBatch(db);

            try {
                // 2. Busca os dados atualizados para o CSV
                for (const docId of docIdsToExport) {
                    const docRef = doc(db, `artifacts/${appId}/public/data/solicitacoes_pagamento`, docId);
                    const docSnap = await getDoc(docRef);
                    
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        
                        // Busca dados relacionados
                        const obra = obrasMap[data.obraId];
                        const conta = obra ? contasMap[obra.id_conta] : null;
                        const nomeConta = conta ? conta.nome_conta : '';
                        
                        let dataPrevisao = data.dataPrevisaoPagamento ? formatDateBR(data.dataPrevisaoPagamento) : '';
                        if (data.formaPagamento === 'boleto' && data.parcelas && data.parcelas.length > 0) {
                            dataPrevisao = formatDateBR(data.parcelas[0].vencimento);
                        }
                        
                        // Função para escapar dados do CSV (caso tenham ;)
                        const escapeCSV = (str) => {
                           if (typeof str !== 'string') str = String(str || '');
                           if (str.includes(';') || str.includes('"') || str.includes('\n')) {
                               return `"${str.replace(/"/g, '""')}"`;
                           }
                           return str;
                        };

                        const row = [
                            formatTimestamp(data.timestamp),
                            data.solicitanteNome,
                            formatDateBR(data.dataLancamento),
                            formatDateBR(data.dataCompetencia),
                            (data.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', ''), // 1250,50
                            data.titularNome,
                            data.referente,
                            data.pixChave,
                            data.categoria,
                            dataPrevisao,
                            data.quemPaga,
                            nomeConta,
                            data.obraNome,
                            data.indiceEtapaItem,
                            formatDateBR(data.dataPagamentoReal),
                            data.formaPagamento,
                            "gerado", // Status será atualizado
                            data.titularCpfCnpj,
                            data.coluna20,
                            data.coluna21,
                            data.anexoUrl,
                            data.observacoes
                        ];
                        
                        csvContent.push(row.map(escapeCSV).join(';'));
                        
                        // 3. Adiciona a atualização de status ao batch
                        batch.update(docRef, { status: "gerado" });
                    }
                }

                // 4. Executa o batch (atualiza status no DB)
                await batch.commit();

                // 5. Gera e baixa o arquivo CSV
                const csvString = csvContent.join('\n');
                const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvString], { type: 'text/csv;charset=utf-8;' }); // BOM para UTF-8
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                
                const today = new Date().toISOString().split('T')[0];
                link.setAttribute('href', url);
                link.setAttribute('download', `pagamentos_${today}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showNotification("Sucesso!", `CSV gerado com ${docIdsToExport.length} registros e status atualizado.`);
                
                // O listener onSnapshot irá recarregar a grid automaticamente
                
            } catch (error) {
                console.error("Erro ao gerar CSV:", error);
                showNotification("Erro ao Gerar CSV", `Não foi possível gerar o arquivo: ${error.message}`, true);
            } finally {
                globalLoader.classList.add('hidden');
            }
        });

        // --- Inicialização da Aplicação ---
        
        // Chama a autenticação inicial ao carregar o script
        initialAuth();

    </script>

</body>
</html>
