/**
 * Script principal de l'application
 */
class DimensionalApp {
    constructor() {
        this.currentDimension = 0;
        this.previousDimension = null;
        this.animationSpeed = 0.5;
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
        
        // Ajuster la configuration de la caméra selon le dispositif
        const fov = this.isMobile ? 85 : 75; // FOV plus large sur mobile
        this.camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, this.isMobile ? 3.5 : 2.5); // Position plus éloignée sur mobile
        
        // Renderer optimisé selon le dispositif
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: !this.isMobile, // Désactiver l'antialiasing sur mobile pour la performance
            alpha: true,
            powerPreference: this.isMobile ? 'low-power' : 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(this.isMobile ? Math.min(window.devicePixelRatio, 1.5) : window.devicePixelRatio);
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
        // Slider de vitesse de rotation
        this.speedSlider = document.getElementById('rotation-speed');
        this.speedSlider.addEventListener('input', (e) => {
            this.animationSpeed = e.target.value / 50;
        });
        
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
        
        // Gestion de l'expansion/réduction du panneau d'information
        const toggleInfoBtn = document.querySelector('.toggle-info');
        const infoPanel = document.getElementById('info-panel');
        
        if (toggleInfoBtn && infoPanel) {
            toggleInfoBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                infoPanel.classList.toggle('expanded');
                
                // Mise à jour du tooltip
                toggleInfoBtn.title = infoPanel.classList.contains('expanded') 
                    ? "Afficher moins" 
                    : "Afficher plus";
            });
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
            description.textContent = this.objects[newDimension].getDescription();
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
            
            // Mettre à jour les contrôles
            if (this.controls) this.controls.update();
            
            // Mettre à jour l'objet actuel
            if (!this.animationPaused) {
                const currentObj = this.objects[this.currentDimension];
                if (currentObj) {
                    currentObj.update(elapsedTime * this.animationSpeed);
                }
            }
            
            // Rendu de la scène
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
            
        } catch(e) {
            console.error("Erreur dans l'animation:", e);
        }
    }
    
    onWindowResize() {
        // Mettre à jour la détection mobile
        this.isMobile = this.detectMobile();
        
        // Adapter la caméra
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        // Adapter le renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(this.isMobile ? Math.min(window.devicePixelRatio, 1.5) : window.devicePixelRatio);
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