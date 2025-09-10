/*
 * Skygotchimon - Funções da Interface do Usuário (UI)
 *
 * Este arquivo contém todas as funções para manipular os elementos da tela.
 * Ele gerencia a transição entre telas, a atualização das barras de status
 * e a manipulação dos elementos visuais do jogo.
 */

// Objeto para armazenar referências a todos os elementos do DOM
const ui = {
    // Telas
    screens: document.querySelectorAll('.screen'),
    telaOvo: document.getElementById('tela-ovo'),
    telaIncubadora: document.getElementById('tela-incubadora'),
    telaPerfilCriatura: document.getElementById('tela-perfil-criatura'),
    telaBebe: document.getElementById('tela-bebe'),
    telaCrianca: document.getElementById('tela-crianca'),
    telaAdulto: document.getElementById('tela-adulto'),
    telaMestre: document.getElementById('tela-mestre'),
    telaSupremo: document.getElementById('tela-supremo'),

    // Elementos da Tela do Ovo
    eggContainers: document.querySelectorAll('.egg-container'),
    confirmEggBtn: document.getElementById('confirm-egg-btn'),
    
    // Elementos da Tela da Incubadora
    eggImageIncubator: document.getElementById('egg-image-incubator'),
    progressBarIncubator: document.getElementById('incubator-progress-bar'),
    incubatorProgressFill: document.querySelector('#incubator-progress-bar div'),
    temperatureSlider: document.getElementById('temperature-slider'),
    humiditySlider: document.getElementById('humidity-slider'),
    lightSlider: document.getElementById('light-slider'),
    eggFeedback: document.getElementById('egg-feedback'),
};

/**
 * Alterna a visibilidade das telas.
 * @param {string} targetScreenId O ID da tela que será exibida.
 */
function showScreen(targetScreenId) {
    ui.screens.forEach(screen => {
        if (screen.id === targetScreenId) {
            screen.classList.add('active');
            screen.classList.remove('hidden');
        } else {
            screen.classList.remove('active');
            screen.classList.add('hidden');
        }
    });
}

/**
 * Habilita ou desabilita o botão de confirmação.
 * @param {boolean} enable - True para habilitar, False para desabilitar.
 */
function toggleConfirmButton(enable) {
    if (enable) {
        ui.confirmEggBtn.disabled = false;
        ui.confirmEggBtn.style.opacity = '1';
    } else {
        ui.confirmEggBtn.disabled = true;
        ui.confirmEggBtn.style.opacity = '0';
    }
}

/**
 * Remove a seleção de todos os ovos, exceto o selecionado.
 * @param {HTMLElement} selectedEgg - O elemento do ovo selecionado.
 */
function deselectEggs(selectedEgg) {
    ui.eggContainers.forEach(egg => {
        if (egg !== selectedEgg) {
            egg.classList.remove('selected');
        }
    });
}

/**
 * Altera a cor da barra de progresso da incubadora.
 * @param {boolean} isCorrect - Se as condições estão corretas.
 */
function updateProgressBarColor(isCorrect) {
    if (isCorrect) {
        ui.incubatorProgressFill.classList.remove('bg-red-500');
        ui.incubatorProgressFill.classList.add('bg-green-500');
    } else {
        ui.incubatorProgressFill.classList.remove('bg-green-500');
        ui.incubatorProgressFill.classList.add('bg-red-500');
    }
}

export { ui, showScreen, toggleConfirmButton, deselectEggs, updateProgressBarColor };
