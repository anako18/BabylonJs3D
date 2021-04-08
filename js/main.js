import * as Constants from "./constants.js";

let canvas;
let engine;
let scene;
let inputStates = {};
let lights = [];
let cameras = [];
let walls = [];

window.onload = startGame;

//Changes the main menu text
function drawMenu(text) {
    document.getElementById("myText").innerHTML = text;
}

//Main game loop
function startGame() {
    canvas = document.querySelector("#myCanvas");
    engine = new BABYLON.Engine(canvas, true);
    scene = createScene();
    modifySettings();
    drawMenu(Constants.text1);
    engine.runRenderLoop(() => {
        let character = scene.getMeshByName(Constants.characterMeshName);
        let treasure = scene.getMeshByName(Constants.treasureMeshName);
        if (character) {
            character.move();
            if (treasure && character.intersectsMesh(treasure, true)) {
                drawMenu(Constants.text3);
            }
        }
        if (inputStates.help) {
            ausecours();
        } else if (inputStates.rehide) {
            rehideTreasure();
            drawMenu(Constants.text1);
        }
        if (scene.activeCamera) {
            scene.render();
        }
    });
}

//Shuffle an array (used for creating the walls positions)
function shuffle(array) {
    array.sort(() => Math.random() - 0.5);
}

//Generate a maze. Maybe not the smartest way to do it, but it works...
function createMaze() {
    let list1 = [];
    let list2 = [];
    for (var i = Constants.minSize; i <= Constants.maxSize; i += 50) {
        list1.push(i);
        list2.push(i);
    }
    shuffle(list1);
    shuffle(list2);
    let m = Constants.minSize;
    for (let i = 0; i < list1.length; i++) {
        createWall(Constants.maxSize / 2, 100, 10, new BABYLON.Vector3(list1[i], 0.6, m), new BABYLON.Vector3(0, 4.7, 0));
        createWall(Constants.maxSize / 2, 100, 10, new BABYLON.Vector3(list2[i], 0.6, m), new BABYLON.Vector3(0, 0, 0));
        m += 50;
    }
}

//Create all the scene objects
function createScene() {
    let scene = new BABYLON.Scene(engine);
    createGround(scene);
    createCharacter(scene);
    createLights(scene, new BABYLON.Vector3(0, 0, 0));
    createMaze();
    createTreasure(scene);

    return scene;
}

//Ground creation
function createGround(scene) {
    const groundOptions = { width: Constants.maxSize * 3, height: Constants.maxSize * 3, subdivisions: 20, minHeight: 0, maxHeight: 50, onReady: onGroundCreated };
    const ground = BABYLON.MeshBuilder.CreateGroundFromHeightMap("gdhm", 'images/hmap1.png', groundOptions, scene);

    function onGroundCreated() {
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
        let texture = new BABYLON.Texture("images/iron.jpg");
        texture.uScale = 5.0;
        texture.vScale = 5.0;
        groundMaterial.diffuseTexture = texture;
        ground.material = groundMaterial;
        ground.checkCollisions = true;
        //groundMaterial.wireframe=true;
    }
    return ground;
}

//Lights creation
function createLights(scene, position) {
    let light0 = new BABYLON.DirectionalLight("dir0", new BABYLON.Vector3(-1, -1, 0), scene);
    //let helpingLight = new BABYLON.SpotLight("ausecours", position, position, Math.PI / 3, 2,scene);
    let helpingLight = new BABYLON.DirectionalLight("ausecours", position,scene);
    helpingLight.intensity = 5;
    helpingLight.setEnabled(false);
    lights.push(light0);
    lights.push(helpingLight);
}

//Free camera which could be used in Super power mode..
function createFreeCamera(scene) {
    let camera = new BABYLON.FreeCamera("freeCamera", new BABYLON.Vector3(0, 150, 0), scene);
    camera.attachControl(canvas);
    camera.checkCollisions = true; 
    camera.applyGravity = true;

    camera.keysUp.push('z'.charCodeAt(0));
    camera.keysDown.push('s'.charCodeAt(0));
    camera.keysLeft.push('q'.charCodeAt(0));
    camera.keysRight.push('d'.charCodeAt(0));
    camera.keysUp.push('Z'.charCodeAt(0));
    camera.keysDown.push('S'.charCodeAt(0));
    camera.keysLeft.push('Q'.charCodeAt(0));
    camera.keysRight.push('D'.charCodeAt(0));

    return camera;
}

