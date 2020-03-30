var GEOMETRY_DETAIL = 3;

var Settings = function() {
  this.brush_radius = 0.05;
  this.mirror_x = false;
  this.mirror_y = false;
  this.mirror_z = false;
  this.divide = function() { divide(mesh, 1); }
};

var radius_controller;

function init_gui() {
  settings = new Settings();
  gui = new dat.GUI();

  gui.add(settings, 'divide');
  /*gui.add(settings, 'mirror_x');
  gui.add(settings, 'mirror_y');
  gui.add(settings, 'mirror_z');
  */
  radius_controller = gui.add(settings, 'brush_radius', 0, 0.3, 0.0001);
  radius_controller.onChange(function(value) {
    highlight_sphere.geometry = new THREE.SphereGeometry(settings.brush_radius, 16, 16);
  });
}

function scalef(x) {
  return (Math.sin(Math.PI/2-10*x/Math.PI)+1.0)/2.0;
}

function grow_faces(sign, point) {

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
      var distance = point.distanceTo(vertices[indices[j]]);

      if(distance < settings.brush_radius) {
        var scale = scalef(distance/settings.brush_radius)*0.0005;

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
var active_point, mirror_point;
var draw = false;
var scoop = false;

function foo() {
  var geometry;
  for(var i=0; i<mesh.geometry.vertices; i++) {
    geometry.vertices.push(mesh.geometry.vertices[i]);
  }

  for(var i=0; i<mesh.geometry.faces; i++) {
    geometry.faces.push(mesh.geometry.faces[i]);
  }

  geometry.computeBoundingSphere();

  mesh.geometry = geometry;
}

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

  if(event.key == 'z') {
    radius_controller.setValue(settings.brush_radius-Math.max(0.001, settings.brush_radius)/2.0);
  }
  if(event.key == 'x') {
    radius_controller.setValue(settings.brush_radius+Math.max(0.001, settings.brush_radius));
  }

  if(event.key == '<') divide(mesh, 1);
  if(event.key == 'r') {
    camera.position.y = 0;
    camera.position.x = 0;
    camera.position.z = 1;

    camera.rotation.x = 0;
    camera.rotation.y = 0
    camera.rotation.z = 0;

    camera.up.x = 0, camera.up.y = 1, camera.up.z = 0;
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
    //wireframe: true
  });

  geometry = new THREE.IcosahedronGeometry(0.3, GEOMETRY_DETAIL);
  geometry.dynamic = true;

	mesh = new THREE.Mesh(geometry, material);

	scene.add( mesh );

  //hemiLight = new THREE.HemisphereLight(0xffffff, 0x555555, 1);
  //scene.add(hemiLight)

  highlight_geometry = new THREE.SphereGeometry(settings.brush_radius, 16, 16);
  highlight_material = new THREE.MeshBasicMaterial({ opacity: 0.3, transparent: true, color: 0xff0000 });
  highlight_sphere = new THREE.Mesh(highlight_geometry, highlight_material);
  scene.add(highlight_sphere);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  //helper = new THREE.FaceNormalsHelper(mesh, 0.1, 0x00ff00, 1);
  //scene.add( helper );

  //var light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  //scene.add(light);

  var axesHelper = new THREE.AxesHelper( 5 );
  scene.add( axesHelper );

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

  window.addEventListener('mousemove', on_mouse_move, false);
  window.addEventListener('keydown', on_keydown, false);
  window.addEventListener('keyup', on_keyup, false);

  controls = new THREE.TrackballControls(camera, renderer.domElement);
}

function find_intersections(point) {
  raycaster.setFromCamera(point, camera);
	var intersects = raycaster.intersectObjects(scene.children);

  active_point = handle_intersections(intersects);
  highlight_selection();

  if(settings.mirror_x || settings.mirror_y || settings.mirror_z) {
    pm = active_point.clone();
    if(settings.mirror_x) pm.x = -pm.x;
    if(settings.mirror_y) pm.y = -pm.y;
    if(settings.mirror_z) pm.z = -pm.z;

    mirror_point = find_mirror(pm);
  }
}

function find_mirror(p0) {
  var direction = new THREE.Vector3(0, 0, 0);
  direction.sub(p0);
  raycaster.set(p0, direction);

  var intersects = raycaster.intersectObjects(scene.children);

  return handle_intersections(intersects);
}

function handle_intersections(intersects) {
  for(var i=0; i<intersects.length; i++) {
    if(intersects[i].object == mesh) return intersects[i].point;
	}
}

function highlight_selection() {
  if(active_point) {
    highlight_sphere.position.x = active_point.x;
    highlight_sphere.position.y = active_point.y;
    highlight_sphere.position.z = active_point.z;
  }
}

function animate() {
	requestAnimationFrame( animate );
  controls.update();

  find_intersections(mouse);

  if(draw) {
    grow_faces(1, active_point);
    if(settings.mirror_x || settings.mirror_y || settings.mirror_z) grow_faces(1, mirror_point);
  }
  if(scoop) {
    grow_faces(-1, active_point);
    if(settings.mirror_x || settings.mirror_y || settings.mirror_z) grow_faces(-1, mirror_point);
  }

  mesh.geometry.elementsNeedUpdate = true;
	renderer.render( scene, camera );
}

window.onload = function() {
  init_gui();
  init();
  animate();
};
