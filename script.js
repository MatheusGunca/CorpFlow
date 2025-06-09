let blocks = [];
let connections = [];
let nextBlockId = 1;
let lastConnectableBlock = null;

// Simulação de variável de contexto do gerente
let isManager = false;

// Histórico de ações para desfazer/refazer
let undoStack = [];
let redoStack = [];
const MAX_HISTORY_SIZE = 10;

// Referências a elementos DOM
const flowArea = document.getElementById('flowArea');
const saveFlowButton = document.getElementById('saveFlowButton');
const messagesDiv = document.getElementById('messages');
const isManagerToggle = document.getElementById('isManagerToggle');
const connectionCanvas = document.getElementById('connectionCanvas');
const ctx = connectionCanvas.getContext('2d');
const flowTitleInput = document.getElementById('flowTitleInput');
const undoButton = document.getElementById('undoButton');
const redoButton = document.getElementById('redoButton');
const manageFlowsButton = document.getElementById('manageFlowsButton');
const closeModalButton = document.getElementById('closeModalButton');
const savedFlowsList = document.getElementById('savedFlowsList');
const clearAllFlowsButton = document.getElementById('clearAllFlowsButton');
const deleteLastBlockButton = document.getElementById('deleteLastBlockButton');

// Configuração Inicial e Event Listeners
function setupCanvas() {
    connectionCanvas.width = flowArea.clientWidth;
    connectionCanvas.height = flowArea.clientHeight;
    drawConnections();
}

// Event listener para redimensionamento do canvas
window.addEventListener('resize', setupCanvas);

// Event listener para arrastar bloco
document.querySelectorAll('.draggable-block').forEach(block => {
    block.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', e.target.dataset.blockType);
        e.dataTransfer.effectAllowed = 'copyMove';
    });
});

// Event listeners para à área de fluxo
flowArea.addEventListener('dragover', (e) => e.preventDefault());
flowArea.addEventListener('drop', (e) => {
    e.preventDefault();
    const blockType = e.dataTransfer.getData('text/plain');
    const rect = flowArea.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    addBlockToFlow(blockType, x, y);
    drawConnections();
});

// Event listeners para botões
saveFlowButton.addEventListener('click', saveFlow);
isManagerToggle.addEventListener('change', (e) => {
    isManager = e.target.checked;
    displayMessage('Status de Gerente: ' + (isManager ? 'Ativado' : 'Desativado'), 'info');
});
undoButton.addEventListener('click', undo);
redoButton.addEventListener('click', redo);
deleteLastBlockButton.addEventListener('click', deleteLastBlock);

// Event listeners para o gerenciamento de fluxos
manageFlowsButton.addEventListener('click', () => {
    manageFlowsModal.classList.remove('hidden');
    loadSavedFlowsList();
});
closeModalButton.addEventListener('click', () => manageFlowsModal.classList.add('hidden'));
window.addEventListener('click', (event) => {
    if (event.target === manageFlowsModal) {
        manageFlowsModal.classList.add('hidden');
    }
});
clearAllFlowsButton.addEventListener('click', clearAllSavedFlows);

// Funções de Histórico (Desfazer/Refazer)

//Salva o estado atual do fluxo no histórico de "desfazer".
function pushState() {
    const serializableBlocks = blocks.map(b => ({
        id: b.id,
        type: b.type,
        x: parseInt(b.element.style.left),
        y: parseInt(b.element.style.top),
        description: b.description || (b.type === 'task' ? '' : undefined)
    }));
    const state = {
        blocks: serializableBlocks,
        connections: [...connections],
        lastConnectableBlockId: lastConnectableBlock ? lastConnectableBlock.id : null,
        flowTitle: flowTitleInput.value
    };
    undoStack.push(state);
    if (undoStack.length > MAX_HISTORY_SIZE) {
        undoStack.shift();
    }
    redoStack = [];
    updateUndoRedoButtons();
    updateDeleteLastBlockButton();
}