//Superpower, the character can fly now to find the tresure more easily
function ausecours() {
    let character = scene.getMeshByName(Constants.characterMeshName);
    character.position.y = 100;
    let treasure = scene.getMeshByName(Constants.treasureMeshName);
    lights[0].setEnabled(false);
    lights[1].position = new BABYLON.Vector3(character.position.x, character.position.y, character.position.z);
    lights[1].direction = new BABYLON.Vector3(treasure.position.x, treasure.position.y, treasure.position.z);
    //cameras[1].position = character.position;
    //cameras[1].position.y=100;
    //lights[1].direction = treasure.position;
    lights[1].setEnabled(true);
    //scene.activeCamera = cameras[1];
    var timeleft = 10;
    const interval = setInterval(function () {
        drawMenu(Constants.text2 + timeleft.toString())
        if (timeleft <= 0) {
            lights[0].setEnabled(true);
            lights[1].setEnabled(false);
            //scene.activeCamera = cameras[0];
            let character = scene.getMeshByName(Constants.characterMeshName);
            character.position.y = 0.6;
            drawMenu(Constants.text1);
            clearInterval(interval);
        }
        timeleft -= 1;
    }, 1000);
}

//Camera which will follow the main character
function createFollowCamera(scene, target) {
    let camera = new BABYLON.FollowCamera("followCamera", target.position, scene, target);

    camera.radius = 80;
    camera.heightOffset = 120;
    camera.rotationOffset = 0;
    camera.cameraAcceleration = .1;
    camera.maxCameraSpeed = 5;
    return camera;
}

//Walls creation
function createWall(width, height, depth, position, rotation) {
    let wall = BABYLON.MeshBuilder.CreateBox("wall", { width: width, height: height, depth: depth });
    wall.position = position;
    wall.rotation = rotation;
    wall.checkCollisions = true;

    const wallMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    let texture = new BABYLON.Texture("images/iron.jpg");
    texture.uScale = 5.0;
    texture.vScale = 5.0;
    wallMaterial.diffuseTexture = texture;
    wall.material = wallMaterial;
    walls.push(wall);
}

//function for checking a wall collision
const intersects = (mesh) => mesh.intersectsMesh(scene.getMeshByName(Constants.treasureMeshName), true);
const intersectsChar = (mesh) => mesh.intersectsMesh(scene.getMeshByName(Constants.characterMeshName), true);

//Creation of treasure (you can change a model settings in Constants.js)
function createTreasure(scene) {
    BABYLON.SceneLoader.ImportMeshAsync(Constants.treasureMeshName, Constants.treasureMeshPath, Constants.treasureMeshFile, scene).then(function (result) {
        let treasure = result.meshes[0];
        treasure.position.y = 10;
        treasure.rotation.y = 10;
        treasure.scaling = new BABYLON.Vector3(0.3, 0.3, 0.3);
        treasure.checkCollisions = true;
    }).then(() => {
        rehideTreasure();
    })
}

function rehideTreasure() {
    let treasure = scene.getMeshByName(Constants.treasureMeshName);
    treasure.position.x = Math.floor(Math.random() * Constants.maxSize + Constants.minSize);
    treasure.position.z = Math.floor(Math.random() * Constants.maxSize + Constants.minSize);
    //if the random position is near the wall we regenerate it
    if (walls.some(intersects)) {
        console.log("Ooops! Collision...");
        treasure.position.x+=15;
        treasure.position.z+=15;
    }
}

