// M_2_2_01 with sound, interactive frequency adjustment, and consolidated text input boxes
//
// Generative Gestaltung – Creative Coding im Web
// ISBN: 978-3-87439-902-9, First Edition, Hermann Schmidt, Mainz, 2018
// Benedikt Groß, Hartmut Bohnacker, Julia Laub, Claudius Lazzeroni
// with contributions by Joey Lee and Niels Poldervaart
// Copyright 2018
//
// http://www.generative-gestaltung.de
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Visualize Sounds and play them together! :)
 *
 * MOUSE
 * click and drag horizontally to adjust freqX
 * click and drag vertically to adjust freqY
 *
 * TEXT INPUT
 * type in freqX and freqY values to adjust frequencies
 *
 * KEYS
 * Press 's' then press a number key 1-9 and 0 to save a sound to that number key
 * Press number key to play the corresponding saved sound
 * Press 'c' to toggle compose mode (play multiple sounds simultaneously)
 * While in compose mode press a number key to play a sound continuously, press again to stop
 * While in compose mode left-click on a saved sound to play a quarter beat
 */
'use strict';

var pointCount = 600;
var freqX = 1;
var freqY = 2;
var phi = 90;

var angle;
var x;
var y;
var factorX;
var factorY;

var dodrawAnimation = true;

var margin = 25;

// Sound variables
var oscX, oscY;
var oscillators = [];
var activeSounds = []; // Track currently playing sounds

// Interaction variables
var isDragging = false;

// Text input variables
var freqXInput, freqYInput, bpmInput;

// BPM variables
var bpm = 120;
var interval;

// Sound storage
var savedSounds = new Array(10).fill(null);

// Compose mode
var composeMode = false;



function setup() {
  createCanvas(600, 600);

  // Create oscillators
  oscX = new p5.Oscillator('sine');
  oscY = new p5.Oscillator('sine');

  // Start oscillators
  oscX.start();
  oscY.start();

  // Set initial frequencies
  oscX.freq(freqX * 100); // Scale frequency to audible range
  oscY.freq(freqY * 100); // Scale frequency to audible range

  // Create text input boxes for freqX and freqY
  freqXInput = createInput(freqX.toFixed(2));
  freqXInput.position(20, height - 60);
  freqXInput.size(100);
  freqXInput.input(updateFreqX);
  freqXInput.style('background-color', 'black');
  freqXInput.style('color', '#00FF00'); // Green text
  freqXInput.style('border', '2px solid #00FF00'); // Green border
  freqXInput.style('padding', '5px');

  freqYInput = createInput(freqY.toFixed(2));
  freqYInput.position(20, height - 30);
  freqYInput.size(100);
  freqYInput.input(updateFreqY);
  freqYInput.style('background-color', 'black');
  freqYInput.style('color', '#00FF00'); // Green text
  freqYInput.style('border', '2px solid #00FF00'); // Green border
  freqYInput.style('padding', '5px');

  // Add labels for the input boxes
  fill(0, 255, 0);
  noStroke();
  textSize(16);
  text('freqX:', 130, height - 45);
  text('freqY:', 130, height - 15);

  // Create BPM input
  bpmInput = createInput(bpm.toString());
  bpmInput.position(20, height - 90);
  bpmInput.size(100);
  bpmInput.input(updateBPM);
  bpmInput.style('background-color', 'black');
  bpmInput.style('color', '#00FF00');
  bpmInput.style('border', '2px solid #00FF00');
  bpmInput.style('padding', '5px');

  // Add BPM label
  text('BPM:', 130, height - 75);

  // Initialize BPM interval
  updateBPM();
}


