window.THREE = require('three');

export default class Cube extends THREE.Object3D {
  constructor(size) {
    super();
    this.colors = [0x8CB1BD, 0xB7F8FF, 0x17D2FF, 0xFFFFFF];

    this.geom = new THREE.BoxGeometry(size, size, size);
    
    this.uniforms = THREE.UniformsUtils.merge([
      THREE.UniformsLib[ "shadowmap" ]
      ]);

    this.material = new THREE.MeshBasicMaterial({
      vertexColors: THREE.FaceColors,
      wireframe: false
    });

    for (let i = 0; i < this.geom.faces.length; i++) {
      this.geom.faces[i].color.setHex(this.colors[~~(i / 4)]);
    }

    this.mesh = new THREE.Mesh(this.geom, this.material);

    this.mesh.castShadow = true;
    this.mesh.receiveShadow = false;

    this.add(this.mesh);
  }

}