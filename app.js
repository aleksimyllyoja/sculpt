var Settings = function() {
  this.brush_radius = 0.2;
};

window.onload = function() {
  settings = new Settings();
  gui = new dat.GUI();
  gui.add(settings, 'brush_radius', 0, 0.5);
};

function grow_face(face, scale) {
  var normalMatrixWorld = new THREE.Matrix3();
  mesh.geometry.computeVertexNormals();
  mesh.geometry.computeFaceNormals();

  var vertices = mesh.geometry.vertices;
  var matrixWorld = mesh.matrixWorld;

  normalMatrixWorld.getNormalMatrix(matrixWorld);

  var fv = new THREE.Vector3();
  fv.copy(face.normal).applyMatrix3(normalMatrixWorld).normalize();

  var indices = [face.a, face.b, face.c];

  for (var j = 0; j < 3; j ++) {
    vertices[ indices[ j ] ].applyMatrix4(matrixWorld);
    vertices[ indices[ j ] ].addScaledVector(
      fv,
      scale
    );
  }

  mesh.geometry.verticesNeedUpdate = true;
}

function grow_faces(scale) {

  var normalMatrixWorld = new THREE.Matrix3();
  mesh.geometry.computeVertexNormals();
  mesh.geometry.computeFaceNormals();

  var vertices = mesh.geometry.vertices;
  var matrixWorld = mesh.matrixWorld;

  normalMatrixWorld.getNormalMatrix(matrixWorld);

  for(var i=0; i<active_faces.length;i++) {
    var face = mesh.geometry.faces[active_faces[i]];
    var fv = new THREE.Vector3();
    fv.copy(face.normal).applyMatrix3(normalMatrixWorld).normalize();

    var indices = [face.a, face.b, face.c];

    for(var j = 0; j < 3; j++) {
      vertices[ indices[ j ] ].applyMatrix4(matrixWorld);
      vertices[ indices[ j ] ].addScaledVector(
        fv,
        scale
      );
    }
  }
  raycaster = new THREE.Raycaster();
  mesh.geometry.verticesNeedUpdate = true;
}


var camera, scene, renderer;
var geometry, material, mesh;
var clock, controls, raycaster, mouse;
var current_face;

var highlight_geometry, highlight_material, highlight_sphere;

init();
animate();

function divide(mesh, modifier){
  var modifier = new THREE.SubdivisionModifier(modifier);
  mesh.geometry = modifier.modify( mesh.geometry );
}


function onMouseMove( event ) {
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function onMouseClick(event) {
  if(event.shiftKey) {
    grow_faces(-0.01);
  } else if(event.altKey) {
    grow_faces(0.01);
  }
}

function init() {

  clock = new THREE.Clock();

	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100 );
	camera.position.z = 1;

	scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xffffff );

	material = new THREE.MeshLambertMaterial({
    color: 0xefefef,
    //wireframe: true,
    //transparent: true
    vertexColors: THREE.FaceColors,
    //transparent: true,
  });

  geometry = new THREE.IcosahedronGeometry(0.5, 4);
  geometry.dynamic = true;

	mesh = new THREE.Mesh(geometry, material);

  //divide(mesh, 5);
  //grow(mesh, 0.2);

	scene.add( mesh );

  hemiLight = new THREE.HemisphereLight( 0xffffff, 0x555555, 1 );
  scene.add(hemiLight)

  highlight_geometry = new THREE.SphereGeometry(0.03, 16, 16);
  highlight_material = new THREE.MeshBasicMaterial({ opacity: 0.3, transparent: true, color: 0xff0000 });
  highlight_sphere = new THREE.Mesh(highlight_geometry, highlight_material);
  scene.add(highlight_sphere);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  //helper = new THREE.FaceNormalsHelper(mesh, 0.01, 0x00ff00, 1 );
  //scene.add( helper );

  //var light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  //scene.add(light);

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

  window.addEventListener('mousemove', onMouseMove, false);
  window.addEventListener('click', onMouseClick, false);

  controls = new THREE.TrackballControls(camera, renderer.domElement);
}

function highlight_face(mesh, index) {
  mesh.geometry.faces[index].color.setHex(0xff0000);
}

var active_faces = [];
function find_intersections() {

  raycaster.setFromCamera(mouse, camera);
	var intersects = raycaster.intersectObjects( scene.children );

  active_faces = [];
	for(var i = 0; i < intersects.length; i++) {
    if(intersects[i].object == mesh) {

      highlight_sphere.position.x = intersects[i].point.x;
      highlight_sphere.position.y = intersects[i].point.y;
      highlight_sphere.position.z = intersects[i].point.z;

      current_face = intersects[i].face;

      var point = intersects[i].point;
      var faceIndex = intersects[i].faceIndex;

      for(var i=0; i<mesh.geometry.faces.length; i++) {

        var face = mesh.geometry.faces[i];

        var da = point.distanceTo(mesh.geometry.vertices[face.a]);
        var db = point.distanceTo(mesh.geometry.vertices[face.b]);
        var dc = point.distanceTo(mesh.geometry.vertices[face.c]);

        var brush_radius = settings.brush_radius;
        if(da <= brush_radius || db <= brush_radius || dc <= brush_radius) {
          if(!active_faces.includes(i)) {
            active_faces.push(i);
            highlight_face(mesh, i);
          }
        }
      }
      //var fi = intersects[i].faceIndex;
      //highlight_face(mesh, fi)
      //highlight_face(mesh, fi+1)
    //  mesh.geometry.elementsNeedUpdate = true;
    }
	}
}

function animate() {
	requestAnimationFrame( animate );
  controls.update();

  for(var i=0; i<mesh.geometry.faces.length; i++) { mesh.geometry.faces[i].color.setHex(0xeeeeee) }

  find_intersections();

  mesh.geometry.elementsNeedUpdate = true;
	renderer.render( scene, camera );

}
