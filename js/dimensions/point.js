/**
 * Classe représentant un Point (0D)
 */
class Point {
    constructor(scene, size = 0.3) { // Taille augmentée pour meilleure visibilité
        this.scene = scene;
        this.size = size;
        this.object = null;
        this.dimension = 0;
        this.materials = MaterialManager.getMaterialsForDimension(this.dimension);
        this.create();
    }
    
    create() {
        // Création d'une sphère pour représenter un point - plus grande
        const geometry = new THREE.SphereGeometry(this.size, 32, 32);
        
        // Matériau simple noir sans effet de glow
        const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.object = new THREE.Mesh(geometry, material);
        
        // Repositionner le point pour qu'il soit visible
        this.object.position.set(0, 0, 0);
        
        this.scene.add(this.object);
        console.log("Point créé et ajouté à la scène");
    }
    
    update(time) {
        // Aucune animation nécessaire pour un point
        return;
    }
    
    show() {
        if (this.object) {
            this.object.visible = true;
        }
    }
    
    hide() {
        if (this.object) {
            this.object.visible = false;
        }
    }
    
    dispose() {
        if (this.object) {
            if (this.object.geometry) {
                this.object.geometry.dispose();
            }
            if (this.object.material) {
                this.object.material.dispose();
            }
            this.scene.remove(this.object);
            this.object = null;
        }
    }
    
    getDescription() {
        return "Le point n'a pas d'étendue, ni longueur, ni largeur, ni profondeur. C'est le concept le plus fondamental en géométrie.";
    }
}
