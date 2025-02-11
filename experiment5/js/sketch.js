let orbs = [];
let G = 0.4; // Gravitational constant (the higher the stronger)
let selectedOrb = null;

// Sliders
let massSlider, radiusSlider;
let posXSlider, posYSlider, posZSlider;
let velXSlider, velYSlider, velZSlider;
let accXSlider, accYSlider, accZSlider;

// Labels
let massLabel, radiusLabel;
let posXLabel, posYLabel, posZLabel;
let velXLabel, velYLabel, velZLabel;
let accXLabel, accYLabel, accZLabel;

// Slider toggle
let inSliderMenu = false;

// Reset Button
let resetButton;

// Initial orbs for reset
let initialOrbs;

// Simulation toggler
let runSimulation = true;

// Merge mode toggler
let mergeMode = false;

// Orb tracking camera toggler
let cameraX = 0;
let cameraY = 0;
let cameraZ = 500; // Default camera position
let followCamera = false;

//==================================================//
//controls

// r    Generate random orb
// e    Select Previous orb
// f    Follow selected orb
// m    Many mini mode
// x    Removes all orbs
//==================================================//
function setup() {
  const canvas = createCanvas(800, 600, WEBGL);
  canvas.parent('canvas-container');
  // Create sliders and labels
  createSlidersAndLabels();

  // Create reset button
  resetButton = createButton('Reset');
  resetButton.position(20, height - 50);
  resetButton.mousePressed(resetSimulation);

  // Initialize orbs
  // orbs.push(new Orb(500, -250, 0, 0)); // Example orb
  // orbs.push(new Orb(500, 250, 0, 0)); // Example orb
  initialOrbs = deepCopyOrbs(orbs); // Save initial state
  console.log("Initial orbs: ", initialOrbs);
  
  // Lighting setup
  ambientLight(100); // Soft ambient light
  directionalLight(255, 255, 255, 0, 0, -1); // Directional light from the front


}

let orbTimer = 60
let orbCounter = 0

function draw() {
  background(0);
  lights(); // Enable lighting
  
  // Follow the selected orb with the camera if enabled
  if (followCamera) {
    if (selectedOrb){
      followSelectedOrb(selectedOrb);
    }
    
  }
  
  inSliderCheck();
  if (inSliderMenu == false) { // Don't allow camera movement or  
    orbitControl(); // Allow scene rotation
  } else {
    // Update selected orb properties
    if (selectedOrb) {
      selectedOrb.mass = massSlider.value();
      selectedOrb.radius = radiusSlider.value();
      selectedOrb.position.set(posXSlider.value(), posYSlider.value(), posZSlider.value());
      selectedOrb.velocity.set(velXSlider.value(), velYSlider.value(), velZSlider.value());
      selectedOrb.acceleration.set(accXSlider.value(), accYSlider.value(), accZSlider.value());
    }
  }
  
  // Draw the teal box around the boundaries
  push();
  noFill();
  stroke(0, 128, 128, 128); // Teal color with 50% transparency
  strokeWeight(2);
  let halfWidth = width / 2;
  let halfHeight = height / 2;
  let depthLimit = 500; // Arbitrary depth limit
  translate(0, 0, 0); // Center the box
  box(halfWidth * 2, halfHeight * 2, depthLimit * 2); // Draw the box
  pop();

  // Update and display orbs
  for (let orb of orbs) {
    orb.update();
    orb.display();
  }
  
  
  checkCollisions();
  
  if (runSimulation){
    // Calculate gravity
    for (let i = 0; i < orbs.length; i++) {
      for (let j = i + 1; j < orbs.length; j++) {
        let force = calculateGravity(orbs[i], orbs[j]);
        orbs[i].applyForce(force);
        orbs[j].applyForce(force.mult(-1));
      }
    }
  }

  
}

function calculateGravity(orb1, orb2) {
  let r = p5.Vector.sub(orb2.position, orb1.position);
  let distance = r.mag();
  let strength = (G * orb1.mass * orb2.mass) / (distance * distance);
  return r.normalize().mult(strength);
}