//Creation of the main character (you can change a model settings in Constants.js)
function createCharacter(scene) {
    BABYLON.SceneLoader.ImportMeshAsync(Constants.characterMeshName, Constants.characterMeshPath, Constants.characterMeshFile, scene).then(function (result) {
        let character = result.meshes[0];

        character.position.y = 0.6;
        character.position.x = 40;
        character.position.z = 40;

        if (walls.some(intersectsChar)) {
            console.log("Ooops! Collision...");
            character.position.x+=15;
            character.position.z+=15;
        }

        character.speed = Constants.speed;
        character.frontVector = new BABYLON.Vector3(0, 0, 1);
        character.scaling = new BABYLON.Vector3(Constants.charScale, Constants.charScale, Constants.charScale);
        character.checkCollisions = true;

        character.move = () => {
            if (inputStates.up) {
                character.moveWithCollisions(character.frontVector.multiplyByFloats(character.speed, character.speed, character.speed));
            }
            if (inputStates.down) {
                character.moveWithCollisions(character.frontVector.multiplyByFloats(-character.speed, -character.speed, -character.speed));

            }
            if (inputStates.left) {
                character.rotation.y -= Constants.charRotation;
                character.frontVector = new BABYLON.Vector3(Math.sin(character.rotation.y), 0, Math.cos(character.rotation.y));
            }
            if (inputStates.right) {
                character.rotation.y += Constants.charRotation;
                character.frontVector = new BABYLON.Vector3(Math.sin(character.rotation.y), 0, Math.cos(character.rotation.y));
            }
        }
        let a = scene.beginAnimation(result.skeletons[0], 0, 150, true, 1);

    }).then(() => {
        let character = scene.getMeshByName(Constants.characterMeshName);
        let followCamera = createFollowCamera(scene, character);
        let freeCamera = createFreeCamera(scene);
        cameras.push(followCamera);
        cameras.push(freeCamera);
        scene.activeCamera = followCamera;
    });
}

//Resize listener
window.addEventListener("resize", () => {
    engine.resize()
});

//Set listeners, control pointers 
function modifySettings() {
    scene.onPointerDown = () => {
        if (!scene.alreadyLocked) {
            console.log("requesting pointer lock");
            canvas.requestPointerLock();
        } else {
            console.log("Pointer already locked");
        }
    }

    document.addEventListener("pointerlockchange", () => {
        let element = document.pointerLockElement || null;
        if (element) {
            scene.alreadyLocked = true;
        } else {
            scene.alreadyLocked = false;
        }
    })

    inputStates.left = false;
    inputStates.right = false;
    inputStates.up = false;
    inputStates.down = false;
    inputStates.space = false;
    inputStates.help = false;
    inputStates.rehide = false;

    window.addEventListener('keydown', (event) => {
        if ((event.key === "ArrowLeft") || (event.key === "q") || (event.key === "Q")) {
            inputStates.left = true;
        } else if ((event.key === "ArrowUp") || (event.key === "z") || (event.key === "Z")) {
            inputStates.down = true;
        } else if ((event.key === "ArrowRight") || (event.key === "d") || (event.key === "D")) {
            inputStates.right = true;
        } else if ((event.key === "ArrowDown") || (event.key === "s") || (event.key === "S")) {
            inputStates.up = true;
        } else if ((event.key === "h") || (event.key === "H")) {
            inputStates.help = true;
        } else if ((event.key === "r") || (event.key === "R")) {
            inputStates.rehide = true;
        } else if (event.key === " ") {
            inputStates.space = true;
        }
    }, false);

    window.addEventListener('keyup', (event) => {
        if ((event.key === "ArrowLeft") || (event.key === "q") || (event.key === "Q")) {
            inputStates.left = false;
        } else if ((event.key === "ArrowUp") || (event.key === "z") || (event.key === "Z")) {
            inputStates.down = false;
        } else if ((event.key === "ArrowRight") || (event.key === "d") || (event.key === "D")) {
            inputStates.right = false;
        } else if ((event.key === "ArrowDown") || (event.key === "s") || (event.key === "S")) {
            inputStates.up = false;
        } else if ((event.key === "h") || (event.key === "H")) {
            inputStates.help = false;
        } else if ((event.key === "r") || (event.key === "R")) {
            inputStates.rehide = false;
        } else if (event.key === " ") {
            inputStates.space = false;
        }
    }, false);
}

