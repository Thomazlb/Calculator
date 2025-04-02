/**
 * Script principal de l'application
 */
class DimensionalApp {
    constructor() {
        this.currentDimension = 0;
        this.previousDimension = null;
        this.animationSpeed = 0.5;  // Vitesse d'animation (transformations 4D, 5D)
        this.rotationSpeed = 0.5;   // Vitesse de rotation 3D
        this.animationPaused = false;
        this.clock = new THREE.Clock();
        this.elapsedTime = 0;
        this.objects = {};
        this.isMobile = this.detectMobile();
        
        this.initScene();
        this.initLights();
        this.initObjects();
        this.initControls();
        this.initEventListeners();
        
        // Amélioration du rendu
        this.renderer.shadowMap.enabled = !this.isMobile; // Désactiver les ombres sur mobile
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Démarrer l'animation
        this.animate();
        
        console.log(`Application initialisée (${this.isMobile ? 'mobile' : 'desktop'})`);
    }
    
    detectMobile() {
        return (
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            window.innerWidth <= 768
        );
    }
    
    initScene() {
        // Conteneur
        this.container = document.getElementById('scene-container');
        if (!this.container) {
            console.error("Conteneur de scène introuvable!");
            return;
        }
        
        // Scene avec fond blanc pur
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffffff);
        
