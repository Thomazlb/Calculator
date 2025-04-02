/**
 * Classe représentant une Ligne (1D)
 */
class Line {
    constructor(scene, length = 2) {
        this.scene = scene;
        this.length = length;
        this.object = null;
        this.pointSize = 0.08;
        this.dimension = 1;
        this.materials = MaterialManager.getMaterialsForDimension(this.dimension);
        this.create();
    }
    
    create() {
        // Groupe pour contenir la ligne et ses extrémités
        this.object = new THREE.Group();
        
        // Ligne
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-this.length/2, 0, 0),
            new THREE.Vector3(this.length/2, 0, 0)
        ]);
        const line = new THREE.Line(lineGeometry, this.materials.line);
        this.object.add(line);
        
        // Points aux extrémités
        const pointGeometry = new THREE.SphereGeometry(this.pointSize, 24, 24);
        
        const point1 = new THREE.Mesh(pointGeometry, this.materials.point);
        point1.position.set(-this.length/2, 0, 0);
        point1.castShadow = true;
        
        const point2 = new THREE.Mesh(pointGeometry, this.materials.point);
        point2.position.set(this.length/2, 0, 0);
        point2.castShadow = true;
        
        this.object.add(point1);
        this.object.add(point2);
        
        this.scene.add(this.object);
    }
    
    update(time) {
        if (this.object) {
            // Rotation simple pour mieux visualiser
            this.object.rotation.y = time * 0.5;
        }
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
            this.object.children.forEach(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            this.scene.remove(this.object);
            this.object = null;
        }
    }
    
    getDescription() {
        return "La ligne (1D) est construite à partir de deux points reliés. Elle a une longueur, mais pas de largeur ni de profondeur.";
    }
}