//Restaura o estado do fluxo a partir de um objeto de estado salvo.
function restoreState(state) {
    blocks.forEach(b => b.element.remove());
    blocks = [];
    connections = [];
    lastConnectableBlock = null;

    state.blocks.forEach(bData => {
        const blockElement = createBlockElement(bData);
        setupBlockDragging(blockElement, bData.id);

        const restoredBlock = { ...bData, element: blockElement };
        blocks.push(restoredBlock);
        flowArea.appendChild(blockElement);
    });

    connections = state.connections;
    lastConnectableBlock = state.lastConnectableBlockId ? blocks.find(b => b.id === state.lastConnectableBlockId) : null;
    flowTitleInput.value = state.flowTitle || '';

    drawConnections();
    updateUndoRedoButtons();
    updateDeleteLastBlockButton();
}

function undo() {
    redoStack.push(undoStack.pop());
        restoreState(undoStack[undoStack.length - 1]);
        displayMessage('Ação desfeita.', 'info');
}

function redo() {
    undoStack.push(redoStack.pop());
        restoreState(undoStack[undoStack.length - 1]);
        displayMessage('Ação refeita.', 'info');
}

function updateUndoRedoButtons() {
    undoButton.disabled = undoStack.length <= 1;
    redoButton.disabled = redoStack.length === 0;
}

function updateDeleteLastBlockButton() {
    deleteLastBlockButton.disabled = blocks.length === 0;
}

//Cria o elemento DOM para um bloco.
function createBlockElement(bData) {
    const blockElement = document.createElement('div');
    blockElement.id = bData.id;
    blockElement.dataset.blockType = bData.type;
    blockElement.classList.add('flow-block', 'px-6', 'py-4', 'rounded-lg', 'shadow-md', 'text-white', 'font-semibold', 'text-center', 'z-10');

    let blockDisplayName = '';
    let bgColorClass = '';

    switch (bData.type) {
        case 'start':
            bgColorClass = 'bg-green-600';
            blockDisplayName = 'INÍCIO';
            blockElement.textContent = blockDisplayName;
            break;
        case 'task':
            bgColorClass = 'bg-indigo-500';
            blockDisplayName = 'FAZER TAREFA';
            const taskTextSpan = document.createElement('span');
            taskTextSpan.textContent = blockDisplayName;
            blockElement.appendChild(taskTextSpan);

            const descriptionInput = document.createElement('textarea');
            descriptionInput.placeholder = 'Descrição da tarefa...';
            descriptionInput.classList.add('w-full', 'p-2', 'mt-2', 'rounded-md', 'text-gray-800', 'bg-white', 'bg-opacity-80', 'text-sm');
            descriptionInput.style.minHeight = '50px';
            descriptionInput.value = bData.description || '';
            descriptionInput.addEventListener('input', (e) => {
                const blockInArray = blocks.find(b => b.id === bData.id);
                if (blockInArray) blockInArray.description = e.target.value;
                pushState();
            });
            blockElement.appendChild(descriptionInput);
            break;
        case 'verify':
            bgColorClass = 'bg-teal-500';
            blockDisplayName = 'VERIFICAR';
            blockElement.textContent = blockDisplayName;
            break;
        case 'approve':
            bgColorClass = 'bg-rose-500';
            blockDisplayName = 'APROVAR';
            blockElement.textContent = blockDisplayName;
            break;
        case 'end':
            bgColorClass = 'bg-gray-600';
            blockDisplayName = 'FIM';
            blockElement.textContent = blockDisplayName;
            break;
    }
    blockElement.classList.add(bgColorClass);
    blockElement.style.left = `${bData.x}px`;
    blockElement.style.top = `${bData.y}px`;
    return blockElement;
}


