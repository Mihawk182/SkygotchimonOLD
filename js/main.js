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
        if (egg.classList.contains('locked')) {
            return;
        }
        egg.addEventListener('click', () => {
            if (egg.classList.contains('selected')) {
                egg.classList.remove('selected');
                selectedEggElement = null;
                toggleConfirmButton(false);
            } else {
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
            console.log(`Ovo de ${selectedEggElement} selecionado!`);
            showScreen('tela-incubadora');
            const eggImagePath = `assets/images/eggs/${selectedEggElement}_egg.png`;
            ui.eggImageIncubator.src = eggImagePath;
            startIncubation();
        }
    });

    // Função para atualizar os filtros visuais do ovo
    function updateEggVisuals() {
        const temp = parseInt(ui.temperatureSlider.value);
        const humidity = parseInt(ui.humiditySlider.value);
        const light = parseInt(ui.lightSlider.value);

        const filters = [];

        // Lógica para o brilho (Luminosidade)
        filters.push(`brightness(${0.2 + (light / 100)})`);

        // Lógica para a sombra da Temperatura
        const tempMid = 50;
        if (temp > tempMid) { // Quente
            const opacity = Math.min((temp - tempMid) / (100 - tempMid), 1);
            const tempColor = `rgba(255, 0, 0, ${opacity})`;
            filters.push(`drop-shadow(0 0 15px ${tempColor})`);
        } else if (temp < tempMid) { // Frio
            const opacity = Math.min((tempMid - temp) / tempMid, 1);
            const tempColor = `rgba(0, 255, 255, ${opacity})`;
            filters.push(`drop-shadow(0 0 15px ${tempColor})`);
        }

        // Lógica para a sombra da Umidade
        const humidityMid = 50;
        if (humidity > humidityMid) { // Úmido
            const opacity = Math.min((humidity - humidityMid) / (100 - humidityMid), 1);
            const humidityColor = `rgba(37, 99, 235, ${opacity})`;
            filters.push(`drop-shadow(0 0 12px ${humidityColor})`);
        } else if (humidity < humidityMid) { // Seco
            const opacity = Math.min((humidityMid - humidity) / humidityMid, 1);
            const humidityColor = `rgba(150, 75, 0, ${opacity})`;
            filters.push(`drop-shadow(0 0 12px ${humidityColor})`);
        }

        ui.eggImageIncubator.style.filter = filters.join(' ');
    }

    // Função para verificar se as condições de incubação são ideais
    function checkIncubationConditions() {
        const temp = parseInt(ui.temperatureSlider.value);
        const humidity = parseInt(ui.humiditySlider.value);
        const light = parseInt(ui.lightSlider.value);
        const conditions = idealConditions[selectedEggElement];
        const isTempIdeal = temp >= conditions.temp.min && temp <= conditions.temp.max;
        const isHumidityIdeal = humidity >= conditions.humidity.min && humidity <= conditions.humidity.max;
        const isLightIdeal = light >= conditions.light.min && light <= conditions.light.max;
        return isTempIdeal && isHumidityIdeal && isLightIdeal;
    }

    // Função para iniciar a incubação
    function startIncubation() {
        if (isIncubating) return;
        isIncubating = true;

        // Zera o progresso e atualiza os visuais iniciais
        incubationProgress = 0;
        ui.progressBarIncubator.firstElementChild.style.width = '0%';
        updateEggVisuals();

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
                setTimeout(() => {
                    showScreen('tela-perfil-criatura'); 
                }, 2000);
            }
        }, 1200);
    }

    // Adiciona evento de mudança aos sliders para feedback instantâneo
    [ui.temperatureSlider, ui.humiditySlider, ui.lightSlider].forEach(slider => {
        slider.addEventListener('input', () => {
            updateEggVisuals();
            if (!checkIncubationConditions()) {
                ui.eggFeedback.textContent = "Ajuste os parâmetros para continuar a incubação.";
            }
        });
    });

    // Função de inicialização
    function init() {
        showScreen('tela-ovo');
    }

    init();
});
