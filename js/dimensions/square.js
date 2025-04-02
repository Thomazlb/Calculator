/**
 * Classe représentant un Carré (2D)
 */
class Square {
    constructor(scene, size = 1.5) {
        this.scene = scene;
        this.size = size;
        this.object = null;
        this.pointSize = 0.06;
        this.dimension = 2;
        this.materials = MaterialManager.getMaterialsForDimension(this.dimension);
        this.create();
    }
    
    create() {
        // Groupe pour contenir le carré
        this.object = new THREE.Group();
        
        // Sommets du carré
        const halfSize = this.size / 2;
        const vertices = [
            new THREE.Vector3(-halfSize, -halfSize, 0),
            new THREE.Vector3(halfSize, -halfSize, 0),
            new THREE.Vector3(halfSize, halfSize, 0),
            new THREE.Vector3(-halfSize, halfSize, 0)
        ];
        
        // Création de la face (surface)
        const faceGeometry = new THREE.BufferGeometry();
        faceGeometry.setFromPoints([
            vertices[0], vertices[1], vertices[2],
            vertices[0], vertices[2], vertices[3]
        ]);
        const face = new THREE.Mesh(faceGeometry, this.materials.face);
        face.castShadow = true;
        face.receiveShadow = true;
        this.object.add(face);
        
        // Création des arêtes
        const edges = [
            [0, 1], [1, 2], [2, 3], [3, 0]
        ];
        
        edges.forEach(edge => {
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                vertices[edge[0]], vertices[edge[1]]
            ]);
            const line = new THREE.Line(lineGeometry, this.materials.line);
            this.object.add(line);
        });
        
        // Création des sommets
        const pointGeometry = new THREE.SphereGeometry(this.pointSize, 16, 16);
        vertices.forEach(vertex => {
            const point = new THREE.Mesh(pointGeometry, this.materials.point);
            point.position.copy(vertex);
            point.castShadow = true;
            this.object.add(point);
        });
        
        this.scene.add(this.object);
    }
    
    update(time) {
        if (this.object) {
            // Rotation uniquement sur l'axe Y
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
        return "Le carré (2D) est construit à partir de deux segments reliés orthogonalement. Il possède une longueur et une largeur, mais pas de profondeur.";
    }
}
