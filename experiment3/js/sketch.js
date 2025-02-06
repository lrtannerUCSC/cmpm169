let lightningStrikes = []; // Array to store multiple lightning strikes
let MAX_STRIKES = 10; // Maximum number of simultaneous lightning strikes
let flashState = false; // Flag to track if the screen is flashing
let flashDuration = 10; // How many frames the flash lasts
let flashCounter = 0; // Counter to track number of flashes
let fadeSpeed = 5; // Number of segments to remove per frame for faster fading
let targetX, targetY; // Variables to store the mouse click position

let clouds = []; // Array to store cloud positions and sizes
let cloudUpdateInterval = 15; // Update clouds every 30 frames
let frameCounter = 0; // Counter to track frames

let backgroundThunder; // Sound for background thunder
let activeThunder; // Sound for active thunder
let isBackgroundPlaying = false; // Flag to track if background thunder is playing

function preload() {
  // Load the sound files
  backgroundThunder = loadSound('assets/Background_thunder.mp3');
  activeThunder = loadSound('assets/Active_thunder.mp3');
}

function setup() {
  let canvas = createCanvas(400, 400);
  canvas.parent('canvas-container');
  generateClouds(); // Generate initial clouds
  
  backgroundThunder.setVolume(0.25);

  activeThunder.setVolume(0.3);

  // Start playing the background thunder sound with overlap
  backgroundThunder.loop();
  isBackgroundPlaying = true;
}

function draw() {
  // Handle flashing effect
  if (flashState) {
    background(255); // Flash background to white
    stroke(0); // Set stroke color to black for lightning during flash
  } else {
    background(0); // Normal background (black)
    stroke(255); // Normal lightning color (white)
  }

  // Draw each active lightning strike
  for (let i = lightningStrikes.length - 1; i >= 0; i--) {
    let strike = lightningStrikes[i];

    if (strike.visible) {
      // Check if the lightning duration has ended
      if (frameCount > strike.timeCreated + strike.duration) {
        fadeMainPath(strike); // Start fading out the main path
      }

      // Draw the main lightning path (thicker)
      strokeWeight(4); // Thicker main path
      for (let j = 1; j < strike.path.length; j++) {
        let start = strike.path[j - 1];
        let end = strike.path[j];
        line(start.x, start.y, end.x, end.y);
      }

      // Draw and animate branches for this lightning strike
      for (let branch of strike.branches) {
        let path = branch.path;

        // Animate the branch
        if (branch.life > 0) {
          let last = path[path.length - 1]; // Get the last point in the branch
          let newAngle = branch.angle + random(-PI / 6, PI / 6); // Slight random deviation
          let newLength = random(10, 20); // Length of the new segment
          let newX = last.x + cos(newAngle) * newLength;
          let newY = last.y + sin(newAngle) * newLength;

          // Constrain to canvas bounds
          newX = constrain(newX, 0, width);
          newY = constrain(newY, 0, height);

          path.push(createVector(newX, newY));

          // Remove the oldest point to simulate "flying away"
          if (path.length > 10) path.shift();

          branch.angle = newAngle;

          // Occasionally allow branches to branch off while flying
          if (random(1) < 0.1 && branch.subBranches.length < 2) {
            createBranch(newX, newY, strike, branch);
          }
        }

        // Draw the branch (thinner, based on its distance from the main path)
        let branchThickness = map(branch.path.length, 1, 10, 4, 0.5); // Start at the same thickness and gradually decrease
        stroke(200, 200); // Slightly dimmer for branches
        strokeWeight(branchThickness);
        for (let i = 1; i < path.length; i++) {
          let start = path[i - 1];
          let end = path[i];
          line(start.x, start.y, end.x, end.y);
        }

        // Decrease branch life
        branch.life--;
      }

      // Remove branches whose life has expired
      strike.branches = strike.branches.filter(branch => branch.life > 0);
    }
  }

  // Remove lightning strikes whose main path has faded
  lightningStrikes = lightningStrikes.filter(strike => strike.path.length > 0);

  // Update clouds every `cloudUpdateInterval` frames
  frameCounter++;
  if (frameCounter >= cloudUpdateInterval) {
    generateClouds(); // Generate new clouds
    frameCounter = 0; // Reset the frame counter
  }

  // Draw thunder clouds at the top of the screen
  drawThunderClouds();

  // Handle flash duration
  if (flashState) {
    flashCounter++;
    if (flashCounter >= flashDuration) {
      flashState = false; // End flash
      flashCounter = 0; // Reset counter
    }
  }

  // Handle background thunder overlap
  if (isBackgroundPlaying && backgroundThunder.isPlaying()) {
    // Calculate the remaining time in the current loop
    let remainingTime = backgroundThunder.duration() - backgroundThunder.currentTime();
    if (remainingTime < 1.0) { // If less than 1 second remains, start a new loop
      backgroundThunder.playMode('restart');
      backgroundThunder.play();
    }
  }
}

