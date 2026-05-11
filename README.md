# 🧩 MazeUnit

MazeUnit is an interactive maze simulation that showcases the A* Search Algorithm through real-time visualization. A scanner unit explores a procedurally generated maze, builds an internal map, and computes the optimal route to a central objective while avoiding autonomous enemy agents.

Designed as both an educational and demonstration project, MazeUnit highlights core concepts in algorithms, artificial intelligence, and front-end development.

---

## 🚀 Live Demo
[View Live Project on Render](https://mazeunit.onrender.com)

---

## ⚡Features

- Procedural maze generation using recursive backtracking
- Braided maze structure with loops and alternate routes
- A* pathfinding visualization
- Dynamic obstacle avoidance
- Autonomous enemy agents with independent memory
- Adjustable simulation speed
- Terminal-inspired user interface

---

## 🛠️ Technologies Used

- HTML5
- CSS3
- JavaScript (ES6)

---

## ⚙️ How It Works

### Maze Generation
A 16×16 maze is generated algorithmically and enhanced with additional pathways to create multiple valid routes.

### Scanner Intelligence
The scanner detects nearby walls, updates its internal memory, and uses A* search to reach the center goal efficiently.

### Enemy AI
Enemy agents maintain their own map knowledge and attempt to intercept the scanner.

### Goal Detection
The simulation ends when the scanner reaches the goal or is captured by an enemy.

---

## 🎮 Controls

| Control | Description |
|--------|-------------|
| Generate Mesh | Creates a new randomized maze |
| Execute Solve | Starts the simulation |
| Speed Slider | Adjusts animation speed |

---

## 📁 Project Structure

```text
mazeunit/
├── index.html
├── style.css
├── script.js
└── README.md