function draw() {
  background(0);
  stroke(0, 255, 0);
  noFill();
  strokeWeight(2);

  if (composeMode) {
    drawComposeModeGrid();
  } else {
    if (dodrawAnimation) {
      translate(width * 3 / 4, height * 3 / 4);
      factorX = width / 4 - margin;
      factorY = height / 4 - margin;
    } else {
      translate(width / 2, height / 2);
      factorX = width / 2 - margin;
      factorY = height / 2 - margin;
    }

    // Sync animation speed to BPM
    let animationSpeed = map(bpm, 60, 180, 0.5, 2);
    angle = map(frameCount * animationSpeed % pointCount, 0, pointCount, 0, TAU);

    // Draw main curve
    beginShape();
    for (var i = 0; i <= pointCount; i++) {
      let currentAngle = map(i, 0, pointCount, 0, TAU);
      x = sin(currentAngle * freqX + radians(phi)) * factorX;
      y = sin(currentAngle * freqY) * factorY;
      vertex(x, y);
    }
    endShape();

    if (dodrawAnimation) {
      drawAnimation();
    }
  }
}

// Add a variable to store the grid cell positions and sizes
var gridCells = [];

function drawComposeModeGrid() {
  let gridCols = 5;
  let gridRows = 2;
  let cellWidth = width / gridCols;
  let cellHeight = height / gridRows;

  // Clear the gridCells array
  gridCells = [];

  for (let i = 0; i < savedSounds.length; i++) {
    let col = i % gridCols;
    let row = Math.floor(i / gridCols);
    let x = col * cellWidth + cellWidth / 2;
    let y = row * cellHeight + cellHeight / 2;

    // Store the cell position and size
    gridCells.push({
      index: i,
      x: x - cellWidth / 2,
      y: y - cellHeight / 2,
      width: cellWidth,
      height: cellHeight
    });

    // Check if this sound is active
    let isActive = activeSounds.some((sound) => sound.index === i);

    // Draw the Lissajous curve for this sound
    push();
    translate(x, y);
    stroke(0, 255, 0); // Set stroke color
    noFill(); // Ensure no fill is applied
    strokeWeight(isActive ? 4 : 2); // Thicker lines for active sounds
    beginShape();
    for (let j = 0; j <= pointCount; j++) {
      let currentAngle = map(j, 0, pointCount, 0, TAU);
      let freqX = savedSounds[i] ? savedSounds[i].freqX : 1;
      let freqY = savedSounds[i] ? savedSounds[i].freqY : 1;
      let xCurve = sin(currentAngle * freqX + radians(phi)) * (cellWidth / 2 - margin);
      let yCurve = sin(currentAngle * freqY) * (cellHeight / 2 - margin);
      vertex(xCurve, yCurve);
    }
    endShape();
    pop();

    // Draw the slot number
    fill(0, 255, 0);
    noStroke();
    textSize(16);
    textAlign(CENTER, CENTER);
    text(i, x, y + cellHeight / 2 - 20);
  }
}

function mouseClicked() {
  if (composeMode) {
    // Check if the mouse is within any of the grid cells
    for (let cell of gridCells) {
      if (mouseX > cell.x && mouseX < cell.x + cell.width &&
          mouseY > cell.y && mouseY < cell.y + cell.height) {
        // Play the sound for 1/4 beat
        playSoundForDuration(cell.index, (60 / bpm) * 1000 / 4);
        break;
      }
    }
  }
}

function playSoundForDuration(index, duration) {
  if (savedSounds[index]) {
    let osc = new p5.Oscillator('sine');
    osc.start();
    osc.freq(savedSounds[index].freqX * 100);
    osc.amp(1); // Set amplitude to 1 (full volume)

    // Stop the oscillator after the specified duration
    setTimeout(() => {
      osc.stop();
    }, duration);

    console.log("Playing sound from slot", index, "for", duration, "ms");
  }
}


