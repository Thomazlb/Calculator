/**
 * Version simplifiée du gestionnaire de transitions entre dimensions
 */
class TransitionManager {
    constructor(scene) {
        this.scene = scene;
        this.object = new THREE.Group();
        this.scene.add(this.object);
        this.object.visible = false;
    }
    
    /**
     * Configure une transition entre deux dimensions
     */
    setupTransition(fromDim, toDim) {
        console.log(`Configuration de la transition de ${fromDim}D à ${toDim}D`);
        this.fromDimension = fromDim;
        this.toDimension = toDim;
        
        // Version simplifiée: n'utilise pas de transition complexe
        // Juste un objet temporaire
        this.clearTransition();
        
        // Sphère de transition simple
        const geometry = new THREE.SphereGeometry(0.3, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const sphere = new THREE.Mesh(geometry, material);
        this.object.add(sphere);
        
        this.transitionSphere = sphere;
    }
    
    /**
     * Nettoie les objets de transition
     */
    clearTransition() {
        while (this.object.children.length > 0) {
            const child = this.object.children[0];
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
            this.object.remove(child);
        }
    }
    
    /**
     * Montre l'objet de transition
     */
    show() {
        if (this.object) {
            this.object.visible = true;
        }
    }
    
    /**
     * Cache l'objet de transition
     */
    hide() {
        if (this.object) {
            this.object.visible = false;
        }
    }
    
    /**
     * Met à jour l'animation de transition
     */
    update(progress) {
        if (this.transitionSphere) {
            // Animation simple: la sphère pulse
            const scale = 1 + 0.5 * Math.sin(progress * Math.PI);
            this.transitionSphere.scale.set(scale, scale, scale);
        }
    }
}