class Orb {
  constructor(mass, x, y, z) {
    this.mass = mass;
    this.position = createVector(x, y, z);
    this.velocity = createVector(0, 0, 0);
    this.acceleration = createVector(0, 0, 0);
    this.radius = 25; // Fixed radius
    this.color = color(random(255), random(255), random(255));
  }

  update() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.acceleration.mult(0);

    // Screen bounds (assuming WEBGL with centered coordinates)
    let halfWidth = width / 2;
    let halfHeight = height / 2;

    // Bounce on X-axis
    if (this.position.x + this.radius > halfWidth || this.position.x - this.radius < -halfWidth) {
      this.velocity.x *= -0.5; // Reverse velocity
      this.position.x = constrain(this.position.x, -halfWidth + this.radius, halfWidth - this.radius);
    }

    // Bounce on Y-axis
    if (this.position.y + this.radius > halfHeight || this.position.y - this.radius < -halfHeight) {
      this.velocity.y *= -0.5; // Reverse velocity
      this.position.y = constrain(this.position.y, -halfHeight + this.radius, halfHeight - this.radius);
    }

    // Bounce on Z-axis (if needed)
    let depthLimit = 500; // Arbitrary depth limit
    if (this.position.z + this.radius > depthLimit || this.position.z - this.radius < -depthLimit) {
      this.velocity.z *= -0.5; // Reverse velocity
      this.position.z = constrain(this.position.z, -depthLimit + this.radius, depthLimit - this.radius);
    }
  }

  display() {
    push();
    translate(this.position.x, this.position.y, this.position.z);
    specularMaterial(this.color); // Use specular material for shiny effect
    fill(this.color);
    noStroke();
    sphere(this.radius);
    pop();
  }

  applyForce(force) {
    let f = p5.Vector.div(force, this.mass);
    this.acceleration.add(f);
  } 
}

function checkCollisions() {
  for (let i = 0; i < orbs.length; i++) {
    for (let j = i + 1; j < orbs.length; j++) {
      let orb1 = orbs[i];
      let orb2 = orbs[j];
      let distance = orb1.position.dist(orb2.position); // Distance between orbs
      let minCollisionDistance = orb1.radius + orb2.radius; // Minimum distance to avoid collision
      let minMergeDistance = minCollisionDistance / 2;
      
      if (distance < minCollisionDistance) {
        if (mergeMode) {
          if (distance < minMergeDistance) {
            mergeCollision(orb1, orb2);
          }
        } else {
        resolveCollision(orb1, orb2); // Resolve the collision
        }
      }
    }
  }
}

function resolveCollision(orb1, orb2) {
  // Calculate the vector between the two orbs
  let collisionVector = p5.Vector.sub(orb2.position, orb1.position);
  let distance = collisionVector.mag();
  let minDistance = orb1.radius + orb2.radius;

  // Normalize the collision vector
  collisionVector.normalize();

  // Calculate the relative velocity
  let relativeVelocity = p5.Vector.sub(orb2.velocity, orb1.velocity);

  // Calculate the speed along the collision vector
  let speed = relativeVelocity.dot(collisionVector);

  // If the orbs are moving away from each other, no collision response is needed
  if (speed > 0) return;

  // Calculate the impulse (change in velocity)
  let impulse = (2 * speed) / (orb1.mass + orb2.mass);

  // Apply the impulse to both orbs
  orb1.velocity.add(p5.Vector.mult(collisionVector, impulse * orb2.mass));
  orb2.velocity.sub(p5.Vector.mult(collisionVector, impulse * orb1.mass));

  // Move the orbs apart to avoid overlap
  let overlap = minDistance - distance;
  let correction = collisionVector.mult(overlap / 2);
  orb1.position.sub(correction);
  orb2.position.add(correction);
}

