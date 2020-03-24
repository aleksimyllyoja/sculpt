var Settings = function() {
  this.brush_radius = 0.5;
  this.divide = function() { divide(mesh, 1); }
};

function init_gui() {
  settings = new Settings();
  gui = new dat.GUI();

  gui.add(settings, 'divide');

  radius_controller = gui.add(settings, 'brush_radius', 0, 10);
  radius_controller.onChange(function(value) {
    highlight_sphere.geometry = new THREE.SphereGeometry(settings.brush_radius/10, 16, 16);
  });
}

function grow_faces(sign) {

  var normalMatrixWorld = new THREE.Matrix3();
  mesh.geometry.computeVertexNormals();
  mesh.geometry.computeFaceNormals();

  var vertices = mesh.geometry.vertices;
  var matrixWorld = mesh.matrixWorld;
  var faces = mesh.geometry.faces;

  normalMatrixWorld.getNormalMatrix(matrixWorld);

  for(var i = 0, l = faces.length; i < l; i ++) {

    var face = mesh.geometry.faces[i];
    var fv = new THREE.Vector3();
    var indices = [face.a, face.b, face.c];

    fv.copy(face.normal).applyMatrix3(normalMatrixWorld).normalize();

    for(var j = 0; j<3; j++) {
      var distance = active_point.distanceTo(vertices[indices[j]]);

      if(distance < settings.brush_radius) {
        distance /= settings.brush_radius;

        distance = Math.max(0.1, distance);
        var scale = (1/(distance*distance))/1000000.0;

        vertices[indices[j]].applyMatrix4(matrixWorld);
        vertices[indices[j]].addScaledVector(fv, sign*scale);
      }
    }
  }

  raycaster = new THREE.Raycaster();
  mesh.geometry.verticesNeedUpdate = true;
}


var camera, scene, renderer;
var geometry, material, mesh;
var clock, controls, raycaster, mouse;
var highlight_geometry, highlight_material, highlight_sphere;
var active_point;
var draw = false;
var scoop = false;

function divide(mesh, modifier){
  var modifier = new THREE.SubdivisionModifier(modifier);
  mesh.geometry = modifier.modify( mesh.geometry );
}

function on_mouse_move(event) {
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function on_keydown(event) {
  if(event.key == 'd') {
    draw = true;
  }
  if(event.key == 's') {
    scoop = true;
  }
}

function on_keyup(event) {
  if(event.key == 'd') {
    draw = false;
  }
  if(event.key == 's') {
    scoop = false;
  }
}

function init() {

  clock = new THREE.Clock();

	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100 );
	camera.position.z = 1;

	scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xffffff );

	material = new THREE.MeshNormalMaterial({
    flatShading: true,
  });

  geometry = new THREE.IcosahedronGeometry(0.3, 3);
  geometry.dynamic = true;

	mesh = new THREE.Mesh(geometry, material);

	scene.add( mesh );

  //hemiLight = new THREE.HemisphereLight(0xffffff, 0x555555, 1);
  //scene.add(hemiLight)

  highlight_geometry = new THREE.SphereGeometry(settings.brush_radius/10, 16, 16);
  highlight_material = new THREE.MeshBasicMaterial({ opacity: 0.3, transparent: true, color: 0xff0000 });
  highlight_sphere = new THREE.Mesh(highlight_geometry, highlight_material);
  scene.add(highlight_sphere);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  //helper = new THREE.FaceNormalsHelper(mesh, 0.01, 0x00ff00, 1 );
  //scene.add( helper );

  //var light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  //scene.add(light);

  //var axesHelper = new THREE.AxesHelper( 5 );
  //scene.add( axesHelper );

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

  window.addEventListener('mousemove', on_mouse_move, false);
  window.addEventListener('keydown', on_keydown, false);
  window.addEventListener('keyup', on_keyup, false);

  controls = new THREE.TrackballControls(camera, renderer.domElement);
}

function find_intersections() {

  raycaster.setFromCamera(mouse, camera);
	var intersects = raycaster.intersectObjects( scene.children );

	for(var i=0; i<intersects.length; i++) {
    if(intersects[i].object == mesh) {

      highlight_sphere.position.x = intersects[i].point.x;
      highlight_sphere.position.y = intersects[i].point.y;
      highlight_sphere.position.z = intersects[i].point.z;

      active_point = intersects[i].point;
    }
	}
}

function animate() {
	requestAnimationFrame( animate );
  controls.update();

  find_intersections();

  if(draw) {
    grow_faces(1);
  }
  if(scoop) {
    grow_faces(-1);
  }

  mesh.geometry.elementsNeedUpdate = true;
	renderer.render( scene, camera );
}

window.onload = function() {
  init_gui();
  init();
  animate();
};