function drawAnimation() {
  push();
  noFill();
  stroke(0, 255, 0);

  // Draw x oscillator
  beginShape();
  for (var i = 0; i <= pointCount; i++) {
    let currentAngle = map(i, 0, pointCount, 0, TAU);
    x = sin(currentAngle * freqX + radians(phi));
    x *= width / 4 - margin;
    y = -height * 2 / 3 - margin + i / pointCount * (height / 2 - 2 * margin);
    vertex(x, y);
  }
  endShape();

  // Draw y oscillator
  beginShape();
  for (var i = 0; i <= pointCount; i++) {
    let currentAngle = map(i, 0, pointCount, 0, TAU);
    y = sin(currentAngle * freqY);
    y *= height / 4 - margin;
    x = -width * 2 / 3 - margin + i / pointCount * (width / 2 - 2 * margin);
    vertex(x, y);
  }
  endShape();

  // Calculate the current position on the main curve
  let mainAngle = map(frameCount % pointCount, 0, pointCount, 0, TAU);
  x = sin(mainAngle * freqX + radians(phi)) * factorX;
  y = sin(mainAngle * freqY) * factorY;

  // Calculate the current position on the x oscillator
  let oscXx = sin(mainAngle * freqX + radians(phi)) * (width / 4 - margin);
  let oscXyPos = -height * 2 / 3 - margin + (mainAngle / TAU) * (height / 2 - 2 * margin);

  // Calculate the current position on the y oscillator
  let oscYy = sin(mainAngle * freqY) * (height / 4 - margin);
  let oscYxPos = -width * 2 / 3 - margin + (mainAngle / TAU) * (width / 2 - 2 * margin);

  // Draw connecting lines
  stroke(0, 255, 0);
  line(oscXx, oscXyPos, x, y); // Vertical line
  line(oscYxPos, oscYy, x, y); // Horizontal line

  // Draw ellipses at the current positions
  fill(0);
  stroke(0, 255, 0);
  strokeWeight(2);

  ellipse(oscXx, oscXyPos, 8, 8); // Ellipse on x oscillator
  ellipse(oscYxPos, oscYy, 8, 8); // Ellipse on y oscillator
  ellipse(x, y, 10, 10); // Ellipse on main curve

  pop();
}

// Add a variable to track the currently pressed sound
var currentlyPressedSound = null;

function mousePressed() {
  isDragging = true;

  if (composeMode) {
    // Check if the mouse is within any of the grid cells
    for (let cell of gridCells) {
      if (mouseX > cell.x && mouseX < cell.x + cell.width &&
          mouseY > cell.y && mouseY < cell.y + cell.height) {
        // Start playing the sound
        currentlyPressedSound = cell.index;
        playSoundContinuously(currentlyPressedSound);
        break;
      }
    }
  }
}

function mouseDragged() {
  if (isDragging) {
    // Adjust freqX based on vertical drag (relative distance)
    freqX += (mouseY - pmouseY) * 0.01;
    freqX = max(freqX, 0.1); // Ensure frequency doesn't go below 0.1

    // Adjust freqY based on horizontal drag (relative distance)
    freqY += (mouseX - pmouseX) * 0.01;
    freqY = max(freqY, 0.1); // Ensure frequency doesn't go below 0.1

    // Update oscillator frequencies
    oscX.freq(freqX * 100);
    oscY.freq(freqY * 100);

    // Update text input values
    freqXInput.value(freqX.toFixed(2));
    freqYInput.value(freqY.toFixed(2));
  }
}

function mouseReleased() {
  // Stop dragging
  isDragging = false;

  if (currentlyPressedSound !== null) {
    // Stop the sound that was being played
    stopSound(currentlyPressedSound);
    currentlyPressedSound = null;
  }
}

function playSoundContinuously(index) {
  if (savedSounds[index]) {
    let osc = new p5.Oscillator('sine');
    osc.start();
    osc.freq(savedSounds[index].freqX * 100);
    osc.amp(1); // Set amplitude to 1 (full volume)
    activeSounds.push({ osc, index }); // Add to active sounds
    console.log("Playing sound from slot", index, "continuously");
  }
}

function stopSound(index) {
  // Find the sound with the given index
  for (let i = activeSounds.length - 1; i >= 0; i--) {
    if (activeSounds[i].index === index) {
      let osc = activeSounds[i].osc;

      // Fade out the sound over 50 milliseconds
      osc.amp(0, 0.05, () => {
        osc.stop(); // Stop the oscillator after the fade-out
        activeSounds.splice(i, 1); // Remove from active sounds
        console.log("Stopped sound from slot", index);
      });
    }
  }
}

function updateFreqX() {
  // Update freqX based on text input
  freqX = parseFloat(freqXInput.value()) || 0.1;
  freqX = max(freqX, 0.1); // Ensure frequency doesn't go below 0.1

  // Update oscillator frequency
  oscX.freq(freqX * 100);
}