// Generate cloud positions and sizes
function generateClouds() {
  clouds = []; // Clear the existing clouds
  for (let i = 0; i < 100; i++) {
    // Add random cloud positions and sizes
    clouds.push({
      x: random(0, width),
      y: random(0, 50),
      w: random(100, 150),
      h: random(50, 100),
    });
  }
}

// Draw thunder clouds at the top of the screen
function drawThunderClouds() {
  noStroke();
  fill(50); // Dark gray color for the clouds
  for (let cloud of clouds) {
    // Draw each cloud using its stored position and size
    ellipse(cloud.x, cloud.y, cloud.w, cloud.h);
  }
}

// Generate a new lightning strike recursively
function generateLightning(x, y, strike) {
  // Stop generating if the lightning reaches the target position (mouse click)
  if (dist(x, y, targetX, targetY) < 10) {
    strike.path.push(createVector(targetX, targetY)); // Add the final point at the target position
    flashState = true; // Trigger flash effect when lightning hits the target
    return; // End the recursion when reaching the target
  }

  // Add the current point to the lightning path
  strike.path.push(createVector(x, y));

  // Slight horizontal deviation (but primarily toward the target)
  let angle = atan2(targetY - y, targetX - x) + random(-PI / 4, PI / 4); // Angle toward the target with some randomness
  let distToTarget = random(1, 30); // Random distance for each segment

  // Update position
  x += cos(angle) * distToTarget;
  y += sin(angle) * distToTarget;

  // Prevent lightning from going off the screen (bounds checking)
  x = constrain(x, 0, width);
  y = constrain(y, 0, height);

  // Occasionally branch off the main path
  if (random(1) < 0.2) {
    createBranch(x, y, strike); // Create a branch while still going toward the target
  }

  // Recurse to the next step
  generateLightning(x, y, strike);
}

// Create a new lightning strike
function createLightningStrike() {
  if (lightningStrikes.length >= MAX_STRIKES) {
    return; // Don't generate a new strike if the limit is reached
  }

  let strike = {
    path: [],
    branches: [],
    visible: true,
    timeCreated: frameCount,
    duration: int(random(15, 50)), // Random duration for lightning visibility
  };

  let x = random(0, width); // Start in the middle of the screen horizontally
  let y = 0; // Start at the top of the screen
  strike.path.push(createVector(x, y));

  // Start the recursion for the lightning strike
  generateLightning(x, y, strike);

  lightningStrikes.push(strike); // Add the new strike to the array
}

// Create sub-branches that dynamically extend, and allow them to branch as they fly
function createBranch(x, y, strike, parentBranch = null) {
  let branchPath = [];
  let branchLife = int(random(5, 15)); // Shorter lifespan for sub-branches (compared to main branch)
  let startAngle = random(-PI, PI); // Initial angle for the branch

  branchPath.push(createVector(x, y));

  // Each branch will have subBranches and can branch off a few times
  let branchData = { path: branchPath, life: branchLife, angle: startAngle, subBranches: [] };

  // Add the branch to the current lightning strike's branches array
  strike.branches.push(branchData);

  // Allow this branch to branch a few times (but only a few)
  if (parentBranch) {
    parentBranch.subBranches.push(branchData); // Keep track of sub-branches
  }

  // Recursively branch off from this branch to add more fractal structure
  if (random(1) < 0.1) { // 30% chance to generate sub-branches recursively
    createBranch(x, y, strike, branchData); // Make this branch create more sub-branches
  }
}

// Fade out the main path starting from the top, based on fadeSpeed
function fadeMainPath(strike) {
  for (let i = 0; i < fadeSpeed; i++) {
    if (strike.path.length > 0) {
      strike.path.shift(); // Remove the first segment from the top
    }
  }
  if (strike.path.length === 0) {
    strike.visible = false; // Fully faded, remove this lightning strike
  }
}

// Store the mouse click position and create a new lightning strike
function mousePressed() {
  targetX = mouseX;
  targetY = mouseY;
  createLightningStrike();

  // Play active thunder sound with a random delay
  let delay = random(250, 1500); // Random delay between 0.25 and 1.5 seconds
  setTimeout(() => {
    activeThunder.play();
  }, delay);
}