// Arrastar e soltar blocos
function setupBlockDragging(blockElement, blockId) {
    let isDragging = false;
    let offsetX, offsetY;

    blockElement.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'TEXTAREA') return;
        isDragging = true;
        offsetX = e.clientX - blockElement.getBoundingClientRect().left;
        offsetY = e.clientY - blockElement.getBoundingClientRect().top;
        blockElement.style.cursor = 'grabbing';
    });

    flowArea.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const rect = flowArea.getBoundingClientRect();
        let newX = e.clientX - rect.left - offsetX;
        let newY = e.clientY - rect.top - offsetY;

        // Restringe o movimento dentro da área de fluxo
        newX = Math.max(0, Math.min(newX, rect.width - blockElement.offsetWidth));
        newY = Math.max(0, Math.min(newY, rect.height - blockElement.offsetHeight));

        blockElement.style.left = `${newX}px`;
        blockElement.style.top = `${newY}px`;

        const blockInArray = blocks.find(b => b.id === blockId);
        if (blockInArray) {
            blockInArray.x = newX;
            blockInArray.y = newY;
        }
        drawConnections();
    });

    flowArea.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            blockElement.style.cursor = 'grab';
            drawConnections();
            pushState();
        }
    });
}

// Adiciona um bloco ao fluxo
function addBlockToFlow(type, x, y) {
    clearMessages();

    // Validações de adição de bloco
    const hasStartBlock = blocks.some(b => b.type === 'start');
    const hasEndBlock = blocks.some(b => b.type === 'end');

    if (!hasStartBlock && type !== 'start') {
        displayMessage('O primeiro bloco deve ser "INÍCIO".', 'error');
        return;
    }
    if (hasStartBlock && type === 'start') {
        displayMessage('Já existe um bloco "INÍCIO" no fluxo.', 'error');
        return;
    }
    if (hasEndBlock && type === 'end') {
        displayMessage('Já existe um bloco "FIM" no fluxo.', 'error');
        return;
    }

    if (lastConnectableBlock) {
        const lastBlockType = lastConnectableBlock.type;
        if (lastBlockType === 'end') {
            displayMessage('Nenhum bloco pode ser adicionado após o bloco "FIM".', 'error');
            return;
        }
        if (type === 'verify' && lastBlockType !== 'task') {
            displayMessage('Um bloco "VERIFICAR" só pode vir após "FAZER TAREFA".', 'error');
            return;
        }
        if (type === 'approve' && lastBlockType !== 'verify') {
            displayMessage('Um bloco "APROVAR" só pode vir após "VERIFICAR".', 'error');
            return;
        }
    } else if (type !== 'start' && blocks.length > 0) {
        displayMessage('Não é possível adicionar blocos sem um fluxo válido a partir de "INÍCIO".', 'error');
        return;
    }

    // Cria e adiciona o novo bloco
    const blockId = `block-${nextBlockId++}`;
    const newBlockData = { id: blockId, type: type, x: x, y: y };
    if (type === 'task') newBlockData.description = '';

    const blockElement = createBlockElement(newBlockData);
    setupBlockDragging(blockElement, blockId);

    const newBlock = { ...newBlockData, element: blockElement };
    blocks.push(newBlock);
    flowArea.appendChild(blockElement);

    
    if (lastConnectableBlock && type !== 'start') {
        connections.push({ sourceId: lastConnectableBlock.id, targetId: newBlock.id });
        displayMessage(`Bloco '${newBlock.element.textContent.split('\n')[0]}' adicionado e conectado.`, 'success');
    } else {
        displayMessage(`Bloco '${newBlock.element.textContent.split('\n')[0]}' adicionado.`, 'success');
    }

    lastConnectableBlock =  newBlock;

    pushState();
}


//Apaga o último bloco adicionado.
function deleteLastBlock() {
    clearMessages();

    const lastBlock = blocks.pop();
    lastBlock.element.remove();

    connections = connections.filter(conn => conn.sourceId !== lastBlock.id && conn.targetId !== lastBlock.id);

    lastConnectableBlock = null;
    for (let i = blocks.length - 1; i >= 0; i--) {
        if (blocks[i].type !== 'end') {
            lastConnectableBlock = blocks[i];
            break;
        }
    }

    displayMessage(`Bloco '${lastBlock.element.textContent.split('\n')[0]}' apagado com sucesso.`, 'info');
    drawConnections();
    pushState();
}


