/*
 * Skygotchimon - Lógica Principal do Jogo
 *
 * Este arquivo é o "cérebro" do jogo. Ele inicializa o aplicativo,
 * gerencia a navegação entre as telas e controla a lógica das fases do jogo.
 */

import { ui, showScreen, toggleConfirmButton, deselectEggs } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Constantes de Jogo (para balanceamento) ---
    const GAME_LOOP_INTERVAL_MS = 5000; // Tick do jogo a cada 5 segundos
    const INCUBATION_INTERVAL_MS = 1200;
    const INCUBATION_PROGRESS_STEP = 5; // Aumentado para testes
    const EVOLUTION_TIME_MS = 2 * 60 * 60 * 1000; // 2 horas em milissegundos
    const STAT_DECAY_RATE = 1; // Quanto os status caem por tick
    const DIRT_INCREASE_RATE = 1; // Quanto a sujeira aumenta por tick
    const STAT_THRESHOLD = 50; // Limite para considerar um status "ruim"
    const CLEAN_AMOUNT = 25; // Quanto cada clique no botão de limpar remove de sujeira

    // Mapeia o 'data-element' (inglês) para o nome da pasta (português)
    const ELEMENT_PATH_MAP = {
        fire: 'fogo',
        water: 'agua',
        earth: 'terra',
        air: 'ar',
        life: 'vida',
        undead: 'mortovivo', // Assumindo o nome da pasta
        magic: 'magia',
        tech: 'tecno',
        light: 'luz',
        dark: 'trevas'
    };

    const eggInfo = {
        fire: {
            title: "Criaturas de Fogo",
            description: `
                <p><strong>Reino de Origem:</strong> As criaturas de Fogo vêm das Profundezas Vulcânicas, uma região inóspita de rios de lava e montanhas de cinzas. É um lugar onde a energia da terra se manifesta em seu estado mais puro e caótico.</p>
                <p><strong>Tipos de Ataque:</strong> Eles controlam o fogo em todas as suas formas. Seus ataques são rápidos e agressivos, como jatos de chamas, bolas de fogo e ondas de calor. Em estágios mais avançados, eles podem até mesmo invocar pequenas erupções vulcânicas.</p>
                <p><strong>Comportamento:</strong> Agressivos e cheios de energia, mas também podem ser leais e protetores. Eles têm um temperamento quente e reagem rapidamente a ameaças, mas quando bem cuidados, são a companhia mais calorosa que se pode ter.</p>
            `
        },
        // Add other elements here later
    };

    // --- Estado Centralizado do Jogo ---
    const gameState = {
        game: {
            loopInterval: null,
            isPaused: false, // Usado pela função Dormir
            lastTickTimestamp: null,
        },
        incubation: {
            selectedEggElement: null,
            progress: 0,
            interval: null,
            isIncubating: false,
        },
        creature: {
            name: null,
            creatureName: null, // Ex: "Leognis"
            element: null,
            stage: null,
            currentAnimation: 'normal',
            stats: {
                fome: 100,
                felicidade: 100,
                sujeira: 0, // 0 = limpo, 100 = sujo
                saude: 100,
            },
            progression: {
                experience: 0, // Medido em milissegundos efetivos
            }
        }
    };
    
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
                gameState.incubation.selectedEggElement = null;
                toggleConfirmButton(false);
            } else {
                deselectEggs(egg);
                egg.classList.add('selected');
                gameState.incubation.selectedEggElement = egg.dataset.element;
                toggleConfirmButton(true);
            }
        });
    });

    // Adiciona evento de clique ao botão de confirmação
    ui.confirmEggBtn.addEventListener('click', () => {
        if (gameState.incubation.selectedEggElement) {
            showEggInfoPopup(gameState.incubation.selectedEggElement);
        }
    });

    // Adiciona evento de clique ao botão de continuar do pop-up
    ui.popupContinueBtn.addEventListener('click', () => {
        ui.eggInfoPopup.classList.add('hidden');
        startIncubation();
    });

    function showEggInfoPopup(element) {
        const info = eggInfo[element];
        if (!info) {
            // If no info, just proceed
            startIncubation();
            return;
        }
    
        ui.popupEggImage.src = `assets/images/eggs/${element}_egg.png`;
        ui.popupEggTitle.textContent = info.title;
        ui.popupEggDescription.innerHTML = info.description;
    
        ui.eggInfoPopup.classList.remove('hidden');
    }

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
        const conditions = idealConditions[gameState.incubation.selectedEggElement];
        const isTempIdeal = temp >= conditions.temp.min && temp <= conditions.temp.max;
        const isHumidityIdeal = humidity >= conditions.humidity.min && humidity <= conditions.humidity.max;
        const isLightIdeal = light >= conditions.light.min && light <= conditions.light.max;
        return isTempIdeal && isHumidityIdeal && isLightIdeal;
    }

    // Função para iniciar a incubação
    function startIncubation() {
        if (gameState.incubation.isIncubating) return;

        console.log(`Ovo de ${gameState.incubation.selectedEggElement} selecionado!`);
        const eggImagePath = `assets/images/eggs/${gameState.incubation.selectedEggElement}_egg.png`;
        ui.eggImageIncubator.src = eggImagePath;

        gameState.incubation.isIncubating = true;
        showScreen('tela-incubadora');

        // Zera o progresso e atualiza os visuais iniciais
        gameState.incubation.progress = 0;
        ui.progressBarIncubator.firstElementChild.style.width = '0%';
        updateEggVisuals();

        gameState.incubation.interval = setInterval(() => {
            if (checkIncubationConditions()) {
                gameState.incubation.progress += INCUBATION_PROGRESS_STEP;
                ui.progressBarIncubator.firstElementChild.style.width = `${gameState.incubation.progress}%`;
                ui.eggFeedback.textContent = "Condições ideais! O ovo está aquecendo...";
            } else {
                ui.eggFeedback.textContent = "Ajuste os parâmetros para continuar a incubação.";
            }

            if (gameState.incubation.progress >= 100) {
                hatchEgg();
            }
        }, INCUBATION_INTERVAL_MS);
    }

    // Função para quando o ovo choca
    function hatchEgg() {
        clearInterval(gameState.incubation.interval);
        gameState.incubation.isIncubating = false;
        ui.eggFeedback.textContent = "Seu ovo chocou!";

        // Popula o objeto da criatura com base no plano
        const creature = gameState.creature;
        creature.element = gameState.incubation.selectedEggElement;
        creature.stage = 'bebe';
        creature.creatureName = 'Leognis'; // Placeholder, idealmente viria de um arquivo de dados
        creature.name = 'Bebê Leognis'; // Nome temporário
        creature.stats = { fome: 80, felicidade: 100, sujeira: 0, saude: 100 };
        creature.progression.experience = 0;

        console.log("Criatura nascida:", gameState.creature);

        setTimeout(() => {
            populateCreatureProfile();
            showScreen('tela-bebe');
            startGameLoop();
        }, 2000);
    }

    // --- LÓGICA DA TELA DA CRIATURA ---

    /**
     * Decide e atualiza a animação da criatura com base em seu estado atual.
     * A função segue uma ordem de prioridade para exibir o estado mais urgente.
     */
    function updateCreatureAnimation() {
        // Não muda a animação se o jogo estiver pausado (dormindo) ou se uma ação como 'comer' estiver em progresso.
        if (gameState.game.isPaused || gameState.creature.currentAnimation === 'comendo') {
            return;
        }

        const { fome, felicidade, sujeira, saude } = gameState.creature.stats;
        let newAnimationName = 'normal'; // Animação padrão

        // Ordem de prioridade: Doente > Sujo > Triste/Com Fome > Feliz > Normal
        if (saude < STAT_THRESHOLD) {
            newAnimationName = 'doente';
        } else if (sujeira > STAT_THRESHOLD) {
            newAnimationName = 'sujo';
        } else if (fome < STAT_THRESHOLD || felicidade < STAT_THRESHOLD) {
            newAnimationName = 'triste';
        } else if (felicidade > 80) { // Considera 'feliz' se a felicidade for alta
            newAnimationName = 'feliz';
        }

        // Só atualiza a imagem se o estado da animação mudou
        if (newAnimationName !== gameState.creature.currentAnimation) {
            setCreatureAnimation(newAnimationName);
        }
    }

    /**
     * Monta o caminho para a imagem de uma animação específica da criatura.
     * @param {string} animationName - O nome do arquivo de animação (ex: 'parado', 'comendo').
     * @returns {string} O caminho completo para a imagem.
     */
    function getCreatureImagePath(animationName = 'normal') {
        const { element, creatureName, stage } = gameState.creature;
        const elementFolder = ELEMENT_PATH_MAP[element] || element; // Converte 'fire' para 'fogo', etc.
        // Mapeia o nome do estágio para o nome da pasta (ex: 'bebe' -> '1_bebe')
        const stageFolder = `1_${stage}`; // Simplificado para o estágio de bebê
        return `assets/images/creatures/${elementFolder}/${creatureName}/${stageFolder}/${animationName}.png`;
    }

    /**
     * Monta o caminho para a imagem de fundo da criatura.
     * @returns {string} O caminho completo para a imagem de fundo.
     */
    function getCreatureBackgroundPath() {
        const { element, creatureName } = gameState.creature;
        const elementFolder = ELEMENT_PATH_MAP[element] || element;
        // Assumindo que a imagem de fundo se chama 'background.png'
        return `assets/images/creatures/${elementFolder}/${creatureName}/background/background.png`;
    }

    /**
     * Define a animação (imagem) atual da criatura.
     * @param {string} animationName - O nome da animação a ser exibida.
     */
    function setCreatureAnimation(animationName) {
        gameState.creature.currentAnimation = animationName;
        const imagePath = getCreatureImagePath(animationName);
        ui.creatureImage.src = imagePath;
        console.log(`Animação alterada para: ${animationName}`);
    }

    // Prepara a tela da criatura com os dados iniciais
    function populateCreatureProfile() {
        ui.creatureName.textContent = gameState.creature.name;
        setCreatureAnimation('normal');
        const backgroundPath = getCreatureBackgroundPath();
        ui.telaBebe.style.backgroundImage = `url('${backgroundPath}')`;
        updateCreatureUI();
    }

    // Atualiza as barras de status na tela
    function updateCreatureUI() {
        const { fome, felicidade, sujeira, saude } = gameState.creature.stats;
        const growthPercent = Math.min((gameState.creature.progression.experience / EVOLUTION_TIME_MS) * 100, 100);

        ui.growthBar.style.width = `${growthPercent}%`;
        ui.hungerBar.style.width = `${fome}%`;
        ui.happinessBar.style.width = `${felicidade}%`;
        ui.cleanlinessBar.style.width = `${100 - sujeira}%`; // Invertido: 0 sujeira = 100% limpo
        ui.healthBar.style.width = `${saude}%`;
    }

    // Inicia o loop principal do jogo
    function startGameLoop() {
        if (gameState.game.loopInterval) clearInterval(gameState.game.loopInterval);
        gameState.game.lastTickTimestamp = Date.now(); // Define o ponto de partida
        gameState.game.loopInterval = setInterval(gameLoopTick, GAME_LOOP_INTERVAL_MS);
    }

    // A função "coração" do jogo, executada a cada tick
    function gameLoopTick() {
        if (gameState.game.isPaused) return;

        const stats = gameState.creature.stats;
        let barsBelowThreshold = 0;

        // 1. Degradação de Status
        // Fome
        stats.fome = Math.max(0, stats.fome - STAT_DECAY_RATE);
        if (stats.fome < STAT_THRESHOLD) barsBelowThreshold++;

        // Felicidade (com penalidade por fome)
        let happinessDecay = (stats.fome < STAT_THRESHOLD) ? STAT_DECAY_RATE * 2 : STAT_DECAY_RATE;
        stats.felicidade = Math.max(0, stats.felicidade - happinessDecay);
        if (stats.felicidade < STAT_THRESHOLD) barsBelowThreshold++;

        // Sujeira
        stats.sujeira = Math.min(100, stats.sujeira + DIRT_INCREASE_RATE);
        if (stats.sujeira > STAT_THRESHOLD) barsBelowThreshold++;

        // 2. Cálculo de Saúde
        if (barsBelowThreshold > 0) {
            stats.saude = Math.max(0, stats.saude - (STAT_DECAY_RATE * barsBelowThreshold));
        } else {
            stats.saude = Math.min(100, stats.saude + STAT_DECAY_RATE);
        }
        if (stats.saude < STAT_THRESHOLD) barsBelowThreshold++;

        // 3. Progressão de Experiência (com penalidade de tempo)
        const now = Date.now();
        const timeElapsed = now - gameState.game.lastTickTimestamp;
        gameState.game.lastTickTimestamp = now;
        const penaltyFactor = 1 + (barsBelowThreshold * 0.5); // 50% mais lento por status ruim
        const effectiveTimeElapsed = timeElapsed / penaltyFactor;
        gameState.creature.progression.experience += effectiveTimeElapsed;

        // 4. Atualiza a UI e verifica animações
        updateCreatureAnimation();
        updateCreatureUI();

        console.log("Tick:", stats, `XP: ${Math.round((gameState.creature.progression.experience / EVOLUTION_TIME_MS) * 100)}%`);
    }

    // --- Funções de Ação do Jogador ---

    function handleFeed() {
        if (gameState.game.isPaused) return;
        const stats = gameState.creature.stats;
        stats.fome = Math.min(100, stats.fome + 25);
        stats.felicidade = Math.min(100, stats.felicidade + 5);
        stats.sujeira = Math.min(100, stats.sujeira + 10);
        updateCreatureUI();

        // Aciona a animação "Comendo" temporariamente
        const previousAnimation = gameState.creature.currentAnimation;
        setCreatureAnimation('comendo');

        // TODO: Desabilitar botões durante a animação

        setTimeout(() => {
            // Força a reavaliação da animação no próximo tick
            gameState.creature.currentAnimation = previousAnimation; 
            updateCreatureAnimation();
        }, 2500); // Duração da animação de comer
    }

    function handlePlay() {
        if (gameState.game.isPaused) return;
        const stats = gameState.creature.stats;
        stats.felicidade = Math.min(100, stats.felicidade + 20);
        updateCreatureUI();

        // Aciona a animação "Feliz" temporariamente
        const previousAnimation = gameState.creature.currentAnimation;
        setCreatureAnimation('feliz');
        setTimeout(() => {
            gameState.creature.currentAnimation = previousAnimation;
            updateCreatureAnimation();
        }, 2500); // Duração da animação de brincar
    }

    function handleClean() {
        if (gameState.game.isPaused) return;
        gameState.creature.stats.sujeira = Math.max(0, gameState.creature.stats.sujeira - CLEAN_AMOUNT);
        updateCreatureUI();
    }

    function handleSleep() {
        gameState.game.isPaused = !gameState.game.isPaused;
        if (gameState.game.isPaused) {
            console.log("Criatura dormindo. Jogo pausado.");
            setCreatureAnimation('dormindo');
            // TODO: Escurecer tela
        } else {
            console.log("Criatura acordou.");
            gameState.game.lastTickTimestamp = Date.now(); // Reseta o tempo para evitar saltos
            updateCreatureAnimation(); // Reavalia a animação ao acordar
            // TODO: Clarear tela
        }
    }

    // --- LÓGICA DE DEBUG ---

    /**
     * Sincroniza os valores dos sliders de debug com o estado atual da criatura.
     */
    function updateDebugSliders() {
        const { fome, felicidade, sujeira, saude } = gameState.creature.stats;
        ui.debugHungerSlider.value = fome;
        ui.debugHappinessSlider.value = felicidade;
        ui.debugCleanlinessSlider.value = sujeira;
        ui.debugHealthSlider.value = saude;
    }

    /**
     * Inicializa todos os event listeners e a lógica para o menu de debug.
     */
    function setupDebugControls() {
        // Evento para mostrar/esconder o painel de debug
        ui.debugToggleBtn.addEventListener('click', () => {
            ui.debugPanel.classList.toggle('hidden');
            // Sincroniza os sliders com o estado atual ao abrir o painel
            if (!ui.debugPanel.classList.contains('hidden')) {
                updateDebugSliders();
            }
        });

        // Função auxiliar para configurar um slider de debug
        const setupSlider = (slider, statName) => {
            slider.addEventListener('input', (e) => {
                // Atualiza o estado do jogo com o valor do slider
                gameState.creature.stats[statName] = parseInt(e.target.value);
                // Atualiza a UI principal e a animação da criatura em tempo real
                updateCreatureUI();
                updateCreatureAnimation();
            });
        };

        // Configura cada slider
        setupSlider(ui.debugHungerSlider, 'fome');
        setupSlider(ui.debugHappinessSlider, 'felicidade');
        setupSlider(ui.debugCleanlinessSlider, 'sujeira');
        setupSlider(ui.debugHealthSlider, 'saude');
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

    // Conecta os botões de ação às suas funções
    ui.feedBtn.addEventListener('click', handleFeed);
    ui.playBtn.addEventListener('click', handlePlay);
    ui.cleanBtn.addEventListener('click', handleClean);
    ui.sleepBtn.addEventListener('click', handleSleep);

    // Inicializa os controles de debug
    setupDebugControls();

    // Função de inicialização
    function init() {
        showScreen('tela-ovo');
    }

    init();
});