function mergeCollision(orb1, orb2) {
  // Calculate merged mass and radius
  let mergedMass = orb1.mass + orb2.mass;
  let mergedRadius = orb1.radius + orb2.radius;

  // Determine which orb has the larger velocity magnitude
  let largerOrb = (orb1.mass > orb2.mass) ? orb1 : orb2;
  let smallerOrb = (largerOrb === orb1) ? orb2 : orb1;

  // Update the larger orb's mass and radius
  largerOrb.mass = mergedMass;
  largerOrb.radius = mergedRadius;

  // Calculate the merged velocity using momentum conservation
  // momentum = mass * velocity
  let totalMomentum = p5.Vector.add(
    p5.Vector.mult(orb1.velocity, orb1.mass),
    p5.Vector.mult(orb2.velocity, orb2.mass)
  );
  largerOrb.velocity = p5.Vector.div(totalMomentum, mergedMass);

  // If either merged orb was selected, the larger orb is now selected
  if ((orb1 === selectedOrb) || (orb2 === selectedOrb)) {
    swapSelectedOrb(largerOrb);
  }

  // Remove the smaller orb from the orbs array
  let index = orbs.indexOf(smallerOrb);
  if (index !== -1) orbs.splice(index, 1);
}

// function mouseClicked() {
//   if (mouseButton === LEFT) {
//     // Check if the user left-clicked near a planet
//     for (let orb of orbs) {
//       let screenPos = worldToScreen(orb.position);
//       // console.log("ScreenPos: ", screenPos);
//       // console.log("MousePos: ", mouseX, mouseY)
//       let d = dist(mouseX, mouseY, screenPos.x, screenPos.y);
//       if (d < orb.radius) {
//         if (selectedOrb) { 
//           selectedOrb.color = color(random(255), random(255), random(255));
//         }
//         selectedOrb = orb;
//         selectedOrb.color = color(255, 255, 255);
//         console.log("Orb selected: ", selectedOrb);
//         updateSliders();
//         break;
//       }
//     }
//   }
// }

function generateRandomOrb() {
  newOrb = new Orb(random(1, 10000), random(-width, width), random(-height, height), random(-width, width));
  newOrb.velocity = createVector(random(-2, 2), random(-2, 2), random(-2, 2));
  newOrb.radius = random(1, 50);
  
  swapSelectedOrb(newOrb);
  orbs.push(newOrb);
  updateSliders();
}

function generateDefaultOrb() {
  newOrb = new Orb(0.1, 0, 0, 0);
  swapSelectedOrb(newOrb);
  orbs.push(newOrb);
  updateSliders();
  
}

function generateManyMini(amount = 100) { 
  for (let i = 0; i < amount; i++) {
    newOrb = new Orb(random(10, 50), random(-width, width), random(-height, height), random(-width, width));
    newOrb.velocity = createVector(random(-2, 2), random(-2, 2), random(-2, 2));
    newOrb.radius = random(1, 5);
    orbs.push(newOrb);
  }
  swapSelectedOrb(newOrb);
}

// Swapping which orb is selected
function swapSelectedOrb(newOrb) {
  if (selectedOrb) {
    // Change prev selected orb to random color
    selectedOrb.color = color(random(255), random(255), random(255));
  }
  
  selectedOrb = newOrb;
  // Changing new selected orb to white
  selectedOrb.color = (255, 255, 255);
  
}