// Desenho das Conexões
function drawConnections() {
    ctx.clearRect(0, 0, connectionCanvas.width, connectionCanvas.height);
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    connections.forEach(conn => {
        const sourceBlock = blocks.find(b => b.id === conn.sourceId);
        const targetBlock = blocks.find(b => b.id === conn.targetId);

        if (sourceBlock && targetBlock) {
            const sourceRect = sourceBlock.element.getBoundingClientRect();
            const targetRect = targetBlock.element.getBoundingClientRect();
            const flowRect = flowArea.getBoundingClientRect();

            const sourceX = sourceRect.left + sourceRect.width / 2 - flowRect.left;
            const sourceY = sourceRect.top + sourceRect.height / 2 - flowRect.top;
            const targetX = targetRect.left + targetRect.width / 2 - flowRect.left;
            const targetY = targetRect.top + targetRect.height / 2 - flowRect.top;

            ctx.beginPath();
            ctx.moveTo(sourceX, sourceY);
            ctx.lineTo(targetX, targetY);
            ctx.stroke();
        }
    });
}

// Validar e salvar fluxo
function saveFlow() {
    clearMessages();
    let flowErrors = [];

    const currentFlowTitle = flowTitleInput.value.trim();
    if (!currentFlowTitle) {
        flowErrors.push('Por favor, insira um título para o fluxo antes de salvar.');
    }

    const startBlock = blocks.find(b => b.type === 'start');
    const endBlock = blocks.find(b => b.type === 'end');

    // Validações estruturais básicas
    if (!startBlock) {
        flowErrors.push('O fluxo deve começar com um bloco "INÍCIO".');
    }
    if (!endBlock) {
        flowErrors.push('O fluxo deve terminar com um bloco "FIM".');
    }

    // Validação de contexto: Somente gerentes podem aprovar
    const approveBlocks = blocks.filter(b => b.type === 'approve');
    if (approveBlocks.length > 0 && !isManager) {
        flowErrors.push('Erro de Contexto: Somente gerentes podem incluir blocos "APROVAR".');
    }

    if (flowErrors.length > 0) {
        displayMessage('Erros no fluxo:', 'error');
        flowErrors.forEach(err => displayMessage(`- ${err}`, 'error'));
    } else {
        displayMessage('Fluxo validado com sucesso! Salvando no armazenamento local...', 'success');
        saveFlowToLocalStorage(currentFlowTitle);
    }
}

// Exibe uma mensagem ao usuário.
function displayMessage(message, type) {
    const classMap = {
        success: ['bg-green-100', 'text-green-700', 'border-green-200'],
        error: ['bg-red-100', 'text-red-700', 'border-red-200'],
        info: ['bg-blue-100', 'text-blue-700', 'border-blue-200']
    };

    messagesDiv.classList.remove(...Object.values(classMap).flat(), 'hidden');
    messagesDiv.classList.add(...classMap[type]);

    const p = document.createElement('p');
    p.textContent = message;
    messagesDiv.appendChild(p);
}

//Limpa todas as mensagens.
function clearMessages() {
    messagesDiv.innerHTML = '';
    messagesDiv.classList.add('hidden');
}


// Funções de Gerenciamento de Fluxos (localStorage)

const LOCAL_STORAGE_KEY = 'corpFlow_saved_flows';

//Salva o fluxo atual no localStorage.
function saveFlowToLocalStorage(title) {
    try {
        let savedFlows = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        const currentFlowData = {
            title: title,
            blocks: blocks.map(b => ({
                id: b.id,
                type: b.type,
                x: parseInt(b.element.style.left),
                y: parseInt(b.element.style.top),
                description: b.description || (b.type === 'task' ? '' : undefined)
            })),
            connections: connections
        };

        const existingIndex = savedFlows.findIndex(flow => flow.title === title);
        if (existingIndex !== -1) {
            savedFlows[existingIndex] = currentFlowData;
            displayMessage(`Fluxo '${title}' atualizado com sucesso.`, 'success');
        } else {
            savedFlows.push(currentFlowData);
            displayMessage(`Fluxo '${title}' salvo com sucesso.`, 'success');
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedFlows));
    } catch (e) {
        displayMessage('Erro ao salvar fluxo: ' + e.message, 'error');
        console.error('Erro ao salvar fluxo no localStorage:', e);
    }
}