        // Ajuster plus finement la configuration de la caméra selon le dispositif
        const smallScreen = window.innerWidth <= 600;
        const fov = this.isMobile ? (smallScreen ? 90 : 85) : 75;
        this.camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, this.isMobile ? (smallScreen ? 4 : 3.5) : 2.5);
        
        // Renderer optimisé avec meilleur pixel ratio pour éviter la pixellisation
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, // Toujours activer l'antialiasing pour un rendu plus net
            alpha: true,
            powerPreference: this.isMobile ? 'low-power' : 'high-performance'
        });
        
        // Calibrer le pixel ratio pour un bon équilibre qualité/performance
        const idealPixelRatio = this.isMobile ? 
            Math.min(window.devicePixelRatio, 2) : // Limiter à 2x sur mobile pour la performance
            window.devicePixelRatio;              // Utiliser le pixel ratio natif sur desktop
        
        this.renderer.setPixelRatio(idealPixelRatio);
        this.updateRendererSize();
        this.renderer.setClearColor(0xffffff, 1);
        this.container.appendChild(this.renderer.domElement);
        
        // Contrôles orbitaux adaptés au type d'appareil
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.rotateSpeed = this.isMobile ? 0.7 : 0.5; // Plus sensible sur mobile
        this.controls.zoomSpeed = this.isMobile ? 1.0 : 0.7;
        this.controls.minDistance = 1.0;
        this.controls.maxDistance = 15;
        this.controls.enabled = true; // Activer les contrôles par défaut
        
        // Gestion du redimensionnement
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        
        // Écouteurs d'événements pour les interactions tactiles
        if (this.isMobile) {
            this.initTouchControls();
        }
    }
    
    updateRendererSize() {
        if (!this.renderer || !this.container) return;
        
        const previewPanel = document.getElementById('preview-panel');
        const isExpanded = previewPanel && previewPanel.classList.contains('expanded');
        
        // Calculer les dimensions idéales du renderer
        const rect = this.container.getBoundingClientRect();
        
        if (isExpanded) {
            // Mode plein écran - utiliser les dimensions de la fenêtre
            this.renderer.setSize(window.innerWidth, window.innerHeight, false);
            this.camera.aspect = window.innerWidth / window.innerHeight;
        } else {
            // Mode normal - utiliser des dimensions proportionnelles pour un rendu optimal
            const size = Math.min(rect.width, rect.height);
            
            // Important: false comme troisième paramètre pour éviter de modifier le style CSS
            this.renderer.setSize(size, size, false);
            this.camera.aspect = 1; // Forcer un aspect carré pour éviter la distorsion
        }
        
        // Mettre à jour la matrice de projection après avoir changé l'aspect ratio
        this.camera.updateProjectionMatrix();
    }
    
    initTouchControls() {
        // Utiliser Hammer.js pour les gestes tactiles
        if (typeof Hammer !== 'undefined') {
            const hammertime = new Hammer(this.container);
            hammertime.get('pinch').set({ enable: true });
            hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });
            
            // Double tap pour réinitialiser la vue
            hammertime.on('doubletap', () => {
                this.resetCamera();
            });
            
            console.log("Contrôles tactiles initialisés");
        } else {
            console.warn("Hammer.js non chargé, fonctionnalités tactiles limitées");
        }
    }
    
    resetCamera() {
        this.camera.position.set(0, 0, this.isMobile ? 3.5 : 2.5);
        this.camera.lookAt(0, 0, 0);
        this.controls.reset();
    }
    
    initLights() {
        // Lumière globale - plus forte sur mobile pour meilleure visibilité
        const ambientLight = new THREE.AmbientLight(0xffffff, this.isMobile ? 0.9 : 0.8);
        this.scene.add(ambientLight);
        
        // Lumière directionnelle simplifiée sur mobile
        const directionalLight = new THREE.DirectionalLight(0xffffff, this.isMobile ? 0.6 : 0.7);
        directionalLight.position.set(1, 2, 4);
        this.scene.add(directionalLight);
        
        // Ne pas ajouter trop de lumières sur mobile
        if (!this.isMobile) {
            const secondaryLight = new THREE.DirectionalLight(0xffffff, 0.3);
            secondaryLight.position.set(-1, -1, 2);
            this.scene.add(secondaryLight);
        }
        
        console.log("Lumières initialisées");
    }
    
    initObjects() {
        try {
            // Adapter la taille des objets selon le dispositif
            const sizeFactor = this.isMobile ? 1.2 : 1.0;
            
            // Créer tous les objets de dimension
            this.objects = {
                0: new Point(this.scene, 0.3 * sizeFactor),
                1: new Line(this.scene, 2.5 * sizeFactor),
                2: new Square(this.scene, 2.0 * sizeFactor),
                3: new Cube(this.scene, 1.8 * sizeFactor),
                4: new Tesseract(this.scene, 1.2 * sizeFactor),
                5: new Penteract(this.scene, 1.0 * sizeFactor)
            };
            
            // Cacher tous les objets sauf le point (0D)
            Object.keys(this.objects).forEach(dim => {
                if (parseInt(dim) !== this.currentDimension) {
                    this.objects[dim].hide();
                }
            });
            
        } catch(e) {
            console.error("Erreur lors de l'initialisation des objets:", e);
        }
    }
    
    initControls() {
        // Slider de vitesse d'animation (pour les transformations 4D/5D)
        this.speedSlider = document.getElementById('rotation-speed');
        
        // Fonction pour mettre à jour la couleur du gradient en fonction de la valeur
        const updateSliderBackground = (slider, value) => {
            const percent = value + '%';
            slider.style.background = `linear-gradient(90deg, var(--text-color) 0%, var(--text-color) ${percent}, rgba(22, 33, 62, 0.1) ${percent})`;
        };
        
        // Initialiser la couleur du gradient du premier slider
        updateSliderBackground(this.speedSlider, this.speedSlider.value);
        
        // Mettre à jour la couleur du gradient et la vitesse d'animation
        this.speedSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            updateSliderBackground(e.target, value);
            this.animationSpeed = value / 50;
            
            // Effet élastique lors du déplacement du slider
            const thumb = this.speedSlider.querySelector('::-webkit-slider-thumb');
            if (thumb) {
                thumb.style.transform = 'scale(1.3)';
                setTimeout(() => {
                    thumb.style.transform = '';
                }, 200);
            }
        });
        
        // Nouveau slider pour la vitesse de rotation 3D
        this.rotationSlider = document.getElementById('rotation-speed-3d');
        
        // Initialiser la couleur du gradient du second slider
        updateSliderBackground(this.rotationSlider, this.rotationSlider.value);
        
        // Écouter les changements sur le slider de rotation
        this.rotationSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            updateSliderBackground(e.target, value);
            this.rotationSpeed = value / 50;
            
            // Effet élastique pour ce slider aussi
            const thumb = this.rotationSlider.querySelector('::-webkit-slider-thumb');
            if (thumb) {
                thumb.style.transform = 'scale(1.3)';
                setTimeout(() => {
                    thumb.style.transform = '';
                }, 200);
            }
        });
        
        // Effet élastique agréable au relâchement des sliders
        const addBounceEffect = (slider) => {
            slider.addEventListener('change', () => {
                // Animation légère de rebond
                slider.animate([
                    { transform: 'scaleY(1.1)' },
                    { transform: 'scaleY(0.95)' },
                    { transform: 'scaleY(1.02)' },
                    { transform: 'scaleY(1)' }
                ], { 
                    duration: 400,
                    easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                });
            });
        };
        
        addBounceEffect(this.speedSlider);
        addBounceEffect(this.rotationSlider);
        
        // Bouton de pause/lecture
        this.toggleAnimationBtn = document.getElementById('toggle-animation');
        this.toggleAnimationBtn.addEventListener('click', () => {
            this.animationPaused = !this.animationPaused;
            this.toggleAnimationBtn.textContent = this.animationPaused ? 'Lecture' : 'Pause';
        });
        
        // Bouton de réinitialisation de la vue
        this.resetViewBtn = document.getElementById('reset-view');
        this.resetViewBtn.addEventListener('click', () => {
            this.controls.reset();
            this.camera.position.set(0, 0, 5);
            this.controls.update();
        });
    }
    
    initEventListeners() {
        // Écouter les clics sur les boutons de dimension
        const dimensionBtns = document.querySelectorAll('.dimension-btn');
        dimensionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const newDimension = parseInt(e.target.getAttribute('data-dimension'));
                if (newDimension !== this.currentDimension) {
                    this.changeDimension(newDimension);
                }
            });
        });
        
        // Sélectionner le bouton de la dimension actuelle
        this.updateActiveDimensionButton();
        
        // Gestion de l'expansion/réduction du panneau d'information avec animation améliorée
        const infoPanel = document.getElementById('info-panel');
        const infoOverlay = document.getElementById('info-overlay');
        
        if (infoPanel) {
            // Gestion du défilement sans déclencher le clic
            infoPanel.addEventListener('wheel', (e) => {
                const canScroll = infoPanel.scrollHeight > infoPanel.clientHeight;
                
                if (canScroll && !infoPanel.classList.contains('expanded')) {
                    // Empêcher l'événement de défilement de se propager
                    e.stopPropagation();
                    
                    // Ajouter temporairement la classe scrollable
                    infoPanel.classList.add('scrollable');
                    
                    // Retirer la classe après un court délai
                    clearTimeout(infoPanel.scrollTimeout);
                    infoPanel.scrollTimeout = setTimeout(() => {
                        infoPanel.classList.remove('scrollable');
                    }, 1000);
                }
            });
            
            // Clic sur le panneau pour l'agrandir avec animation fluide
            infoPanel.addEventListener('click', (e) => {
                // Ne pas déclencher si on est en train de faire défiler
                if (infoPanel.classList.contains('scrollable')) {
                    return;
                }
                
                if (!infoPanel.classList.contains('expanded') && !infoPanel.classList.contains('animating')) {
                    // Marquer le panneau comme étant en animation pour éviter les doubles clics
                    infoPanel.classList.add('animating');
                    
                    // Stocker la position originale comme variables CSS pour l'animation
                    const rect = infoPanel.getBoundingClientRect();
                    
                    // Avant tout, on sauvegarde les valeurs de style initiales
                    const originalStyle = {
                        position: infoPanel.style.position || '',
                        top: infoPanel.style.top || '',
                        left: infoPanel.style.left || '',
                        width: infoPanel.style.width || '',
                        height: infoPanel.style.height || '',
                        transform: infoPanel.style.transform || '',
                        zIndex: infoPanel.style.zIndex || ''
                    };
                    
                    // Enregistrer la position initiale pour une restauration précise
                    infoPanel.dataset.originalStyle = JSON.stringify(originalStyle);
                    
                    // Fixer la position du panneau précisément où il est avant l'animation
                    infoPanel.style.position = 'fixed';
                    infoPanel.style.top = rect.top + 'px';
                    infoPanel.style.left = rect.left + 'px';
                    infoPanel.style.width = rect.width + 'px';
                    infoPanel.style.height = rect.height + 'px';
                    infoPanel.style.margin = '0';
                    infoPanel.style.zIndex = '2000';
                    
                    // On force un reflow pour que les changements soient appliqués immédiatement
                    void infoPanel.offsetWidth;
                    
                    // Afficher l'overlay
                    infoOverlay.classList.add('visible');
                    
                    // Appliquer la transformation vers le centre avec une transition CSS
                    requestAnimationFrame(() => {
                        infoPanel.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                        infoPanel.style.top = '50%';
                        infoPanel.style.left = '50%';
                        infoPanel.style.width = '80vw';
                        infoPanel.style.maxWidth = '800px';
                        infoPanel.style.height = 'auto';
                        infoPanel.style.maxHeight = '80vh';
                        infoPanel.style.transform = 'translate(-50%, -50%)';
                        infoPanel.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                        infoPanel.style.padding = '20px';
                        
                        infoPanel.classList.add('expanded');
                        
                        // Retirer la marque d'animation après la transition
                        setTimeout(() => {
                            infoPanel.classList.remove('animating');
                        }, 600);
                    });
                }
            });
            
            // Réduire le panneau avec animation fluide
            const collapseInfoPanel = () => {
                if (infoPanel.classList.contains('expanded') && !infoPanel.classList.contains('animating')) {
                    // Marquer le panneau comme en animation
                    infoPanel.classList.add('animating');
                    
                    // Ajouter l'effet de fondu à l'overlay
                    infoOverlay.classList.add('fading');
                    
                    // Récupérer le style original
                    let originalStyle = {};
                    try {
                        if (infoPanel.dataset.originalStyle) {
                            originalStyle = JSON.parse(infoPanel.dataset.originalStyle);
                        }
                    } catch (e) {
                        console.error("Erreur de parsing du style original:", e);
                    }
                    
                    // Obtenir la position actuelle dans le DOM
                    const panelRect = infoPanel.getBoundingClientRect();
                    
                    // Stocker la position et taille du panneau étendu avant de le réduire
                    const expandedRect = {
                        width: panelRect.width,
                        height: panelRect.height
                    };
                    
                    // Calculer la position cible (position originale) en fonction des attributs de grid
                    // Obtenir l'élément parent et sa position
                    const panelParent = infoPanel.parentElement;
                    const gridComputedStyle = window.getComputedStyle(infoPanel);
                    
                    // Trouver l'élément de grille correspondant à la position originale
                    const gridColumn = gridComputedStyle.gridColumnStart;
                    const gridRow = gridComputedStyle.gridRowStart;
                    
                    // Mesurer la position dans le document après calcul de layout
                    infoPanel.style.position = "relative";
                    infoPanel.style.removeProperty("top");
                    infoPanel.style.removeProperty("left");
                    infoPanel.style.removeProperty("width");
                    infoPanel.style.removeProperty("height");
                    infoPanel.style.removeProperty("transform");
                    
                    // Forcer un reflow pour obtenir la future position
                    document.body.offsetHeight;
                    
                    // Calculer les coordonnées de destination
                    const destinationRect = infoPanel.getBoundingClientRect();
                    
                    // Rétablir les propriétés actuelles
                    infoPanel.style.position = "fixed";
                    infoPanel.style.top = "50%";
                    infoPanel.style.left = "50%";
                    infoPanel.style.width = expandedRect.width + "px";
                    infoPanel.style.height = expandedRect.height + "px";
                    infoPanel.style.transform = "translate(-50%, -50%)";
                    
                    // Forcer un nouveau reflow
                    document.body.offsetHeight;
                    
                    // Animer vers la destination avec précision
                    requestAnimationFrame(() => {
                        infoPanel.style.transition = 'all 0.6s cubic-bezier(0.215, 0.61, 0.355, 1)';
                        infoPanel.style.top = destinationRect.top + "px";
                        infoPanel.style.left = destinationRect.left + "px";
                        infoPanel.style.width = destinationRect.width + "px";
                        infoPanel.style.height = destinationRect.height + "px";
                        infoPanel.style.transform = 'translate(0, 0)';
                        infoPanel.style.backgroundColor = '';
                        
                        infoPanel.classList.remove('expanded');
                        
                        // Nettoyer après l'animation
                        setTimeout(() => {
                            // Enlever l'overlay
                            infoOverlay.classList.remove('visible', 'fading');
                            
                            // Restaurer complètement les styles d'origine
                            infoPanel.style.position = '';
                            infoPanel.style.top = '';
                            infoPanel.style.left = '';
                            infoPanel.style.width = '';
                            infoPanel.style.height = '';
                            infoPanel.style.transform = '';
                            infoPanel.style.transition = '';
                            infoPanel.style.margin = '';
                            infoPanel.style.zIndex = '';
                            infoPanel.style.backgroundColor = '';
                            infoPanel.style.padding = '';
                            infoPanel.style.maxWidth = '';
                            infoPanel.style.maxHeight = '';
                            
                            // Retirer la marque d'animation
                            infoPanel.classList.remove('animating');
                        }, 600);
                    });
                }
            };
            
            // Clic sur l'overlay pour réduire le panneau
            infoOverlay.addEventListener('click', collapseInfoPanel);
            
            // Touche Escape pour réduire le panneau d'info
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && infoPanel.classList.contains('expanded')) {
                    collapseInfoPanel();
                }
            });
        }
        
        // Gestion de l'expansion/réduction du panneau de prévisualisation avec animation améliorée
        const previewPanel = document.getElementById('preview-panel');
        const expandButton = document.getElementById('expand-toggle');
        
        if (previewPanel && expandButton) {
            const toggleExpansion = (event) => {
                // Éviter la propagation pour ne pas interférer avec d'autres contrôles
                event.stopPropagation();
                
                // Arrêter temporairement l'animation pour éviter les saccades
                const wasPaused = this.animationPaused;
                this.animationPaused = true;
                
                if (!previewPanel.classList.contains('expanded')) {
                    // Expansion - ajout de la classe pour déclencher l'animation CSS
                    previewPanel.classList.add('expanded');
                    
                    // Timer pour permettre à l'animation de se dérouler avant de redimensionner
                    setTimeout(() => {
                        this.updateRendererSize();
                        this.animationPaused = wasPaused;
                        this.renderer.render(this.scene, this.camera);
                    }, 100); // Court délai pour permettre au DOM de s'actualiser
                    
                } else {
                    // Réduction - ajouter la classe d'animation de sortie
                    previewPanel.classList.add('collapsing');
                    
                    // Timer pour attendre la fin de l'animation avant de retirer la classe expanded
                    setTimeout(() => {
                        previewPanel.classList.remove('expanded');
                        
                        // Mettre à jour après que la transition ait commencé
                        setTimeout(() => {
                            this.updateRendererSize();
                            this.resetCamera();
                            this.animationPaused = wasPaused;
                            this.renderer.render(this.scene, this.camera);
                            
                            // Nettoyer les classes d'animation
                            setTimeout(() => {
                                previewPanel.classList.remove('collapsing');
                            }, 300);
                        }, 300);
                    }, 100);
                }
            };
            
            expandButton.addEventListener('click', toggleExpansion);
            
            // Permettre aussi de cliquer n'importe où dans le panneau pour l'agrandir
            // sauf s'il est déjà agrandi
            previewPanel.addEventListener('click', (event) => {
                if (!previewPanel.classList.contains('expanded') && 
                    (event.target === previewPanel || 
                     event.target === document.getElementById('scene-container') ||
                     event.target.parentNode === document.getElementById('scene-container'))) {
                    toggleExpansion(event);
                }
            });
            
            // Permettre d'utiliser Escape pour réduire le panneau
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && previewPanel.classList.contains('expanded')) {
                    toggleExpansion(event);
                }
            });
            
            // Supporter les gestes tactiles (pinch to zoom out)
            if (typeof Hammer !== 'undefined' && this.isMobile) {
                const hammer = new Hammer(previewPanel);
                hammer.get('pinch').set({ enable: true });
                
                hammer.on('pinchout', (e) => {
                    if (!previewPanel.classList.contains('expanded') && e.scale > 1.5) {
                        toggleExpansion({stopPropagation: () => {}});
                    }
                });
                
                hammer.on('pinchin', (e) => {
                    if (previewPanel.classList.contains('expanded') && e.scale < 0.6) {
                        toggleExpansion({stopPropagation: () => {}});
                    }
                });
            }
        }
    }
    
    updateActiveDimensionButton() {
        // Supprimer la classe active de tous les boutons
        document.querySelectorAll('.dimension-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Ajouter la classe active au bouton de la dimension actuelle
        const activeBtn = document.querySelector(`.dimension-btn[data-dimension="${this.currentDimension}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }
    
    changeDimension(newDimension) {
        if (newDimension < 0 || newDimension > 5) return;
        
        console.log(`Changement de dimension: ${this.currentDimension} -> ${newDimension}`);
        
        // Cacher l'objet actuel
        if (this.objects[this.currentDimension]) {
            this.objects[this.currentDimension].hide();
        }
        
        // Mettre à jour les dimensions
        this.previousDimension = this.currentDimension;
        this.currentDimension = newDimension;
        
        // Mise à jour du titre et de la description
        const title = document.getElementById('current-dimension-title');
        const description = document.getElementById('dimension-description');
        
        const titles = {
            0: "Point (0D)", 
            1: "Ligne (1D)", 
            2: "Carré (2D)", 
            3: "Cube (3D)", 
            4: "Tesseract (4D)", 
            5: "Penteract (5D)"
        };
        
        if (title) {
            title.textContent = titles[newDimension];
            console.log("Titre mis à jour:", title.textContent);
        }
        
        if (description && this.objects[newDimension]) {
            let texteDescription = this.objects[newDimension].getDescription();
            
            // Ajouter explication spéciale, mais plus concise sur mobile
            if (newDimension === 4) {
                const isMobileView = window.innerWidth <= 600;
                if (isMobileView) {
                    texteDescription += "\n\nNote: Utilisez les deux contrôles de vitesse pour observer pleinement la structure 4D: l'animation contrôle la rotation 4D et la rotation 3D change votre perspective.";
                } else {
                    texteDescription += "\n\nNote: Pour visualiser correctement le mouvement du tesseract, utilisez à la fois le contrôle de vitesse d'animation (qui contrôle la rotation 4D) et le contrôle de vitesse de rotation (qui contrôle la rotation 3D de la projection). Cette combinaison vous permet d'observer comment l'objet se déforme dans la 4e dimension tout en changeant votre point de vue dans notre espace 3D, offrant ainsi une compréhension plus complète de sa structure géométrique.";
                }
            }
            else if (newDimension === 5) {
                const isMobileView = window.innerWidth <= 600;
                if (isMobileView) {
                    texteDescription += "\n\nNote: La visualisation du penteract nécessite deux projections (5D→4D→3D). Les nuances de gris représentent la position dans les 4e et 5e dimensions.";
                } else {
                    texteDescription += "\n\nNote: La visualisation du penteract est particulièrement abstraite car elle nécessite deux projections successives (5D→4D→3D). Les différentes nuances de gris représentent la position des sommets dans les 4e et 5e dimensions. Pour explorer pleinement sa structure, combinez les deux contrôles de vitesse : l'animation pour voir les transformations dans la 5e dimension, et la rotation pour changer votre perspective 3D. Cette combinaison révèle progressivement la complexité de sa structure géométrique complète.";
                }
            }
            
            description.textContent = texteDescription;
            console.log("Description mise à jour");
        }
        
        // Mettre à jour le bouton actif
        this.updateActiveDimensionButton();
        
        // Afficher le nouvel objet
        if (this.objects[newDimension]) {
            this.objects[newDimension].show();
            console.log(`Objet ${newDimension}D affiché`);
        }
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        try {
            const delta = this.clock.getDelta();
            const elapsedTime = this.clock.elapsedTime;
            
            // Mettre à jour les contrôles avec damping pour fluidité
            if (this.controls) this.controls.update();
            
            // Mise à jour conditionnelle - n'anime que si nécessaire
            if (!this.animationPaused) {
                const currentObj = this.objects[this.currentDimension];
                if (currentObj) {
                    // Pour les dimensions 4D et 5D, utiliser TOUJOURS les deux vitesses
                    if (this.currentDimension >= 4) {
                        // Applique l'animation hyperdimensionnelle
                        currentObj.update(elapsedTime * this.animationSpeed);
                        
                        // Applique TOUJOURS la rotation 3D pour avoir un mouvement complet
                        if (typeof currentObj.rotate === 'function') {
                            currentObj.rotate(elapsedTime * this.rotationSpeed);
                        } 
                    } else {
                        // Pour les dimensions 0-3, utiliser simplement la vitesse de rotation
                        currentObj.update(elapsedTime * this.rotationSpeed);
                    }
                }
            }
            
            // Rendu de la scène avec throttling sur mobile pour économiser la batterie
            if (this.renderer && this.scene && this.camera) {
                // Sur mobile, limiter les FPS pour économiser la batterie
                if (this.isMobile && !this._lastRenderTime) {
                    this._lastRenderTime = 0;
                }
                
                const now = Date.now();
                if (!this.isMobile || now - this._lastRenderTime > 16) { // ~60fps desktop, ~30fps mobile
                    this.renderer.render(this.scene, this.camera);
                    this._lastRenderTime = now;
                }
            }
            
        } catch(e) {
            console.error("Erreur dans l'animation:", e);
        }
    }
    
    onWindowResize() {
        // Mettre à jour la détection mobile
        this.isMobile = this.detectMobile();
        
        // Adapter le renderer avec la nouvelle méthode
        this.updateRendererSize();
        
        // Ajuster le FOV et la position de la caméra pour les petits écrans
        const smallScreen = window.innerWidth <= 600;
        if (this.camera) {
            // FOV plus large sur mobile pour mieux voir l'objet
            this.camera.fov = this.isMobile ? (smallScreen ? 95 : 85) : 75;
            
            // Position de caméra optimisée pour chaque taille d'écran
            this.camera.position.z = this.isMobile ? 
                (smallScreen ? 3.8 : 3.3) : 
                (window.innerWidth <= 1024 ? 3.0 : 2.5);
                
            this.camera.updateProjectionMatrix();
        }
    }
}

// Initialiser l'application au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
    try {
        console.log("Initialisation de l'application...");
        const app = new DimensionalApp();
    } catch(e) {
        console.error("Erreur critique lors de l'initialisation:", e);
        alert("Erreur lors du chargement de l'application. Vérifiez la console pour plus de détails.");
    }
});

// Fonction pour prévenir les comportements de défilement indésirables sur iOS
document.addEventListener('touchmove', function(event) {
    if (event.scale !== 1) {
        event.preventDefault();
    }
}, { passive: false });

// Empêcher le zoom par double-tap sur iOS
document.addEventListener('touchend', function(event) {
    const now = Date.now();
    const timeSince = now - (this.lastTouch || now);
    
    if (timeSince < 300 && timeSince > 0) {
        event.preventDefault();
    }
    
    this.lastTouch = now;
}, { passive: false });