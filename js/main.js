/*
 * Skygotchimon - Lógica Principal do Jogo
 *
 * Este arquivo é o "cérebro" do jogo. Ele inicializa o aplicativo,
 * gerencia a navegação entre as telas e controla a lógica das fases do jogo.
 */

import { ui, showScreen, toggleConfirmButton, deselectEggs } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // Estado do jogo
    let selectedEggElement = null;
    let incubationProgress = 0;
    let incubationInterval = null;
    let isIncubating = false;

    // Condições ideais para cada elemento
    const idealConditions = {
        fire: { temp: { min: 70, max: 100 }, humidity: { min: 0, max: 30 }, light: { min: 70, max: 100 } },
        water: { temp: { min: 0, max: 30 }, humidity: { min: 70, max: 100 }, light: { min: 0, max: 30 } },
        earth: { temp: { min: 40, max: 60 }, humidity: { min: 40, max: 60 }, light: { min: 0, max: 30 } },
        air: { temp: { min: 0, max: 30 }, humidity: { min: 0, max: 30 }, light: { min: 70, max: 100 } },
        life: { temp: { min: 40, max: 60 }, humidity: { min: 40, max: 60 }, light: { min: 40, max: 60 } },
        undead: { temp: { min: 0, max: 30 }, humidity: { min: 0, max: 30 }, light: { min: 0, max: 10 } },
        magic: { temp: { min: 40, max: 60 }, humidity: { min: 40, max: 60 }, light: { min: 40, max: 60 } },
        tech: { temp: { min: 0, max: 30 }, humidity: { min: 0, max: 30 }, light: { min: 70, max: 100 } },
        light: { temp: { min: 0, max: 30 }, humidity: { min: 0, max: 30 }, light: { min: 90, max: 100 } },
        dark: { temp: { min: 40, max: 60 }, humidity: { min: 70, max: 100 }, light: { min: 0, max: 10 } },
    };

    // Adiciona evento de clique a cada ovo
    ui.eggContainers.forEach(egg => {
        // Impede cliques em ovos bloqueados
        if (egg.classList.contains('locked')) {
            return;
        }

        egg.addEventListener('click', () => {
            // Se o ovo já estiver selecionado, deseleciona
            if (egg.classList.contains('selected')) {
                egg.classList.remove('selected');
                selectedEggElement = null;
                toggleConfirmButton(false);
            } else {
                // Seleciona o ovo e deseleciona os outros
                deselectEggs(egg);
                egg.classList.add('selected');
                selectedEggElement = egg.dataset.element;
                toggleConfirmButton(true);
            }
        });
    });

    // Adiciona evento de clique ao botão de confirmação
    ui.confirmEggBtn.addEventListener('click', () => {
        if (selectedEggElement) {
            // Lógica para mudar para a tela da incubadora
            console.log(`Ovo de ${selectedEggElement} selecionado!`);
            showScreen('tela-incubadora');
            
            // Define a imagem do ovo na tela da incubadora
            const eggImagePath = `assets/images/eggs/${selectedEggElement}_egg.png`;
            ui.eggImageIncubator.src = eggImagePath;

            startIncubation();
        }
    });

    // Função para verificar se as condições de incubação são ideais
    function checkIncubationConditions() {
        const temp = parseInt(ui.temperatureSlider.value);
        const humidity = parseInt(ui.humiditySlider.value);
        const light = parseInt(ui.lightSlider.value);

        const conditions = idealConditions[selectedEggElement];

        const isTempIdeal = temp >= conditions.temp.min && temp <= conditions.temp.max;
        const isHumidityIdeal = humidity >= conditions.humidity.min && humidity <= conditions.humidity.max;
        const isLightIdeal = light >= conditions.light.min && light <= conditions.light.max;

        if (isTempIdeal && isHumidityIdeal && isLightIdeal) {
            return true;
        } else {
            return false;
        }
    }

    // Função para iniciar a incubação
    function startIncubation() {
        if (isIncubating) return;
        isIncubating = true;

        incubationInterval = setInterval(() => {
            if (checkIncubationConditions()) {
                incubationProgress += 1;
                ui.progressBarIncubator.firstElementChild.style.width = `${incubationProgress}%`;
                ui.eggFeedback.textContent = "Condições ideais! O ovo está aquecendo...";
            } else {
                ui.eggFeedback.textContent = "Ajuste os parâmetros para continuar a incubação.";
            }

            if (incubationProgress >= 100) {
                clearInterval(incubationInterval);
                isIncubating = false;
                ui.eggFeedback.textContent = "Seu ovo chocou!";
                // Transição para a próxima tela
                setTimeout(() => {
                    // Substitua 'proxima-tela' pelo ID da próxima tela, ex: 'tela-perfil-criatura'
                    showScreen('tela-perfil-criatura'); 
                }, 2000);
            }
        }, 1200); // 2 minutos / 100% = 1.2 segundos por %
    }

    // Adiciona evento de mudança aos sliders para feedback instantâneo
    ui.temperatureSlider.addEventListener('input', () => {
        if (!checkIncubationConditions()) {
            ui.eggFeedback.textContent = "Ajuste os parâmetros para continuar a incubação.";
        }
    });

    ui.humiditySlider.addEventListener('input', () => {
        if (!checkIncubationConditions()) {
            ui.eggFeedback.textContent = "Ajuste os parâmetros para continuar a incubação.";
        }
    });

    ui.lightSlider.addEventListener('input', () => {
        if (!checkIncubationConditions()) {
            ui.eggFeedback.textContent = "Ajuste os parâmetros para continuar a incubação.";
        }
    });

    // Função de inicialização
    function init() {
        // Mostra a tela inicial e oculta as outras
        showScreen('tela-ovo');
    }

    init();
});