//Carrega e exibe a lista de fluxos salvos no modal.
function loadSavedFlowsList() {
    savedFlowsList.innerHTML = '';
    try {
        const savedFlows = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');

        if (savedFlows.length === 0) {
            savedFlowsList.innerHTML = '<p class="text-gray-600 text-center py-4">Nenhum fluxo salvo ainda.</p>';
            return;
        }

        savedFlows.forEach(flow => {
            const flowItem = document.createElement('div');
            flowItem.classList.add('flex', 'justify-between', 'items-center', 'p-3', 'mb-2', 'bg-gray-50', 'rounded-md', 'shadow-sm');
            flowItem.innerHTML = `
                <span class="font-medium text-gray-800">${flow.title}</span>
                <div>
                    <button class="load-flow-btn py-1 px-3 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md mr-2" data-flow-title="${flow.title}">Carregar</button>
                    <button class="delete-flow-btn py-1 px-3 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md" data-flow-title="${flow.title}">Excluir</button>
                </div>
            `;
            savedFlowsList.appendChild(flowItem);
        });

        document.querySelectorAll('.load-flow-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                loadFlow(e.target.dataset.flowTitle);
                manageFlowsModal.classList.add('hidden');
            });
        });

        document.querySelectorAll('.delete-flow-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                deleteFlow(e.target.dataset.flowTitle);
            });
        });

    } catch (e) {
        savedFlowsList.innerHTML = '<p class="text-red-600 text-center py-4">Erro ao carregar fluxos: ' + e.message + '</p>';
        console.error('Erro ao carregar fluxos do localStorage:', e);
    }
}

// Carrega um fluxo específico do localStorage.
function loadFlow(title) {
    try {
        const savedFlows = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        const flowToLoad = savedFlows.find(flow => flow.title === title);

        if (flowToLoad) {
            undoStack = [];
            redoStack = [];
            restoreState(flowToLoad);
            flowTitleInput.value = title || '';
            displayMessage(`Fluxo '${title}' carregado com sucesso!`, 'success');
        } else {
            displayMessage(`Fluxo '${title}' não encontrado.`, 'error');
        }
    } catch (e) {
        displayMessage('Erro ao carregar fluxo: ' + e.message, 'error');
        console.error('Erro ao carregar fluxo do localStorage:', e);
    }
}

// Exclui um fluxo específico do localStorage.
function deleteFlow(title) {
    try {
        let savedFlows = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        const updatedFlows = savedFlows.filter(flow => flow.title !== title);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedFlows));
        displayMessage(`Fluxo '${title}' excluído com sucesso.`, 'success');
        loadSavedFlowsList();
    } catch (e) {
        displayMessage('Erro ao excluir fluxo: ' + e.message, 'error');
        console.error('Erro ao excluir fluxo do localStorage:', e);
    }
}

// Limpa todos os fluxos salvos do localStorage.
function clearAllSavedFlows() {
    if (confirm('Tem certeza que deseja apagar TODOS os fluxos salvos? Esta ação não pode ser desfeita.')) {
        try {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            displayMessage('Todos os fluxos salvos foram apagados.', 'success');
            loadSavedFlowsList();
        } catch (e) {
            displayMessage('Erro ao limpar todos os fluxos: ' + e.message, 'error');
            console.error('Erro ao limpar todos os fluxos do localStorage:', e);
        }
    }
}

// Configura o canvas e o estado inicial ao carregar a página
window.onload = () => {
    setupCanvas();
    pushState(); // Salva o estado inicial vazio
    updateDeleteLastBlockButton(); // Atualiza o estado do botão ao carregar
};
