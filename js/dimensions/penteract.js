/**
 * Classe représentant un Penteract (Hypercube 5D)
 */
class Penteract {
    constructor(scene, size = 0.8) {
        this.scene = scene;
        this.size = size;
        this.object = null;
        this.pointSize = 0.03;
        this.dimension = 5;
        this.materials = MaterialManager.getMaterialsForDimension(this.dimension);
        // Rotations dans les différents plans
        this.rotations = {
            xy: 0, xz: 0, xw: 0, xv: 0,
            yz: 0, yw: 0, yv: 0,
            zw: 0, zv: 0,
            wv: 0
        };
        this.create();
    }
    
    create() {
        this.object = new THREE.Group();
        
        // Générer les vertices 5D (32 vertices)
        this.vertices5D = [];
        for (let i = 0; i < 32; i++) {
            const vertex = [
                ((i & 1) ? 0.5 : -0.5) * this.size,       // x
                ((i & 2) ? 0.5 : -0.5) * this.size,       // y
                ((i & 4) ? 0.5 : -0.5) * this.size,       // z
                ((i & 8) ? 0.5 : -0.5) * this.size,       // w
                ((i & 16) ? 0.5 : -0.5) * this.size       // v
            ];
            this.vertices5D.push(vertex);
        }
        
        // Générer les arêtes 5D (80 arêtes)
        this.edges5D = [];
        for (let i = 0; i < 32; i++) {
            for (let dim = 0; dim < 5; dim++) {
                const mask = 1 << dim;
                const j = i ^ mask;  // Toggle bit dim
                if (i < j) {  // Éviter les doublons
                    this.edges5D.push([i, j]);
                }
            }
        }
        
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
        
        // Appliquer les rotations 5D
        let rotatedVertices = [...this.vertices5D];
        
        // Appliquer toutes les rotations possibles en 5D (10 plans de rotation)
        rotatedVertices = ProjectionUtils.rotateInPlane(rotatedVertices, 0, 1, this.rotations.xy);
        rotatedVertices = ProjectionUtils.rotateInPlane(rotatedVertices, 0, 2, this.rotations.xz);
        rotatedVertices = ProjectionUtils.rotateInPlane(rotatedVertices, 0, 3, this.rotations.xw);
        rotatedVertices = ProjectionUtils.rotateInPlane(rotatedVertices, 0, 4, this.rotations.xv);
        rotatedVertices = ProjectionUtils.rotateInPlane(rotatedVertices, 1, 2, this.rotations.yz);
        rotatedVertices = ProjectionUtils.rotateInPlane(rotatedVertices, 1, 3, this.rotations.yw);
        rotatedVertices = ProjectionUtils.rotateInPlane(rotatedVertices, 1, 4, this.rotations.yv);
        rotatedVertices = ProjectionUtils.rotateInPlane(rotatedVertices, 2, 3, this.rotations.zw);
        rotatedVertices = ProjectionUtils.rotateInPlane(rotatedVertices, 2, 4, this.rotations.zv);
        rotatedVertices = ProjectionUtils.rotateInPlane(rotatedVertices, 3, 4, this.rotations.wv);
        
        // Double projection: 5D -> 4D -> 3D
        const vertices4D = ProjectionUtils.project5DTo4D(rotatedVertices, 2);
        const vertices3D = ProjectionUtils.project4DTo3D(vertices4D, 2);
        
        // Créer les arêtes 3D avec différentes teintes basées sur les dimensions supérieures
        this.edges5D.forEach(edge => {
            const [i, j] = edge;
            const v1 = vertices3D[i];
            const v2 = vertices3D[j];
            
            // Déterminer la teinte en fonction des coordonnées 5D
            const w1 = this.vertices5D[i][3];
            const w2 = this.vertices5D[j][3];
            const v1Val = this.vertices5D[i][4]; 
            const v2Val = this.vertices5D[j][4];
            
            // Créer un dégradé de gris basé sur les dimensions W et V
            const averageW = (w1 + w2) / 2;
            const averageV = (v1Val + v2Val) / 2;
            const opacity = 0.5 + (averageW + 0.5) * 0.25 + (averageV + 0.5) * 0.25;
            
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(v1[0], v1[1], v1[2]),
                new THREE.Vector3(v2[0], v2[1], v2[2])
            ]);
            
            const lineColor = 0x000000; // Noir
            const lineMaterial = new THREE.LineBasicMaterial({ 
                color: lineColor,
                transparent: true,
                opacity: opacity
            });
            
            const line = new THREE.Line(lineGeometry, lineMaterial);
            this.object.add(line);
        });
        
        // Créer les sommets 3D avec différentes nuances selon leur position 5D
        const pointGeometry = new THREE.SphereGeometry(this.pointSize, 12, 12);
        
        vertices3D.forEach((vertex, i) => {
            // Calculer la teinte en fonction des coordonnées W et V
            const w = this.vertices5D[i][3];
            const v = this.vertices5D[i][4];
            
            // Utiliser des nuances de gris pour les points
            const darkness = 0.2 + (w + 0.5) * 0.3 + (v + 0.5) * 0.3;
            const color = new THREE.Color(darkness, darkness, darkness);
            
            const pointMaterial = new THREE.MeshBasicMaterial({
                color: color
            });
            
            const point = new THREE.Mesh(pointGeometry, pointMaterial);
            point.position.set(vertex[0], vertex[1], vertex[2]);
            point.castShadow = true;
            this.object.add(point);
        });
        
        // Scale global pour bien visualiser
        this.object.scale.set(2, 2, 2);
    }
    
    update(time) {
        if (this.object) {
            // Mise à jour des rotations (uniquement sur un axe principal)
            this.rotations.xy = 0;
            this.rotations.xz = 0;
            this.rotations.xw = 0;
            this.rotations.xv = time * 0.2; // Garder uniquement la rotation 5D principale
            this.rotations.yz = 0;
            this.rotations.yw = 0;
            this.rotations.yv = 0;
            this.rotations.zw = 0;
            this.rotations.zv = 0;
            this.rotations.wv = 0;
            
            // Mettre à jour la projection
            this.updateProjection();
            
            // Rotation 3D uniquement sur l'axe Y
            this.object.rotation.y = time * 0.1;
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
        return "Le penteract (5D) est construit à partir de deux tesseracts reliés dans une 5e dimension perpendiculaire aux quatre premières. Il possède 32 sommets, 80 arêtes, 80 faces carrées, 40 cellules cubiques et 10 cellules tesseractiques. La visualisation est particulièrement abstraite car nous observons une double projection (5D→4D→3D) où les informations dimensionnelles sont fortement compressées. Les différentes teintes de gris représentent la position dans les 4e et 5e dimensions, créant une illusion de profondeur. L'enchevêtrement complexe que vous voyez n'est qu'un écho très limité de la structure complète, inaccessible à notre perception tridimensionnelle.";
    }
}
