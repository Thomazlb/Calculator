/**
 * Classe utilitaire pour gérer les matériaux des objets géométriques
 */
class MaterialManager {
    /**
     * Crée un ensemble de matériaux pour une dimension spécifique
     * @param {Number} dimension - Dimension de l'objet (0-5)
     * @returns {Object} Matériaux pour les points, lignes et faces
     */
    static getMaterialsForDimension(dimension) {
        // Noir pur pour tous les éléments
        const color = 0x000000;
        
        // Matériau pour les sommets (points) - noir solide
        const pointMaterial = new THREE.MeshBasicMaterial({
            color: color
        });
        
        // Matériau pour les arêtes (lignes) - noir épais
        const lineMaterial = new THREE.LineBasicMaterial({
            color: color,
            linewidth: 2 // Plus épais pour meilleure visibilité
        });
        
        // Matériau pour les faces - noir transparent
        const faceMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        
        return {
            point: pointMaterial,
            line: lineMaterial,
            face: faceMaterial
        };
    }
    
    /**
     * Crée un matériau pour les effets de transition
     */
    static getTransitionMaterials(fromDim, toDim) {
        // Utiliser simplement le matériau de la destination
        const materials = this.getMaterialsForDimension(toDim);
        
        return {
            point: materials.point.clone(),
            line: materials.line.clone(),
            face: materials.face.clone()
        };
    }
}
