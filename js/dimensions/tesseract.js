/**
 * Classe représentant un Tesseract (Hypercube 4D)
 */
class Tesseract {
    constructor(scene, size = 1) {
        this.scene = scene;
        this.size = size;
        this.object = null;
        this.pointSize = 0.04;
        this.dimension = 4;
        this.materials = MaterialManager.getMaterialsForDimension(this.dimension);
        this.rotationXY = 0;
        this.rotationXZ = 0;
        this.rotationXW = 0;
        this.rotationYZ = 0;
        this.rotationYW = 0;
        this.rotationZW = 0;
        this.create();
    }
    
    create() {
        this.object = new THREE.Group();
        
        // Générer les vertices 4D
        this.vertices4D = [];
        for (let x = 0; x <= 1; x++) {
            for (let y = 0; y <= 1; y++) {
                for (let z = 0; z <= 1; z++) {
                    for (let w = 0; w <= 1; w++) {
                        this.vertices4D.push([
                            (x - 0.5) * this.size, 
                            (y - 0.5) * this.size, 
                            (z - 0.5) * this.size, 
                            (w - 0.5) * this.size
                        ]);
                    }
                }
            }
        }
        
        // Générer les arêtes 4D
        this.edges4D = [];
        for (let i = 0; i < 16; i++) {
            for (let j = i + 1; j < 16; j++) {
                // Vérifier si les vertices diffèrent d'une seule coordonnée
                const v1 = this.vertices4D[i];
                const v2 = this.vertices4D[j];
                let diffCount = 0;
                
                for (let k = 0; k < 4; k++) {
                    if (v1[k] !== v2[k]) diffCount++;
                }
                
                if (diffCount === 1) {
                    this.edges4D.push([i, j]);
                }
            }
        }
        
        // Projeter en 3D et créer la géométrie
        this.updateProjection();
        
        this.scene.add(this.object);
    }
    
    updateProjection() {
        if (!this.object) return;
        
        // Supprimer les anciens objets 3D
        while (this.object.children.length) {
            const child = this.object.children[0];
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
            this.object.remove(child);
        }
        
        // Appliquer les rotations 4D
        let rotatedVertices = [...this.vertices4D];
        
        // Rotations dans les 6 plans possibles d'un espace 4D
        rotatedVertices = ProjectionUtils.rotateInPlane(rotatedVertices, 0, 1, this.rotationXY);
        rotatedVertices = ProjectionUtils.rotateInPlane(rotatedVertices, 0, 2, this.rotationXZ);
        rotatedVertices = ProjectionUtils.rotateInPlane(rotatedVertices, 0, 3, this.rotationXW);
        rotatedVertices = ProjectionUtils.rotateInPlane(rotatedVertices, 1, 2, this.rotationYZ);
        rotatedVertices = ProjectionUtils.rotateInPlane(rotatedVertices, 1, 3, this.rotationYW);
        rotatedVertices = ProjectionUtils.rotateInPlane(rotatedVertices, 2, 3, this.rotationZW);
        
        // Projection perspective 4D → 3D mathématiquement correcte
        const projectedVertices = ProjectionUtils.project4DTo3D(rotatedVertices, 2);
        
        // Créer les arêtes 3D
        this.edges4D.forEach(edge => {
            const [i, j] = edge;
            const v1 = projectedVertices[i];
            const v2 = projectedVertices[j];
            
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(v1[0], v1[1], v1[2]),
                new THREE.Vector3(v2[0], v2[1], v2[2])
            ]);
            
            const line = new THREE.Line(lineGeometry, this.materials.line);
            this.object.add(line);
        });
        
        // Créer les sommets 3D avec des couleurs différentes
        const pointGeometry = new THREE.SphereGeometry(this.pointSize, 12, 12);
        
        projectedVertices.forEach((vertex, i) => {
            // Déterminer si le point appartient au "cube interne" ou "externe"
            // basé sur sa quatrième coordonnée
            const isInternalCube = this.vertices4D[i][3] < 0;
            
            // Couleur différente pour différencier les cubes
            const pointMaterial = isInternalCube 
                ? new THREE.MeshBasicMaterial({ color: 0x000000 })  // Noir pour le cube interne
                : new THREE.MeshBasicMaterial({ color: 0xffaa00 });  // Jaune/orange pour le cube externe
            
            const point = new THREE.Mesh(pointGeometry, pointMaterial);
            point.position.set(vertex[0], vertex[1], vertex[2]);
            point.castShadow = true;
            this.object.add(point);
        });
        
        // Scale global pour bien visualiser
        this.object.scale.set(1.5, 1.5, 1.5);
    }
    
    update(time) {
        if (this.object) {
            // Rotation uniquement sur l'axe principal XW
            this.rotationXY = 0;
            this.rotationXZ = 0;
            this.rotationXW = time * 0.5; // Garde uniquement la rotation 4D principale
            this.rotationYZ = 0;
            this.rotationYW = 0;
            this.rotationZW = 0;
            
            // Mettre à jour la projection
            this.updateProjection();
            
            // Rotation 3D uniquement sur l'axe Y
            this.object.rotation.y = time * 0.2;
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
        return "Le tesseract (4D) est un hypercube en 4 dimensions. Sa projection 3D est mathématiquement exacte mais visuellement déroutante car notre cerveau n'est pas conçu pour interpréter les dimensions supérieures. Les 16 sommets et 32 arêtes semblent former deux cubes imbriqués et connectés par des arêtes supplémentaires, mais cette représentation est une simplification. La déformation que vous observez lors de la rotation est comparable à l'ombre déformée qu'un cube projette sur une feuille plate (2D) lorsqu'il tourne dans l'espace 3D. Nous ne pouvons voir qu'une \"ombre\" partielle du véritable objet 4D, car notre perception est limitée à 3 dimensions.";
    }
}