function selectPreviousOrb() {
  if (selectedOrb) {
    // Find the index of the currently selected orb
    let currentIndex = orbs.indexOf(selectedOrb);

    // If no orb is selected or the selected orb is not in the list, do nothing
    if (currentIndex === -1) return;

    // Calculate the index of the previous orb
    let previousIndex;
    if (currentIndex === 0) {
      // If the selected orb is the first one, wrap around to the last orb
      previousIndex = orbs.length - 1;
    } else {
      // Otherwise, select the previous orb
      previousIndex = currentIndex - 1;
    }

    // Select the previous orb
    swapSelectedOrb(orbs[previousIndex]);
  } else {
    swapSelectedOrb(orbs[0]);
  }
  
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    console.log("Random orb generated");
    generateRandomOrb();
  }
  
  if (key === 'd' || key === 'D') {
    Console.log("Default orb generated");
    generateDefaultOrb();
  }
  
  if (key === 'e' || key === 'E') {
    console.log("Previous orb selected");
    selectPreviousOrb();
  }
  
  if (key === 'x' || key === 'X') {
    console.log("Simulation reset");
    resetSimulation();
  }
  
  if (key === 'w' || key === 'W') {
    mergeMode = !mergeMode;
    console.log("Merge mode: ", mergeMode);
  }
  
  if (key === 'm' || key === 'M') {
    generateManyMini();
    console.log("Many mini generated");
  }
  
  if (key === 's' || key === 'S') {
    runSimulation = !runSimulation;
    console.log("Simulation running: ", runSimulation);
  }
  
  if (key === 'f' || key === 'F') {
    followCamera = !followCamera; // Toggle camera follow
    console.log("Camera follow: ", followCamera);
  }
}

function followSelectedOrb(orb = selectedOrb) {
  // Set the camera's target to the selected orb's position
  let targetX = orb.position.x;
  let targetY = orb.position.y;
  let targetZ = orb.position.z;

  // Calculate the camera's position relative to the target
  let cameraDistance = 500; // Distance from the orb
  let cameraX = targetX + cameraDistance;
  let cameraY = targetY + cameraDistance;
  let cameraZ = targetZ + cameraDistance;

  // Set the camera to look at the selected orb
  camera(cameraX, cameraY, cameraZ, targetX, targetY, targetZ, 0, 1, 0);

  // Enable orbitControl for user interaction
  orbitControl();
}

// function worldToScreen(worldPos) {
//   // Convert 3D world position to 2D screen position
//   let screenPos = createVector();
//   screenPos.x = (worldPos.x * width) / (2 * width) + width / 2;
//   screenPos.y = (-worldPos.y * height) / (2 * height) + height / 2;
//   return screenPos;
// }

// function screenToWorld(screenX, screenY) {
//   // Convert 2D screen position to 3D world position
//   let worldX = map(screenX, 0, width, -width / 2, width / 2);
//   let worldY = map(screenY, 0, height, -height / 2, height / 2);
//   let worldZ = 0; // Default Z position
//   return createVector(worldX, worldY, worldZ);
// }

function updateSliders() {
  if (selectedOrb) {
    massSlider.value(selectedOrb.mass);
    radiusSlider.value(selectedOrb.radius);
    posXSlider.value(selectedOrb.position.x);
    posYSlider.value(selectedOrb.position.y);
    posZSlider.value(selectedOrb.position.z);
    velXSlider.value(selectedOrb.velocity.x);
    velYSlider.value(selectedOrb.velocity.y);
    velZSlider.value(selectedOrb.velocity.z);
    accXSlider.value(selectedOrb.acceleration.x);
    accYSlider.value(selectedOrb.acceleration.y);
    accZSlider.value(selectedOrb.acceleration.z);
  }
}

function inSliderCheck() {
  if (mouseY >= height-120 && inSliderMenu == false) {
    inSliderMenu = true;
    console.log("Sliders updated");
    updateSliders();
  } else if (mouseY < height-120 && inSliderMenu == true) {
    inSliderMenu = false;
  }
  // console.log("inSliderMenu: ", inSliderMenu);
}

