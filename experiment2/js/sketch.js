// P_2_1_1_04
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
 * shapes in a grid, that are always facing the mouse
 *
 * MOUSE
 * position x/y        : position to face
 *
 * KEYS
 * 1-7                 : choose shapes
 * s                   : save png
 
 * q                   : increase shape size
 * w                   : decrease shape size
 
 * e                   : increase shape count
 * r                   : decrease shape count
 
 * f                   : increase rotation speed
 * g                   : decrease rotation speed
 
 * x                   : toggle grow/shrink
 */
'use strict';

var tileCount = 75;

var tileWidth;
var tileHeight;
var shapeSize = 10;
var newShapeSize = shapeSize;
var shapeAngle = 0;
var maxDist;
var currentShape;
var shapes;
var speedMult = 200;
var sizeMode = 0;

var lastSpinSpeed = 0; // Store the last spin speed to smooth it
var smoothingFactor = 0.1; // Controls how smoothly the spin speed transitions
var prevMouseDist = 0; // Track the previous distance for smoothing

var isGrowing = true; // For controlling the growth and shrink logic
var growShrinkActive = true; // Tracks if the grow/shrink mode is active

function preload() {
  shapes = [];
  shapes.push(loadImage('data/module_1.svg'));
  shapes.push(loadImage('data/module_2.svg'));
  shapes.push(loadImage('data/module_3.svg'));
  shapes.push(loadImage('data/module_4.svg'));
  shapes.push(loadImage('data/module_5.svg'));
  shapes.push(loadImage('data/module_6.svg'));
  shapes.push(loadImage('data/module_7.svg'));
}

function setup() {
  createCanvas(600, 600);
  imageMode(CENTER);
  // set the current shape to the first in the array
  currentShape = shapes[0];
  tileWidth = width / tileCount;
  tileHeight = height / tileCount;
  maxDist = sqrt(pow(width, 2) + pow(height, 2));
}

function draw() {
  clear();
  if (growShrinkActive) {
    if (isGrowing) {
      newShapeSize += 0.2; // Increase size
      if (newShapeSize >= 20) isGrowing = false; // Start shrinking
    } else {
      newShapeSize -= 0.2; // Decrease size
      if (newShapeSize <= 5) isGrowing = true; // Start growing
    }
  }
  for (var gridY = 0; gridY < tileCount; gridY++) {
    for (var gridX = 0; gridX < tileCount; gridX++) {

      var posX = tileWidth * gridX + tileWidth / 2;
      var posY = tileHeight * gridY + tileWidth / 2;

      // Calculate the distance between the mouse and the shape
      var distToMouse = dist(mouseX, mouseY, posX, posY);
      
      // Calculate spin direction: clockwise if mouse is to the right, counter-clockwise if left
      var spinDirection = 1;

      // Calculate the spin speed: closer mouse, faster spin
      var rawSpinSpeed = map(distToMouse, 0, maxDist, 50, 0.1);  // adjust speed range as needed

      // Calculate the rate of change of the distance (mouse movement speed)
      var distChange = distToMouse - prevMouseDist;
      
      // Smooth the change in speed based on the rate of distance change
      var smoothSpinSpeed = lerp(lastSpinSpeed, rawSpinSpeed, smoothingFactor);

      // Update the previous mouse distance
      prevMouseDist = distToMouse;

      // Update the last spin speed for the next frame
      lastSpinSpeed = smoothSpinSpeed;
      
      // Calculate the angle of rotation for this grid position
      var rotationAngle = frameCount * smoothSpinSpeed / speedMult;
      
        
      push();
      translate(posX, posY);
      rotate(rotationAngle); // Adjusted speed for smoother rotation
      
      
      noStroke();
      image(currentShape, 0, 0, newShapeSize, newShapeSize);
      pop();
    }
  }
}

function keyReleased() {
  if (key == 's' || key == 'S') saveCanvas(gd.timestamp(), 'png');
  if (key == 'q' || key == 'Q') newShapeSize += 2;
  if (key == 'w' || key == 'W') newShapeSize -= 2;
  if (key == 'e' || key == 'E') {
    tileCount += 5;
    tileWidth = width / tileCount;
    tileHeight = height / tileCount;
  }
  if (key == 'r' || key == 'R') {
    tileCount -= 5;
    tileWidth = width / tileCount;
    tileHeight = height / tileCount;
  }
  if (key == 'f' || key == 'F') speedMult += 50
  if (key == 'g' || key == 'G') speedMult -= 50
  
  if (key == 'x' || key == 'X') {
  growShrinkActive = !growShrinkActive;
  }


  if (key == '1') currentShape = shapes[0];
  if (key == '2') currentShape = shapes[1];
  if (key == '3') currentShape = shapes[2];
  if (key == '4') currentShape = shapes[3];
  if (key == '5') currentShape = shapes[4];
  if (key == '6') currentShape = shapes[5];
  if (key == '7') currentShape = shapes[6];

}