function updateFreqY() {
  // Update freqY based on text input
  freqY = parseFloat(freqYInput.value()) || 0.1;
  freqY = max(freqY, 0.1); // Ensure frequency doesn't go below 0.1

  // Update oscillator frequency
  oscY.freq(freqY * 100);
}

function updateBPM() {
  bpm = parseFloat(bpmInput.value()) || 120;
  clearInterval(interval); // Clear existing interval
  interval = setInterval(playSound, (60 / bpm) * 1000); // Set new interval
}

function playSound() {
  oscillators.forEach((osc, index) => {
    if (savedSounds[index]) {
      osc.freq(savedSounds[index].freqX * 100);
    } else {
      osc.amp(0);
    }
  });
}

function save_sound(index) {
  savedSounds[index] = { freqX, freqY };
  console.log("Sound saved to slot", index);
}
function playSavedSound(index) {
  if (savedSounds[index]) {
    // Check if the sound is already playing
    let isPlaying = activeSounds.some((sound) => sound.index === index);
    if (isPlaying) {
      // If the sound is already playing, stop it
      stopSound(index);
    } else {
      // If the sound is not playing, start it
      let osc = new p5.Oscillator('sine');
      osc.start();
      osc.freq(savedSounds[index].freqX * 100);
      osc.amp(1); // Set amplitude to 1 (full volume)
      activeSounds.push({ osc, index }); // Add to active sounds
      console.log("Playing sound from slot", index);

      // Update the visual representation and input boxes
      if (!composeMode) {
        loadSavedSoundVisuals(index);
      }
    }
  }
}

function loadSavedSoundVisuals(index) {
  if (savedSounds[index]) {
    // Load the saved frequencies
    freqX = savedSounds[index].freqX;
    freqY = savedSounds[index].freqY;

    // Update the input boxes
    freqXInput.value(freqX.toFixed(2));
    freqYInput.value(freqY.toFixed(2));

    // Update the oscillators
    oscX.freq(freqX * 100);
    oscY.freq(freqY * 100);

    console.log("Loaded sound from slot", index, "with freqX:", freqX, "and freqY:", freqY);
  }
}

function stopSound(index) {
  // Find and stop the sound with the given index
  for (let i = activeSounds.length - 1; i >= 0; i--) {
    if (activeSounds[i].index === index) {
      activeSounds[i].osc.stop(); // Stop the oscillator
      activeSounds.splice(i, 1); // Remove from active sounds
      console.log("Stopped sound from slot", index);
    }
  }
}

function stopAllSounds() {
  // Stop all active sounds
  activeSounds.forEach((sound) => {
    sound.osc.stop();
  });
  activeSounds = []; // Clear the active sounds array

  // Stop the initial oscillators
  oscX.stop();
  oscY.stop();
}

function startInitialOscillators() {
  oscX.start();
  oscY.start();
  oscX.freq(freqX * 100);
  oscY.freq(freqY * 100);
}
var saveActive = false;
function keyPressed() {
  if (key == 's' || key == 'S') saveActive = true, console.log("Save sound to slot __");
  if (key == 'a' || key == 'A') dodrawAnimation = !dodrawAnimation;
  if (key == 'x' || key == 'X') stopAllSounds();
  if (key == 'c' || key == 'C') composeMode = !composeMode, console.log("Compose mode:", composeMode ? "ON" : "OFF");

  // Save sounds to number keys (1-9, 0 for 0)
  if (key >= '1' && key <= '9') {
    if (saveActive) {
      save_sound(Number(key));
      saveActive = false;
    } else if (composeMode) {
      playSavedSound(Number(key));
    } else {
      stopAllSounds(); // Stop all sounds before playing a new one
      playSavedSound(Number(key));
    }
  } else if (key == '0') {
    if (saveActive) {
      save_sound(0);
      saveActive = false;
    } else if (composeMode) {
      playSavedSound(0);
    } else {
      stopAllSounds(); // Stop all sounds before playing a new one
      playSavedSound(0);
    }
  }
}