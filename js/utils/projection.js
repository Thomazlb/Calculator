/**
 * Utilitaires pour la projection d'objets de dimensions supérieures vers des dimensions inférieures
 */

class ProjectionUtils {
    /**
     * Projette des coordonnées 4D vers 3D
     * @param {Array} vertices4D - Tableau de vertices 4D [x, y, z, w]
     * @param {Number} w - Distance de projection dans la 4ème dimension
     * @returns {Array} Vertices 3D projetés
     */
    static project4DTo3D(vertices4D, w = 2) {
        return vertices4D.map(vertex => {
            // Facteur de projection basé sur la distance en W
            const factor = 1 / (w - vertex[3]);
            
            // Projection perspective
            return [
                vertex[0] * factor,
                vertex[1] * factor,
                vertex[2] * factor
            ];
        });
    }
    
    /**
     * Projette des coordonnées 5D vers 4D
     * @param {Array} vertices5D - Tableau de vertices 5D [x, y, z, w, v]
     * @param {Number} v - Distance de projection dans la 5ème dimension
     * @returns {Array} Vertices 4D projetés
     */
    static project5DTo4D(vertices5D, v = 2) {
        return vertices5D.map(vertex => {
            // Facteur de projection basé sur la distance en V
            const factor = 1 / (v - vertex[4]);
            
            // Projection perspective
            return [
                vertex[0] * factor,
                vertex[1] * factor,
                vertex[2] * factor,
                vertex[3] * factor
            ];
        });
    }
    
    /**
     * Génère les vertices d'un hypercube à n dimensions
     * @param {Number} dimension - Dimension de l'hypercube (1-5)
     * @param {Number} size - Taille de l'hypercube
     * @returns {Array} Vertices de l'hypercube
     */
    static generateHypercubeVertices(dimension, size = 1) {
        if (dimension < 0 || dimension > 5) {
            throw new Error("Dimension doit être entre 0 et 5");
        }
        
        // Cas spécial pour le point (0D)
        if (dimension === 0) {
            return [[0, 0, 0]];
        }

        // Pour les dimensions 1 à 5, on génère tous les sommets
        const vertices = [];
        const halfSize = size / 2;
        
        // Générer toutes les combinaisons de coordonnées (-1/2 ou 1/2 pour chaque dimension)
        for (let i = 0; i < Math.pow(2, dimension); i++) {
            const vertex = Array(dimension).fill().map((_, dim) => {
                // Pour chaque bit dans i, déterminer la coordonnée
                return ((i >> dim) & 1) ? halfSize : -halfSize;
            });
            
            // Remplir avec des zéros pour avoir des coordonnées 3D
            while (vertex.length < 3) {
                vertex.push(0);
            }
            
            vertices.push(vertex);
        }
        
        return vertices;
    }
    
    /**
     * Génère les arêtes d'un hypercube
     * @param {Number} dimension - Dimension de l'hypercube
     * @returns {Array} Paires d'indices de vertices représentant les arêtes
     */
    static generateHypercubeEdges(dimension) {
        if (dimension === 0) return [];
        if (dimension === 1) return [[0, 1]];
        
        const numVertices = Math.pow(2, dimension);
        const edges = [];
        
        // Pour chaque sommet
        for (let i = 0; i < numVertices; i++) {
            // Pour chaque dimension
            for (let d = 0; d < dimension; d++) {
                // Le sommet connecté diffère uniquement dans la dimension d
                const j = i ^ (1 << d); // XOR avec 2^d pour changer uniquement le bit d
                
                // Éviter les doublons (i,j) et (j,i)
                if (i < j) {
                    edges.push([i, j]);
                }
            }
        }
        
        return edges;
    }
    
    /**
     * Fonction de rotation dans un plan spécifique d'un espace à n dimensions
     * @param {Array} vertices - Tableau de vertices
     * @param {Number} dim1 - Premier indice du plan de rotation (ex: 0 pour x)
     * @param {Number} dim2 - Second indice du plan de rotation (ex: 3 pour w)
     * @param {Number} angle - Angle de rotation en radians
     * @returns {Array} Vertices après rotation
     */
    static rotateInPlane(vertices, dim1, dim2, angle) {
        return vertices.map(vertex => {
            const result = [...vertex];
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            
            const v1 = vertex[dim1];
            const v2 = vertex[dim2];
            
            result[dim1] = v1 * cos - v2 * sin;
            result[dim2] = v1 * sin + v2 * cos;
            
            return result;
        });
    }
}
