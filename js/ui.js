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
        let currentAnchor = null; // if set, constructions will use this anchor (floor)
        const floorPlaceholders = new Map(); // key: topPx (rounded), value: element
        const buildPlaceholderUp = document.getElementById('build-placeholder-up');
        const buildPlaceholderDown = document.getElementById('build-placeholder-down');
        const fabToggleBtn = document.querySelector('.fab-menu .fab-toggle');

        function setBuildIndicator(active) {
            if (!fabToggleBtn) return;
            if (active) fabToggleBtn.classList.add('fab-active');
            else fabToggleBtn.classList.remove('fab-active');
        }
        // Update the placeholder position so it appears to the right of the
        // rightmost constructed building (or the casa if none exist).
        // Helper: find rightmost constructed building that sits on the same
        // vertical baseline as the casa (so stacked elevators above/below
        // don't affect horizontal sequencing).
        function getBaselineRightmost(casaParent, casaRect) {
            const all = Array.from(casaParent.querySelectorAll('.constructed-building'));
            if (!all.length) return null;
            const row = all.filter(el => {
                const r = el.getBoundingClientRect();
                return Math.abs(r.top - casaRect.top) < 4; // allow small tolerance
            });
            if (row.length === 0) return null;
            return row.reduce((acc, el) => {
                const r = el.getBoundingClientRect();
                const right = r.left + r.width;
                const accR = acc.getBoundingClientRect().left + acc.getBoundingClientRect().width;
                return right > accR ? el : acc;
            }, row[0]);
        }
        function updateBuildPlaceholderPosition() {
            const casa = document.getElementById('casa-div');
            if (!casa) return;
            const casaParent = casa.parentElement;
            const parentRect = casaParent.getBoundingClientRect();
            const gap = 10;
            // Find rightmost element on the casa baseline (same top). If none,
            // fall back to casa itself.
            const casaRect = casa.getBoundingClientRect();
            const baselineRightmost = getBaselineRightmost(casaParent, casaRect);
            const anchorRect = (baselineRightmost ? baselineRightmost.getBoundingClientRect() : casaRect);

            // Compute left and top relative to parent
            const left = (anchorRect.left - parentRect.left) + anchorRect.width + gap;
            const top = anchorRect.top - parentRect.top;

            buildPlaceholder.style.left = left + 'px';
            buildPlaceholder.style.top = top + 'px';
            // clear any translateY that was inlined in HTML and make absolute positioning explicit
            buildPlaceholder.style.transform = 'none';
            // hide elevator-specific placeholders by default
            if (buildPlaceholderUp) {
                buildPlaceholderUp.classList.add('js-hidden');
                buildPlaceholderUp.style.display = 'none';
            }
            if (buildPlaceholderDown) {
                buildPlaceholderDown.classList.add('js-hidden');
                buildPlaceholderDown.style.display = 'none';
            }
            // update any floor placeholders as well
            updateFloorPlaceholders();
        }

        // Create or update horizontal placeholders for every elevator floor.
        // One placeholder appears to the right of each elevator (by floor/top).
        function updateFloorPlaceholders() {
            const casa = document.getElementById('casa-div');
            if (!casa) return;
            const casaParent = casa.parentElement;
            const parentRect = casaParent.getBoundingClientRect();
            const gap = 10;

            // find all elevator elements
            const elevators = Array.from(casaParent.querySelectorAll('.constructed-building.building-elevador'));
            // group by floor (top coordinate rounded)
            const byTop = new Map();
            elevators.forEach(el => {
                const r = el.getBoundingClientRect();
                const topKey = Math.round(r.top);
                if (!byTop.has(topKey)) byTop.set(topKey, []);
                byTop.get(topKey).push(el);
            });

            // Mark existing keys to keep
            const keepKeys = new Set();
            byTop.forEach((els, topKey) => {
                // choose rightmost elevator on this floor for anchor
                const anchor = els.reduce((acc, el) => {
                    const r = el.getBoundingClientRect();
                    const right = r.left + r.width;
                    const accR = acc.getBoundingClientRect().left + acc.getBoundingClientRect().width;
                    return right > accR ? el : acc;
                }, els[0]);

                keepKeys.add(topKey);
                let ph = floorPlaceholders.get(topKey);
                const anchorRect = anchor.getBoundingClientRect();
                const left = anchorRect.left - parentRect.left + anchorRect.width + gap;
                const top = anchorRect.top - parentRect.top;

                if (!ph) {
                    ph = document.createElement('div');
                    ph.classList.add('js-hidden', 'build-placeholder', 'floor-placeholder');
                    ph.style.position = 'absolute';
                    ph.style.width = anchorRect.width + 'px';
                    ph.style.height = anchorRect.height + 'px';
                    ph.style.border = '2px dashed #f97316';
                    ph.style.background = 'rgba(249,115,22,0.06)';
                    ph.style.zIndex = '10';
                    ph.style.fontSize = '2.5rem';
                    ph.style.color = '#f97316';
                    ph.style.fontWeight = 'bold';
                    ph.style.display = 'flex';
                    ph.style.alignItems = 'center';
                    ph.style.justifyContent = 'center';
                    ph.textContent = '+';
                    casaParent.appendChild(ph);
                    // click handler: set current anchor to this floor's anchor and open modal
                    ph.addEventListener('click', function (ev) {
                        ev.stopPropagation();
                        currentAnchor = anchor;
                        if (buildModal) {
                            buildModal.classList.remove('js-hidden');
                            buildModal.style.display = 'flex';
                        }
                        // keep other menus hidden
                        if (buildMenu) {
                            buildMenu.classList.add('js-hidden');
                            buildMenu.style.display = 'none';
                        }
                    });
                    floorPlaceholders.set(topKey, ph);
                }

                // size/position (use anchor size to match elevator width/height)
                ph.style.left = left + 'px';
                ph.style.top = top + 'px';
                ph.style.width = anchorRect.width + 'px';
                ph.style.height = anchorRect.height + 'px';
                ph.classList.remove('js-hidden');
                ph.style.display = 'flex';
            });

            // remove placeholders for floors that no longer exist
            Array.from(floorPlaceholders.keys()).forEach(key => {
                if (!keepKeys.has(key)) {
                    const el = floorPlaceholders.get(key);
                    if (el && el.parentElement) el.parentElement.removeChild(el);
                    floorPlaceholders.delete(key);
                }
            });
        }
        // Toggle placeholder when clicking Construir
        buildBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            buildVisible = !buildVisible;
            if (buildVisible) {
                // position placeholder next to the rightmost constructed building
                updateBuildPlaceholderPosition();
                // create/update floor placeholders for any existing elevators
                updateFloorPlaceholders();
                buildPlaceholder.classList.remove('js-hidden');
                buildPlaceholder.style.display = 'flex';
                // If the rightmost constructed building on the baseline is an elevator,
                // show the up/down placeholders immediately
                const casa = document.getElementById('casa-div');
                const casaParent = casa.parentElement;
                const casaRect = casa.getBoundingClientRect();
                const baselineRightmostNow = getBaselineRightmost(casaParent, casaRect);
                if (baselineRightmostNow && baselineRightmostNow.classList.contains('building-elevador') && buildPlaceholderUp && buildPlaceholderDown) {
                    updateElevatorPlaceholders(baselineRightmostNow);
                    buildPlaceholderUp.classList.remove('js-hidden');
                    buildPlaceholderUp.style.display = 'flex';
                    buildPlaceholderDown.classList.remove('js-hidden');
                    buildPlaceholderDown.style.display = 'flex';
                }
                // ensure menu is hidden initially
                if (buildMenu) {
                    buildMenu.classList.add('js-hidden');
                    buildMenu.style.display = 'none';
                }
                setBuildIndicator(true);
            } else {
                buildPlaceholder.classList.add('js-hidden');
                buildPlaceholder.style.display = 'none';
                if (buildPlaceholderUp) {
                    buildPlaceholderUp.classList.add('js-hidden');
                    buildPlaceholderUp.style.display = 'none';
                }
                if (buildPlaceholderDown) {
                    buildPlaceholderDown.classList.add('js-hidden');
                    buildPlaceholderDown.style.display = 'none';
                }
                // hide and remove all floor placeholders
                Array.from(floorPlaceholders.values()).forEach(ph => {
                    if (ph && ph.parentElement) ph.parentElement.removeChild(ph);
                });
                floorPlaceholders.clear();
                if (buildMenu) {
                    buildMenu.classList.add('js-hidden');
                    buildMenu.style.display = 'none';
                }
                setBuildIndicator(false);
            }
            // close actions menu when toggling
            const fa = document.querySelector('.fab-actions');
            if (fa) fa.style.display = 'none';
        });

        // Clicking the placeholder opens the centered build modal
        buildPlaceholder.addEventListener('click', function (e) {
            e.stopPropagation();
            if (!buildModal) return;
            // If the baseline rightmost anchor is an elevator, show up/down placeholders
            // as well as the modal so the player can either stack elevators or build
            // horizontally to the right of the baseline.
            const casa = document.getElementById('casa-div');
            const casaParent = casa.parentElement;
            const casaRect = casa.getBoundingClientRect();
            const baselineRightmostOnClick = getBaselineRightmost(casaParent, casaRect);
            const isElevatorAnchor = baselineRightmostOnClick && baselineRightmostOnClick.classList.contains('building-elevador');
            if (isElevatorAnchor && buildPlaceholderUp && buildPlaceholderDown) {
                // position up and down placeholders centered on the elevator
                updateElevatorPlaceholders(baselineRightmostOnClick);
                buildPlaceholderUp.classList.remove('js-hidden');
                buildPlaceholderUp.style.display = 'flex';
                buildPlaceholderDown.classList.remove('js-hidden');
                buildPlaceholderDown.style.display = 'flex';
            }
            // Always show modal so user can build to the right of the baseline
            buildModal.classList.remove('js-hidden');
            buildModal.style.display = 'flex';
            if (buildMenu) {
                buildMenu.classList.add('js-hidden');
                buildMenu.style.display = 'none';
            }
        });

        // Position elevator up/down placeholders relative to an anchor elevator element
        function updateElevatorPlaceholders(anchorEl) {
            if (!anchorEl) return;
            const parent = anchorEl.parentElement;
            const parentRect = parent.getBoundingClientRect();
            const anchorRect = anchorEl.getBoundingClientRect();
            const width = anchorRect.width;
            const height = anchorRect.height;
            const gap = 6;

            // Up placeholder: same left as anchor, top = anchor.top - height - gap
            const upLeft = anchorRect.left - parentRect.left;
            const upTop = anchorRect.top - parentRect.top - height - gap;
            buildPlaceholderUp.style.left = upLeft + 'px';
            buildPlaceholderUp.style.top = upTop + 'px';
            buildPlaceholderUp.style.transform = 'none';

            // Down placeholder: same left, top = anchor.top + height + gap
            const downLeft = upLeft;
            const downTop = anchorRect.top - parentRect.top + height + gap;
            buildPlaceholderDown.style.left = downLeft + 'px';
            buildPlaceholderDown.style.top = downTop + 'px';
            buildPlaceholderDown.style.transform = 'none';
        }

        // Create a new elevator stacked above or below an existing elevator
        function createStackedElevator(anchorEl, direction) {
            if (!anchorEl) return;
            const casa = document.getElementById('casa-div');
            const parent = casa.parentElement;
            const parentRect = parent.getBoundingClientRect();
            const anchorRect = anchorEl.getBoundingClientRect();
            const width = 75; const height = 150; const gap = 6;

            const builtEl = document.createElement('div');
            builtEl.classList.add('constructed-building', 'building-elevador');
            builtEl.setAttribute('data-type', 'elevador');
            const label = document.createElement('div');
            label.classList.add('label');
            label.textContent = 'Elevador';
            builtEl.appendChild(label);

            builtEl.style.width = width + 'px';
            builtEl.style.height = height + 'px';
            builtEl.style.position = 'absolute';

            // same left as anchor
            const left = anchorRect.left - parentRect.left;
            let top;
            if (direction === 'up') {
                top = anchorRect.top - parentRect.top - height - gap;
            } else {
                top = anchorRect.top - parentRect.top + anchorRect.height + gap;
            }
            builtEl.style.left = left + 'px';
            builtEl.style.top = top + 'px';

            parent.appendChild(builtEl);

            // After stacking an elevator, keep build mode active and recompute placeholders
            updateBuildPlaceholderPosition();
            // If baseline rightmost is elevator, show up/down placeholders
            const casaRect = casa.getBoundingClientRect();
            const baselineRightmost = getBaselineRightmost(parent, casaRect);
            if (baselineRightmost && baselineRightmost.classList.contains('building-elevador') && buildPlaceholderUp && buildPlaceholderDown) {
                updateElevatorPlaceholders(baselineRightmost);
                buildPlaceholderUp.classList.remove('js-hidden');
                buildPlaceholderUp.style.display = 'flex';
                buildPlaceholderDown.classList.remove('js-hidden');
                buildPlaceholderDown.style.display = 'flex';
            } else {
                if (buildPlaceholderUp) {
                    buildPlaceholderUp.classList.add('js-hidden');
                    buildPlaceholderUp.style.display = 'none';
                }
                if (buildPlaceholderDown) {
                    buildPlaceholderDown.classList.add('js-hidden');
                    buildPlaceholderDown.style.display = 'none';
                }
                buildPlaceholder.classList.remove('js-hidden');
                buildPlaceholder.style.display = 'flex';
            }
            buildVisible = true;
        }

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

            // Determine placement anchored to the baseline rightmost element so
            // stacked elevators above/below won't affect horizontal sequencing.
            const baselineRightmost = getBaselineRightmost(casaParent, casaRect);
            let anchorRect = casaRect;
            if (baselineRightmost) anchorRect = baselineRightmost.getBoundingClientRect();
            const left = (anchorRect.left - parentRect.left) + anchorRect.width + gap;
            const top = casaRect.top - parentRect.top;
            builtEl.style.left = left + 'px';
            builtEl.style.top = top + 'px';

            // append to parent
            casaParent.appendChild(builtEl);

            // ensure it's visible
            builtEl.style.display = 'flex';
            // hide modal/menu if open
            if (buildMenu) {
                buildMenu.classList.add('js-hidden');
                buildMenu.style.display = 'none';
            }
            if (buildModal) {
                buildModal.classList.add('js-hidden');
                buildModal.style.display = 'none';
            }

            // Keep build mode active so the user can place multiple constructions.
            // Recompute the main placeholder position (to the right of the new rightmost building)
            updateBuildPlaceholderPosition();

            // Determine if there is any elevator on the casa baseline. If so,
            // show elevator up/down placeholders (anchored to the rightmost
            // elevator on that baseline) while still keeping the main
            // horizontal placeholder visible so the player can continue building
            // to the right.
            const baselineRow = Array.from(casaParent.querySelectorAll('.constructed-building')).filter(el => {
                const r = el.getBoundingClientRect();
                return Math.abs(r.top - casaRect.top) < 4;
            });
            // find rightmost elevator on the baseline (if any)
            const baselineElevators = baselineRow.filter(el => el.classList.contains('building-elevador'));
            if (baselineElevators.length > 0 && buildPlaceholderUp && buildPlaceholderDown) {
                const rightmostElevator = baselineElevators.reduce((acc, el) => {
                    const r = el.getBoundingClientRect();
                    const right = r.left + r.width;
                    const accR = acc.getBoundingClientRect().left + acc.getBoundingClientRect().width;
                    return right > accR ? el : acc;
                }, baselineElevators[0]);
                updateElevatorPlaceholders(rightmostElevator);
                buildPlaceholderUp.classList.remove('js-hidden');
                buildPlaceholderUp.style.display = 'flex';
                buildPlaceholderDown.classList.remove('js-hidden');
                buildPlaceholderDown.style.display = 'flex';
                // ensure main placeholder is still visible for horizontal building
                buildPlaceholder.classList.remove('js-hidden');
                buildPlaceholder.style.display = 'flex';
            } else {
                if (buildPlaceholderUp) {
                    buildPlaceholderUp.classList.add('js-hidden');
                    buildPlaceholderUp.style.display = 'none';
                }
                if (buildPlaceholderDown) {
                    buildPlaceholderDown.classList.add('js-hidden');
                    buildPlaceholderDown.style.display = 'none';
                }
                // ensure main placeholder visible
                buildPlaceholder.classList.remove('js-hidden');
                buildPlaceholder.style.display = 'flex';
            }
            // keep buildVisible true so the user can continue placing constructions
            buildVisible = true;
            setBuildIndicator(true);
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

        // Note: placeholders (including elevator up/down) are intentionally NOT
        // hidden on document clicks. They are toggled only by the "Construir"
        // button so the user can click elsewhere without closing the build slot.

        // Elevator up/down placeholder click handlers
        if (buildPlaceholderUp) {
            buildPlaceholderUp.addEventListener('click', function (ev) {
                ev.stopPropagation();
                const casa = document.getElementById('casa-div');
                const casaParent = casa.parentElement;
                const existing = Array.from(casaParent.querySelectorAll('.constructed-building'));
                if (existing.length === 0) return;
                // find rightmost elevator anchor
                let rightmost = existing.reduce((acc, el) => {
                    const r = el.getBoundingClientRect();
                    const right = r.left + r.width;
                    const accRight = acc.getBoundingClientRect().left + acc.getBoundingClientRect().width;
                    return right > accRight ? el : acc;
                }, existing[0]);
                if (!rightmost.classList.contains('building-elevador')) return;
                createStackedElevator(rightmost, 'up');
            });
        }
        if (buildPlaceholderDown) {
            buildPlaceholderDown.addEventListener('click', function (ev) {
                ev.stopPropagation();
                const casa = document.getElementById('casa-div');
                const casaParent = casa.parentElement;
                const existing = Array.from(casaParent.querySelectorAll('.constructed-building'));
                if (existing.length === 0) return;
                let rightmost = existing.reduce((acc, el) => {
                    const r = el.getBoundingClientRect();
                    const right = r.left + r.width;
                    const accRight = acc.getBoundingClientRect().left + acc.getBoundingClientRect().width;
                    return right > accRight ? el : acc;
                }, existing[0]);
                if (!rightmost.classList.contains('building-elevador')) return;
                createStackedElevator(rightmost, 'down');
            });
        }
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