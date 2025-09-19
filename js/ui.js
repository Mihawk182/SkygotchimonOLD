// Mostrar/ocultar placeholder de construção ao lado da casa (toggle, corrigido para classe do botão)
// Consolidated DOM ready setup: menu and build toggle
document.addEventListener('DOMContentLoaded', function () {
    // FAB menu
    const fabMenu = document.querySelector('.fab-menu');
    if (fabMenu) {
        const fabToggle = fabMenu.querySelector('.fab-toggle');
        const fabActions = fabMenu.querySelector('.fab-actions');
        if (fabToggle && fabActions) {
            fabToggle.addEventListener('click', function (e) {
                e.stopPropagation();
                if (fabActions.style.display === 'none' || fabActions.style.display === '') {
                    fabActions.style.display = 'flex';
                } else {
                    fabActions.style.display = 'none';
                }
            });
        }
        document.addEventListener('click', function (e) {
            if (!fabMenu.contains(e.target)) {
                const fa = fabMenu.querySelector('.fab-actions');
                if (fa) fa.style.display = 'none';
            }
        });
    }

    // Build placeholder toggle + build menu handling
    const buildBtn = document.querySelector('.fab-actions #build-mode-btn');
    const buildPlaceholder = document.getElementById('build-placeholder');
    const buildMenu = document.getElementById('build-menu');
    const buildModal = document.getElementById('build-modal');
    if (buildBtn && buildPlaceholder) {
        let buildVisible = false;
        // Update the placeholder position so it appears to the right of the
        // rightmost constructed building (or the casa if none exist).
        function updateBuildPlaceholderPosition() {
            const casa = document.getElementById('casa-div');
            if (!casa) return;
            const casaParent = casa.parentElement;
            const parentRect = casaParent.getBoundingClientRect();
            const gap = 10;

            // Find existing constructions and pick the rightmost one
            const existing = Array.from(casaParent.querySelectorAll('.constructed-building'));
            let anchorRect;
            if (existing.length > 0) {
                // rightmost = one with largest (left + width)
                let rightmost = existing.reduce((acc, el) => {
                    const r = el.getBoundingClientRect();
                    const right = r.left + r.width;
                    const accRight = acc.getBoundingClientRect().left + acc.getBoundingClientRect().width;
                    return right > accRight ? el : acc;
                }, existing[0]);
                anchorRect = rightmost.getBoundingClientRect();
            } else {
                anchorRect = casa.getBoundingClientRect();
            }

            // Compute left and top relative to parent
            const left = (anchorRect.left - parentRect.left) + anchorRect.width + gap;
            const top = anchorRect.top - parentRect.top;

            buildPlaceholder.style.left = left + 'px';
            buildPlaceholder.style.top = top + 'px';
            // clear any translateY that was inlined in HTML and make absolute positioning explicit
            buildPlaceholder.style.transform = 'none';
        }
        // Toggle placeholder when clicking Construir
        buildBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            buildVisible = !buildVisible;
            if (buildVisible) {
                // position placeholder next to the rightmost constructed building
                updateBuildPlaceholderPosition();
                buildPlaceholder.classList.remove('js-hidden');
                buildPlaceholder.style.display = 'flex';
                // ensure menu is hidden initially
                if (buildMenu) {
                    buildMenu.classList.add('js-hidden');
                    buildMenu.style.display = 'none';
                }
            } else {
                buildPlaceholder.classList.add('js-hidden');
                buildPlaceholder.style.display = 'none';
                if (buildMenu) {
                    buildMenu.classList.add('js-hidden');
                    buildMenu.style.display = 'none';
                }
            }
            // close actions menu when toggling
            const fa = document.querySelector('.fab-actions');
            if (fa) fa.style.display = 'none';
        });

        // Clicking the placeholder opens the centered build modal
        buildPlaceholder.addEventListener('click', function (e) {
            e.stopPropagation();
            if (!buildModal) return;
            buildModal.classList.remove('js-hidden');
            buildModal.style.display = 'flex';
            // ensure inline buildMenu is hidden
            if (buildMenu) {
                buildMenu.classList.add('js-hidden');
                buildMenu.style.display = 'none';
            }
        });

        // Wire option clicks (Energia/Comida/Água)
        // Helper to actually create the construction (shared by inline menu and modal)
        function createConstruction(type) {
            const casa = document.getElementById('casa-div');
            const casaParent = casa.parentElement;
            const parentRect = casaParent.getBoundingClientRect();
            const casaRect = casa.getBoundingClientRect();
            const gap = 10; // px gap between casa and each built element

            const builtEl = document.createElement('div');
            builtEl.classList.add('constructed-building');
            builtEl.setAttribute('data-type', type);
            const label = document.createElement('div');
            label.classList.add('label');
            label.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            builtEl.appendChild(label);

            // set class based on type and size
            if (type === 'elevador' || type.toLowerCase().includes('elevador')) {
                builtEl.classList.add('building-elevador');
                // special size for elevator
                builtEl.style.width = 75 + 'px';
                builtEl.style.height = 150 + 'px';
            } else if (type === 'energia' || type.toLowerCase().includes('energia')) {
                builtEl.classList.add('building-energia');
                // size to match casa
                builtEl.style.width = casaRect.width + 'px';
                builtEl.style.height = casaRect.height + 'px';
            } else if (type === 'comida' || type.toLowerCase().includes('comida')) {
                builtEl.classList.add('building-comida');
                builtEl.style.width = casaRect.width + 'px';
                builtEl.style.height = casaRect.height + 'px';
            } else {
                builtEl.classList.add('building-agua');
                builtEl.style.width = casaRect.width + 'px';
                builtEl.style.height = casaRect.height + 'px';
            }
            builtEl.style.position = 'absolute';

            // determine placement index (how many constructions already exist)
            const existing = casaParent.querySelectorAll('.constructed-building');
            const index = existing.length; // 0-based
            // Use anchor width for spacing: if previous building has different width, account for it
            let baseWidth = casaRect.width;
            if (existing.length > 0) {
                const last = existing[existing.length - 1];
                const lastRect = last.getBoundingClientRect();
                baseWidth = lastRect.width;
            }
            const left = (casaRect.left - parentRect.left) + casaRect.width + gap + index * (baseWidth + gap);
            const top = casaRect.top - parentRect.top;
            builtEl.style.left = left + 'px';
            builtEl.style.top = top + 'px';

            // append to parent
            casaParent.appendChild(builtEl);

            // ensure it's visible and remove placeholder/menu/modal
            builtEl.style.display = 'flex';
            if (buildMenu) {
                buildMenu.classList.add('js-hidden');
                buildMenu.style.display = 'none';
            }
            buildPlaceholder.classList.add('js-hidden');
            buildPlaceholder.style.display = 'none';
            if (buildModal) {
                buildModal.classList.add('js-hidden');
                buildModal.style.display = 'none';
            }
            buildVisible = false;
        }

        // Wire option clicks for inline buildMenu (if still used)
        if (buildMenu) {
            const options = buildMenu.querySelectorAll('.build-option');
            options.forEach(opt => {
                opt.addEventListener('click', function (ev) {
                    ev.stopPropagation();
                    const type = opt.getAttribute('data-type') || opt.textContent.trim().toLowerCase();
                    createConstruction(type);
                });
            });
        }

        // Wire option clicks in the centered modal
        if (buildModal) {
            const modalOptions = buildModal.querySelectorAll('.build-option');
            modalOptions.forEach(opt => {
                opt.addEventListener('click', function (ev) {
                    ev.stopPropagation();
                    const type = opt.getAttribute('data-type') || opt.textContent.trim().toLowerCase();
                    createConstruction(type);
                });
            });

            // close modal when clicking on overlay
            buildModal.addEventListener('click', function (ev) {
                if (ev.target === buildModal) {
                    buildModal.classList.add('js-hidden');
                    buildModal.style.display = 'none';
                }
            });
        }

        // Hide placeholder and menu on outside click
        document.addEventListener('click', function (e) {
            if (buildVisible && !buildBtn.contains(e.target) && !buildPlaceholder.contains(e.target) && !(buildMenu && buildMenu.contains(e.target))) {
                buildPlaceholder.classList.add('js-hidden');
                buildPlaceholder.style.display = 'none';
                if (buildMenu) {
                    buildMenu.classList.add('js-hidden');
                    buildMenu.style.display = 'none';
                }
                buildVisible = false;
            }
        });
    }
});

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
    telaMenu: document.getElementById('tela-menu'),
    telaOvo: document.getElementById('tela-ovo'),
    telaIncubadora: document.getElementById('tela-incubadora'),
    telaCuidados: document.getElementById('tela-cuidados'),
    telaCastelo: document.getElementById('tela-castelo'),
    
    // Elementos do Menu Principal
    newGameBtn: document.getElementById('new-game-btn'),
    loadGameBtn: document.getElementById('load-game-btn'),
    optionsBtn: document.getElementById('options-btn'),
    exitBtn: document.getElementById('exit-btn'),

    // Elementos da Tela do Ovo
    eggContainers: document.querySelectorAll('.egg-container'),
    
    // Elementos da Tela da Incubadora
    eggImageIncubator: document.getElementById('egg-image-incubator'),
    progressBarIncubator: document.getElementById('incubator-progress-bar'),
    incubatorProgressFill: document.querySelector('#incubator-progress-bar div'),
    temperatureSlider: document.getElementById('temperature-slider'),
    humiditySlider: document.getElementById('humidity-slider'),
    lightSlider: document.getElementById('light-slider'),
    eggFeedback: document.getElementById('egg-feedback'),

    // Elementos da Tela de Cuidados
    creatureDisplay: document.getElementById('creature-display'),
    creatureName: document.getElementById('creature-name'),
    creatureImage: document.getElementById('creature-image'),
    
    // Barras de Status
    growthBar: document.getElementById('growth-bar'),
    hungerBar: document.getElementById('hunger-bar'),
    happinessBar: document.getElementById('happiness-bar'),
    cleanlinessBar: document.getElementById('cleanliness-bar'),
    healthBar: document.getElementById('health-bar'),
    strengthBarContainer: document.getElementById('strength-bar-container'),
    strengthBar: document.getElementById('strength-bar'),
    intelligenceBarContainer: document.getElementById('intelligence-bar-container'),
    intelligenceBar: document.getElementById('intelligence-bar'),
    
    // Botões de Ação
    feedBtn: document.getElementById('feed-btn'),
    playBtn: document.getElementById('play-btn'),
    cleanBtn: document.getElementById('clean-btn'),
    sleepBtn: document.getElementById('sleep-btn'),
    studyBtn: document.getElementById('study-btn'),
    trainBtn: document.getElementById('train-btn'),

    // Elementos de Debug
    debugToggleBtn: document.getElementById('debug-toggle-btn'),
    debugPanel: document.getElementById('debug-panel'),
    debugHungerSlider: document.getElementById('debug-hunger-slider'),
    debugHappinessSlider: document.getElementById('debug-happiness-slider'),
    debugCleanlinessSlider: document.getElementById('debug-cleanliness-slider'),
    debugHealthSlider: document.getElementById('debug-health-slider'),

    // Elementos do Pop-up de Informações do Ovo
    eggInfoPopup: document.getElementById('egg-info-popup'),
    popupEggImage: document.getElementById('popup-egg-image'),
    popupEggTitle: document.getElementById('popup-egg-title'),
    popupEggDescription: document.getElementById('popup-egg-description'),
    popupContinueBtn: document.getElementById('popup-continue-btn'),
    popupBackBtn: document.getElementById('popup-back-btn'),

    // Elementos da Tela Castelo
    casaDiv: document.getElementById('casa-div'),
    buildModeBtn: document.getElementById('build-mode-btn'),
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

export { ui, showScreen, deselectEggs, updateProgressBarColor };