function createSlidersAndLabels() {
  let sliderWidth = 100;
  let sliderHeight = 20;
  let startX = 20;
  let startY = height - 120; // Position sliders at the bottom
  let rowSpacing = 30;

  // Mass
  massLabel = createP('Mass:');
  massLabel.position(startX, startY);
  massLabel.style('color', 'white');
  massSlider = createSlider(1, 10000, 50);
  massSlider.position(startX + 50, startY);
  massSlider.size(sliderWidth, sliderHeight);

  // Radius
  radiusLabel = createP('Radius:');
  radiusLabel.position(startX, startY + rowSpacing);
  radiusLabel.style('color', 'white');
  radiusSlider = createSlider(10, 100, 5);
  radiusSlider.position(startX + 50, startY + rowSpacing);
  radiusSlider.size(sliderWidth, sliderHeight);

  // Position X
  posXLabel = createP('Pos X:');
  posXLabel.position(startX + 200, startY);
  posXLabel.style('color', 'white');
  posXSlider = createSlider(-width / 2, width / 2, 0);
  posXSlider.position(startX + 250, startY);
  posXSlider.size(sliderWidth, sliderHeight);

  // Position Y
  posYLabel = createP('Pos Y:');
  posYLabel.position(startX + 200, startY + rowSpacing);
  posYLabel.style('color', 'white');
  posYSlider = createSlider(-height / 2, height / 2, 0);
  posYSlider.position(startX + 250, startY + rowSpacing);
  posYSlider.size(sliderWidth, sliderHeight);

  // Position Z
  posZLabel = createP('Pos Z:');
  posZLabel.position(startX + 200, startY + 2 * rowSpacing);
  posZLabel.style('color', 'white');
  posZSlider = createSlider(-500, 500, 0);
  posZSlider.position(startX + 250, startY + 2 * rowSpacing);
  posZSlider.size(sliderWidth, sliderHeight);

  // Velocity X
  velXLabel = createP('Vel X:');
  velXLabel.position(startX + 400, startY);
  velXLabel.style('color', 'white');
  velXSlider = createSlider(-5, 5, 0);
  velXSlider.position(startX + 450, startY);
  velXSlider.size(sliderWidth, sliderHeight);

  // Velocity Y
  velYLabel = createP('Vel Y:');
  velYLabel.position(startX + 400, startY + rowSpacing);
  velYLabel.style('color', 'white');
  velYSlider = createSlider(-5, 5, 0);
  velYSlider.position(startX + 450, startY + rowSpacing);
  velYSlider.size(sliderWidth, sliderHeight);

  // Velocity Z
  velZLabel = createP('Vel Z:');
  velZLabel.position(startX + 400, startY + 2 * rowSpacing);
  velZLabel.style('color', 'white');
  velZSlider = createSlider(-5, 5, 0);
  velZSlider.position(startX + 450, startY + 2 * rowSpacing);
  velZSlider.size(sliderWidth, sliderHeight);

  // Acceleration X
  accXLabel = createP('Acc X:');
  accXLabel.position(startX + 600, startY);
  accXLabel.style('color', 'white');
  accXSlider = createSlider(-1, 1, 0);
  accXSlider.position(startX + 650, startY);
  accXSlider.size(sliderWidth, sliderHeight);

  // Acceleration Y
  accYLabel = createP('Acc Y:');
  accYLabel.position(startX + 600, startY + rowSpacing);
  accYLabel.style('color', 'white');
  accYSlider = createSlider(-1, 1, 0);
  accYSlider.position(startX + 650, startY + rowSpacing);
  accYSlider.size(sliderWidth, sliderHeight);

  // Acceleration Z
  accZLabel = createP('Acc Z:');
  accZLabel.position(startX + 600, startY + 2 * rowSpacing);
  accZLabel.style('color', 'white');
  accZSlider = createSlider(-1, 1, 0);
  accZSlider.position(startX + 650, startY + 2 * rowSpacing);
  accZSlider.size(sliderWidth, sliderHeight);
}

function resetSimulation() {
  // Clear the orbs array and reinitialize with the initial state
  console.log("Resetting scene...");
  orbs = deepCopyOrbs(initialOrbs);
  selectedOrb = null; // Deselect any selected orb
}


function deepCopyOrbs(orbs) {
  // Create a deep copy of the orbs array
  return orbs.map(orb => new Orb(orb.mass, orb.position.x, orb.position.y, orb.position.z));
}
