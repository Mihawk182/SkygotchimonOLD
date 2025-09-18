/*
 * Skygotchimon - Lógica Principal do Jogo
 *
 * Este arquivo é o "cérebro" do jogo. Ele inicializa o aplicativo,
 * gerencia a navegação entre as telas e controla a lógica das fases do jogo.
 */

import { ui, showScreen, deselectEggs } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Constantes de Jogo (para balanceamento) ---
    const GAME_LOOP_INTERVAL_MS = 5000;
    const INCUBATION_INTERVAL_MS = 1200;
    const INCUBATION_PROGRESS_STEP = 5;
    const EVOLUTION_TIME_MS = 1 * 60 * 1000; // Reduzido para 1 minuto para teste
    const STAT_DECAY_RATE = 1;
    const DIRT_INCREASE_RATE = 1;
    const STAT_THRESHOLD = 50;
    const CLEAN_AMOUNT = 25;
    const STUDY_DRAIN_MULTIPLIER = 2;
    const TRAIN_DRAIN_MULTIPLIER = 3;

    // Mapeamento de Nomes
    const ELEMENT_PATH_MAP = { fire: 'fogo', water: 'agua', earth: 'terra', air: 'ar', life: 'vida', undead: 'mortovivo', magic: 'magia', tech: 'tecno', light: 'luz', dark: 'trevas' };
    const STAGE_FOLDER_MAP = { bebe: '1_bebe', crianca: '2_criança', adulto: '3_adulto', mestre: '4_mestre', supremo: '5_supremo' };

    const eggInfo = {
        fire: {
            title: "Criaturas de Fogo",
            description: `<p><strong>Reino de Origem:</strong> As criaturas de Fogo vêm das Profundezas Vulcânicas, uma região inóspita de rios de lava e montanhas de cinzas. É um lugar onde a energia da terra se manifesta em seu estado mais puro e caótico.</p><p><strong>Tipos de Ataque:</strong> Eles controlam o fogo em todas as suas formas. Seus ataques são rápidos e agressivos, como jatos de chamas, bolas de fogo e ondas de calor. Em estágios mais avançados, eles podem até mesmo invocar pequenas erupções vulcânicas.</p><p><strong>Comportamento:</strong> Agressivos e cheios de energia, mas também podem ser leais e protetores. Eles têm um temperamento quente e reagem rapidamente a ameaças, mas quando bem cuidados, são a companhia mais calorosa que se pode ter.</p>`
        },
    };

    // --- Estado Centralizado do Jogo ---
    const gameState = {
        game: {
            loopInterval: null,
            isPaused: false,
            isInteracting: false, // Bloqueia outras ações durante uma interação
        },
        incubation: {
            selectedEggElement: null,
            progress: 0,
            interval: null,
            isIncubating: false,
        },
        creature: {
            name: null,
            creatureName: null,
            element: null,
            stage: 'bebe', // Estágio inicial
            currentAnimation: 'normal',
            isStudying: false,
            isTraining: false,
            stats: {
                fome: 100,
                felicidade: 100,
                sujeira: 0,
                saude: 100,
                forca: 0,
                inteligencia: 0,
            },
            progression: {
                experience: 0,
            }
        }
    };
    
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

    // --- Lógica de Inicialização e Eventos ---

    function init() {
        // Conecta todos os botões às suas funções
        ui.newGameBtn.addEventListener('click', () => showScreen('tela-castelo'));
        ui.loadGameBtn.addEventListener('click', () => console.log('Carregar Jogo clicado'));
        ui.optionsBtn.addEventListener('click', () => console.log('Opções clicado'));
        ui.exitBtn.addEventListener('click', () => console.log('Sair clicado'));

        ui.casaDiv.addEventListener('click', () => showScreen('tela-ovo')); // Added

        ui.popupContinueBtn.addEventListener('click', handlePopupContinue);
        ui.popupBackBtn.addEventListener('click', handlePopupBack);
        ui.feedBtn.addEventListener('click', handleFeed);
        ui.playBtn.addEventListener('click', handlePlay);
        ui.cleanBtn.addEventListener('click', handleClean);
        ui.sleepBtn.addEventListener('click', handleSleep);
        ui.studyBtn.addEventListener('click', handleStudy);
        ui.trainBtn.addEventListener('click', handleTrain);
        
        // Sliders da incubadora
        [ui.temperatureSlider, ui.humiditySlider, ui.lightSlider].forEach(slider => {
            slider.addEventListener('input', () => {
                updateEggVisuals();
                if (checkIncubationConditions()) {
                    ui.eggFeedback.textContent = "Condições ideais!";
                } else {
                    ui.eggFeedback.textContent = "Ajuste os parâmetros para continuar a incubação.";
                }
            });
        });

        // Ovos
        ui.eggContainers.forEach(egg => {
            if (egg.classList.contains('locked')) return;
            egg.addEventListener('click', () => {
                const element = egg.dataset.element;
                gameState.incubation.selectedEggElement = element;
                deselectEggs(egg); // Mantém a lógica de deselecionar os outros
                egg.classList.add('selected'); // Marca o ovo clicado
                showEggInfoPopup(element);
            });

            // Adiciona som ao passar o mouse sobre o ovo
            egg.addEventListener('mouseenter', () => {
                // Encontra o elemento de vídeo dentro do container do ovo
                const video = egg.querySelector('video.egg-image');
                if (video) {
                    video.muted = false;  // Ativa o som
                    video.play();       // Garante que o vídeo continue tocando
                }
            });

            egg.addEventListener('mouseleave', () => {
                const video = egg.querySelector('video.egg-image');
                if (video) {
                    video.muted = true; // Desativa o som
                }
            });
        });

        setupDebugControls();
        showScreen('tela-menu');
    }

    // --- Lógica de Telas e UI ---

    /**
     * Lida com o clique no botão "Voltar" do pop-up de informações do ovo.
     */
    function handlePopupBack() {
        // Pausa o vídeo para parar o som e esconde o pop-up
        ui.popupEggImage.pause();
        ui.popupEggImage.src = '';
        ui.eggInfoPopup.classList.add('hidden');
        deselectEggs(null); // Remove a seleção de todos os ovos
        gameState.incubation.selectedEggElement = null;
    }

    /**
     * Lida com o clique no botão "Confirmar" do pop-up de informações do ovo.
     * Pausa o vídeo do pop-up e inicia a incubação.
     */
    function handlePopupContinue() {
        ui.eggInfoPopup.classList.add('hidden');
        ui.popupEggImage.pause();
        ui.popupEggImage.src = '';
        startIncubation();
    }

    function showEggInfoPopup(element) {
        const info = eggInfo[element];
        if (!info) {
            startIncubation();
            return;
        }
        ui.popupEggImage.src = `assets/videos/eggs/${element}_egg.mp4`;
        ui.popupEggTitle.textContent = info.title;
        ui.popupEggDescription.innerHTML = info.description;
        ui.eggInfoPopup.classList.remove('hidden');
    }

    function populateCreatureProfile() {
        const { name, stage } = gameState.creature;
        ui.creatureName.textContent = `${name}`;
        setCreatureAnimation('normal');
        const backgroundPath = getCreatureBackgroundPath();
        ui.telaCuidados.style.backgroundImage = `url('${backgroundPath}')`;
        updateCreatureUI();
    }

    function updateCreatureUI() {
        const { fome, felicidade, sujeira, saude, forca, inteligencia } = gameState.creature.stats;
        const growthPercent = Math.min((gameState.creature.progression.experience / EVOLUTION_TIME_MS) * 100, 100);

        ui.growthBar.style.width = `${growthPercent}%`;
        ui.hungerBar.style.width = `${fome}%`;
        ui.happinessBar.style.width = `${felicidade}%`;
        ui.cleanlinessBar.style.width = `${100 - sujeira}%`;
        ui.healthBar.style.width = `${saude}%`;
        ui.strengthBar.style.width = `${forca}%`;
        ui.intelligenceBar.style.width = `${inteligencia}%`;
    }

    // --- Lógica de Incubação e Evolução ---

    function startIncubation() {
        if (gameState.incubation.isIncubating) return;
        const eggVideoPath = `assets/videos/eggs/${gameState.incubation.selectedEggElement}_egg.mp4`;
        ui.eggImageIncubator.src = eggVideoPath;
        gameState.incubation.isIncubating = true;
        showScreen('tela-incubadora');

        // Zera o progresso e atualiza os visuais iniciais
        gameState.incubation.progress = 0;
        ui.progressBarIncubator.firstElementChild.style.width = '0%';
        updateEggVisuals();

        // Define o feedback inicial para guiar o jogador
        ui.eggFeedback.textContent = "Ajuste os parâmetros para encontrar as condições ideais.";

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

    function hatchEgg() {
        clearInterval(gameState.incubation.interval);
        gameState.incubation.isIncubating = false;

        // Pausa o vídeo da incubadora para garantir que o som pare antes de ir para a próxima tela.
        ui.eggImageIncubator.pause();
        ui.eggImageIncubator.src = '';
        
        const creature = gameState.creature;
        creature.element = gameState.incubation.selectedEggElement;
        creature.stage = 'bebe';
        creature.creatureName = 'Leognis'; // Placeholder
        creature.name = 'Bebê Leognis';
        creature.stats = { fome: 80, felicidade: 100, sujeira: 0, saude: 100, forca: 0, inteligencia: 0 };
        creature.progression.experience = 0;

        console.log("Criatura nascida:", gameState.creature);

        setTimeout(() => {
            populateCreatureProfile();
            showScreen('tela-cuidados');
            startGameLoop();
        }, 2000);
    }

    function checkEvolution() {
        if (gameState.creature.progression.experience >= EVOLUTION_TIME_MS) {
            evolveCreature();
        }
    }

    function evolveCreature() {
        const currentStageIndex = Object.keys(STAGE_FOLDER_MAP).indexOf(gameState.creature.stage);
        const nextStage = Object.keys(STAGE_FOLDER_MAP)[currentStageIndex + 1];

        if (nextStage) {
            console.log(`Evoluindo para ${nextStage}!`);
            gameState.creature.stage = nextStage;
            gameState.creature.progression.experience = 0; // Reseta a experiência
            gameState.creature.name = `Leognis ${nextStage.charAt(0).toUpperCase() + nextStage.slice(1)}`;

            if (currentStageIndex >= 0) { // A partir de criança
                ui.strengthBarContainer.classList.remove('hidden');
                ui.intelligenceBarContainer.classList.remove('hidden');
                ui.studyBtn.classList.remove('hidden');
                ui.trainBtn.classList.remove('hidden');
            }
            
            populateCreatureProfile();
        }
    }

    function checkIncubationConditions() {
        if (!gameState.incubation.selectedEggElement) {
            console.log("checkIncubationConditions: selectedEggElement is null");
            return false;
        }
        const temp = parseInt(ui.temperatureSlider.value);
        const humidity = parseInt(ui.humiditySlider.value);
        const light = parseInt(ui.lightSlider.value);
        const conditions = idealConditions[gameState.incubation.selectedEggElement];

        console.log("Current values:", { temp, humidity, light });
        console.log("Ideal conditions:", conditions);

        const isTempIdeal = temp >= conditions.temp.min && temp <= conditions.temp.max;
        const isHumidityIdeal = humidity >= conditions.humidity.min && humidity <= conditions.humidity.max;
        const isLightIdeal = light >= conditions.light.min && light <= conditions.light.max;

        console.log("Conditions met:", { isTempIdeal, isHumidityIdeal, isLightIdeal });

        return isTempIdeal && isHumidityIdeal && isLightIdeal;
    }

    // --- Game Loop Principal ---

    function startGameLoop() {
        if (gameState.game.loopInterval) clearInterval(gameState.game.loopInterval);
        gameState.game.lastTickTimestamp = Date.now();
        gameState.game.loopInterval = setInterval(gameLoopTick, GAME_LOOP_INTERVAL_MS);
    }

    function gameLoopTick() {
        if (gameState.game.isPaused) return;

        const { stats, isStudying, isTraining } = gameState.creature;
        let barsBelowThreshold = 0;
        
        const studyMultiplier = isStudying ? STUDY_DRAIN_MULTIPLIER : 1;
        const trainMultiplier = isTraining ? TRAIN_DRAIN_MULTIPLIER : 1;

        stats.fome = Math.max(0, stats.fome - (STAT_DECAY_RATE * studyMultiplier * trainMultiplier));
        if (stats.fome < STAT_THRESHOLD) barsBelowThreshold++;

        let happinessDecay = (stats.fome < STAT_THRESHOLD) ? STAT_DECAY_RATE * 2 : STAT_DECAY_RATE;
        stats.felicidade = Math.max(0, stats.felicidade - (happinessDecay * studyMultiplier * trainMultiplier));
        if (stats.felicidade < STAT_THRESHOLD) barsBelowThreshold++;

        stats.sujeira = Math.min(100, stats.sujeira + (DIRT_INCREASE_RATE * (isTraining ? 2 : 1)));
        if (stats.sujeira > STAT_THRESHOLD) barsBelowThreshold++;

        if (barsBelowThreshold > 0) {
            stats.saude = Math.max(0, stats.saude - (STAT_DECAY_RATE * barsBelowThreshold));
        } else {
            stats.saude = Math.min(100, stats.saude + STAT_DECAY_RATE);
        }

        const now = Date.now();
        const timeElapsed = now - gameState.game.lastTickTimestamp;
        gameState.game.lastTickTimestamp = now;
        gameState.creature.progression.experience += timeElapsed;

        checkEvolution();

        updateCreatureAnimation();
        updateCreatureUI();
    }

    // --- Funções de Ação do Jogador ---
    function handleFeed() {
        if (gameState.game.isInteracting) return;
        const stats = gameState.creature.stats;
        stats.fome = Math.min(100, stats.fome + 25);
        stats.felicidade = Math.min(100, stats.felicidade + 5);
        stats.sujeira = Math.min(100, stats.sujeira + 10);
        updateCreatureUI();

        const previousAnimation = gameState.creature.currentAnimation;
        setCreatureAnimation('comendo');
        gameState.game.isInteracting = true;
        setTimeout(() => {
            gameState.creature.currentAnimation = previousAnimation; 
            updateCreatureAnimation();
            gameState.game.isInteracting = false;
        }, 2500);
    }

    function handlePlay() {
        if (gameState.game.isInteracting) return;
        const stats = gameState.creature.stats;
        stats.felicidade = Math.min(100, stats.felicidade + 20);
        updateCreatureUI();

        const previousAnimation = gameState.creature.currentAnimation;
        setCreatureAnimation('feliz');
        gameState.game.isInteracting = true;
        setTimeout(() => {
            gameState.creature.currentAnimation = previousAnimation;
            updateCreatureAnimation();
            gameState.game.isInteracting = false;
        }, 2500);
    }

    function handleClean() {
        if (gameState.game.isInteracting) return;
        gameState.creature.stats.sujeira = Math.max(0, gameState.creature.stats.sujeira - CLEAN_AMOUNT);
        updateCreatureUI();
    }

    function handleSleep() {
        gameState.game.isPaused = !gameState.game.isPaused;
        if (gameState.game.isPaused) {
            setCreatureAnimation('dormindo');
        } else {
            gameState.game.lastTickTimestamp = Date.now();
            updateCreatureAnimation();
        }
    }

    function handleStudy() {
        if (gameState.game.isInteracting) return;
        gameState.game.isInteracting = true;
        gameState.creature.isStudying = true;

        // TODO: Adicionar animação de estudo
        console.log("Estudando...");
        gameState.creature.stats.inteligencia = Math.min(100, gameState.creature.stats.inteligencia + 5);

        setTimeout(() => {
            gameState.game.isInteracting = false;
            gameState.creature.isStudying = false;
        }, 3000); // Duração da ação
    }

    function handleTrain() {
        if (gameState.game.isInteracting) return;
        gameState.game.isInteracting = true;
        gameState.creature.isTraining = true;

        // TODO: Adicionar animação de treino
        console.log("Treinando...");
        gameState.creature.stats.forca = Math.min(100, gameState.creature.stats.forca + 5);

        setTimeout(() => {
            gameState.game.isInteracting = false;
            gameState.creature.isTraining = false;
        }, 3000);
    }

    // --- Funções de Utilidade e Animação ---

    function updateCreatureAnimation() {
        if (gameState.game.isPaused) return;
        if (gameState.game.isInteracting) return;

        const { fome, felicidade, sujeira, saude } = gameState.creature.stats;
        let newAnimationName = 'normal';

        if (saude < STAT_THRESHOLD) newAnimationName = 'doente';
        else if (sujeira > STAT_THRESHOLD) newAnimationName = 'sujo';
        else if (fome < STAT_THRESHOLD || felicidade < STAT_THRESHOLD) newAnimationName = 'triste';
        else if (felicidade > 80) newAnimationName = 'feliz';

        if (newAnimationName !== gameState.creature.currentAnimation) {
            setCreatureAnimation(newAnimationName);
        }
    }

    function getCreatureImagePath(animationName = 'normal') {
        const { element, creatureName, stage } = gameState.creature;
        const elementFolder = ELEMENT_PATH_MAP[element] || element;
        const stageFolder = STAGE_FOLDER_MAP[stage] || '1_bebe';
        return `assets/images/creatures/${elementFolder}/${creatureName}/${stageFolder}/${animationName}.png`;
    }

    function getCreatureBackgroundPath() {
        const { element, creatureName } = gameState.creature;
        const elementFolder = ELEMENT_PATH_MAP[element] || element;
        return `assets/images/creatures/${elementFolder}/${creatureName}/background/background.png`;
    }

    function setCreatureAnimation(animationName) {
        gameState.creature.currentAnimation = animationName;
        const imagePath = getCreatureImagePath(animationName);
        ui.creatureImage.src = imagePath;
    }
    
    function updateEggVisuals() {
        const temp = parseInt(ui.temperatureSlider.value);
        const humidity = parseInt(ui.humiditySlider.value);
        const light = parseInt(ui.lightSlider.value);

        const filters = [];

        filters.push(`brightness(${0.2 + (light / 100)})`);

        const tempMid = 50;
        if (temp > tempMid) {
            const opacity = Math.min((temp - tempMid) / (100 - tempMid), 1);
            const tempColor = `rgba(255, 0, 0, ${opacity})`;
            filters.push(`drop-shadow(0 0 15px ${tempColor})`);
        } else if (temp < tempMid) {
            const opacity = Math.min((tempMid - temp) / tempMid, 1);
            const tempColor = `rgba(0, 255, 255, ${opacity})`;
            filters.push(`drop-shadow(0 0 15px ${tempColor})`);
        }

        const humidityMid = 50;
        if (humidity > humidityMid) {
            const opacity = Math.min((humidity - humidityMid) / (100 - humidityMid), 1);
            const humidityColor = `rgba(37, 99, 235, ${opacity})`;
            filters.push(`drop-shadow(0 0 12px ${humidityColor})`);
        } else if (humidity < humidityMid) {
            const opacity = Math.min((humidityMid - humidity) / humidityMid, 1);
            const humidityColor = `rgba(150, 75, 0, ${opacity})`;
            filters.push(`drop-shadow(0 0 12px ${humidityColor})`);
        }

        ui.eggImageIncubator.style.filter = filters.join(' ');
    }

    function setupDebugControls() {
        ui.debugToggleBtn.addEventListener('click', () => {
            ui.debugPanel.classList.toggle('hidden');
            if (!ui.debugPanel.classList.contains('hidden')) {
                updateDebugSliders();
            }
        });

        const setupSlider = (slider, statName) => {
            slider.addEventListener('input', (e) => {
                gameState.creature.stats[statName] = parseInt(e.target.value);
                updateCreatureUI();
                updateCreatureAnimation();
            });
        };

        setupSlider(ui.debugHungerSlider, 'fome');
        setupSlider(ui.debugHappinessSlider, 'felicidade');
        setupSlider(ui.debugCleanlinessSlider, 'sujeira');
        setupSlider(ui.debugHealthSlider, 'saude');
    }

    function updateDebugSliders() {
        const { fome, felicidade, sujeira, saude } = gameState.creature.stats;
        ui.debugHungerSlider.value = fome;
        ui.debugHappinessSlider.value = felicidade;
        ui.debugCleanlinessSlider.value = sujeira;
        ui.debugHealthSlider.value = saude;
    }

    init();
});