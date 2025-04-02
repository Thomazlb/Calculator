/**
 * Classe représentant un Cube (3D)
 */
class Cube {
    constructor(scene, size = 1.3) {
        this.scene = scene;
        this.size = size;
        this.object = null;
        this.pointSize = 0.05;
        this.dimension = 3;
        this.materials = MaterialManager.getMaterialsForDimension(this.dimension);
        this.create();
    }
    
    create() {
        // Groupe pour contenir le cube
        this.object = new THREE.Group();
        
        // Création d'un wireframe cube
        const halfSize = this.size / 2;
        const vertices = [
            // Face avant
            new THREE.Vector3(-halfSize, -halfSize, halfSize),  // 0
            new THREE.Vector3(halfSize, -halfSize, halfSize),   // 1
            new THREE.Vector3(halfSize, halfSize, halfSize),    // 2
            new THREE.Vector3(-halfSize, halfSize, halfSize),   // 3
            // Face arrière
            new THREE.Vector3(-halfSize, -halfSize, -halfSize), // 4
            new THREE.Vector3(halfSize, -halfSize, -halfSize),  // 5
            new THREE.Vector3(halfSize, halfSize, -halfSize),   // 6
            new THREE.Vector3(-halfSize, halfSize, -halfSize)   // 7
        ];
        
        // Définir les arêtes (paires de sommets)
        const edges = [
            // Face avant
            [0, 1], [1, 2], [2, 3], [3, 0],
            // Face arrière
            [4, 5], [5, 6], [6, 7], [7, 4],
            // Connections entre faces
            [0, 4], [1, 5], [2, 6], [3, 7]
        ];
        
        // Définir les faces (groupes de 4 sommets)
        const faces = [
            [0, 1, 2, 3], // avant
            [5, 4, 7, 6], // arrière
            [4, 0, 3, 7], // gauche
            [1, 5, 6, 2], // droite
            [3, 2, 6, 7], // haut
            [0, 4, 5, 1]  // bas
        ];
        
        // Créer les faces (triangulées)
        faces.forEach(face => {
            const faceGeometry = new THREE.BufferGeometry();
            // Trianguler la face carrée en deux triangles
            faceGeometry.setFromPoints([
                vertices[face[0]], vertices[face[1]], vertices[face[2]],
                vertices[face[0]], vertices[face[2]], vertices[face[3]]
            ]);
            const faceMesh = new THREE.Mesh(faceGeometry, this.materials.face);
            faceMesh.castShadow = true;
            faceMesh.receiveShadow = true;
            this.object.add(faceMesh);
        });
        
        // Créer les arêtes
        edges.forEach(edge => {
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                vertices[edge[0]], vertices[edge[1]]
            ]);
            const line = new THREE.Line(lineGeometry, this.materials.line);
            this.object.add(line);
        });
        
        // Créer les sommets
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
            // Animation de rotation uniquement sur l'axe Y
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
        return "Le cube (3D) est construit à partir de deux carrés reliés dans une direction perpendiculaire aux deux premières (profondeur). Il possède une longueur, une largeur et une profondeur.";
    }
}
