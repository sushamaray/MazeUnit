/** * SECTION 1: GLOBAL STATE */
const SIZE = 16;
const container = document.getElementById('maze-container');
const strategyText = document.getElementById('strategy-text');
const speedSlider = document.getElementById('speedSlider');

let enemies = [];
const ENEMY_COUNT = 3; 
let isGameOver = false;

let posX = 0, posY = 0, dir = 0; 
const dx = [0, 1, 0, -1], dy = [1, 0, -1, 0]; 
const rotationMap = [0, 90, 180, 270];

let wallMemory = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => [false, false, false, false]));
let visitedHistory = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => 0));
let mazeGrid = []; 

const getDelay = () => Math.max(5, 800 - (speedSlider.value * 7.8));
const isCenterGoal = (x, y) => (x === 7 || x === 8) && (y === 7 || y === 8);

/** * SECTION 2: MAZE GENERATION */
function generateMaze() {
    container.innerHTML = '';
    posX = 0; posY = 0; dir = 0;
    isGameOver = false;
    strategyText.innerText = "IDLE";
    
    wallMemory = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => [false, false, false, false]));
    visitedHistory = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => 0));
    mazeGrid = Array.from({ length: SIZE }, (_, y) => Array.from({ length: SIZE }, (_, x) => ({ x, y, visited: false, walls: [true, true, true, true] })));

    const stack = [];
    let current = mazeGrid[0][0]; current.visited = true;
    while (true) {
        let neighbors = [];
        for (let d = 0; d < 4; d++) {
            let nx = current.x + dx[d], ny = current.y + dy[d];
            if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && !mazeGrid[ny][nx].visited) neighbors.push({node: mazeGrid[ny][nx], dir: d});
        }
        if (neighbors.length > 0) {
            let choice = neighbors[Math.floor(Math.random() * neighbors.length)];
            current.walls[choice.dir] = false; choice.node.walls[(choice.dir + 2) % 4] = false;
            choice.node.visited = true; stack.push(current); current = choice.node;
        } else if (stack.length > 0) current = stack.pop();
        else break;
    }

    // Add shortcuts to make the maze a "grid" with loops
    for (let i = 0; i < 35; i++) {
        let rx = Math.floor(Math.random() * (SIZE-2)) + 1, ry = Math.floor(Math.random() * (SIZE-2)) + 1, rd = Math.floor(Math.random() * 4);
        mazeGrid[ry][rx].walls[rd] = false;
        mazeGrid[ry + dy[rd]][rx + dx[rd]].walls[(rd + 2) % 4] = false;
    }

    enemies = [];
    while(enemies.length < ENEMY_COUNT) {
        let ex = Math.floor(Math.random() * SIZE), ey = Math.floor(Math.random() * SIZE);
        if (Math.abs(ex - posX) + Math.abs(ey - posY) > 10 && !isCenterGoal(ex, ey)) {
            enemies.push({
                x: ex, y: ey,
                // Each enemy has its OWN wall memory, just like the scanner
                memory: Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => [false, false, false, false])),
                waitState: false
            });
        }
    }
    render();
}

/** * SECTION 3: RENDERING */
function render() {
    let scanner = document.getElementById('scanner-probe');
    if (!scanner) {
        scanner = document.createElement('div');
        scanner.id = 'scanner-probe';
        scanner.className = 'scanner';
        container.appendChild(scanner);
    }
    const cells = container.querySelectorAll('.cell');
    cells.forEach(c => c.remove());

    for (let y = SIZE - 1; y >= 0; y--) {
        for (let x = 0; x < SIZE; x++) {
            const div = document.createElement('div');
            div.className = 'cell'; div.id = `cell-${x}-${y}`;
            if (mazeGrid[y][x].walls[0]) div.classList.add('wall-top');
            if (mazeGrid[y][x].walls[1]) div.classList.add('wall-right');
            if (mazeGrid[y][x].walls[2]) div.classList.add('wall-bottom');
            if (mazeGrid[y][x].walls[3]) div.classList.add('wall-left');
            if (enemies.some(e => e.x === x && e.y === y)) div.classList.add('enemy-node');
            if (x === 0 && y === 0) div.classList.add('start-node');
            else if (isCenterGoal(x, y)) div.classList.add('goal-zone');
            container.appendChild(div);
        }
    }
    syncScanner();
}

function syncScanner() {
    const scanner = document.getElementById('scanner-probe');
    const cellEl = document.getElementById(`cell-${posX}-${posY}`);
    if (scanner && cellEl) {
        scanner.style.display = (strategyText.innerText === "SOLVING..." || isGameOver) ? 'block' : 'none';
        scanner.style.left = `${cellEl.offsetLeft + 5}px`;
        scanner.style.top = `${cellEl.offsetTop + 5}px`;
        scanner.style.transform = `rotate(${rotationMap[dir]}deg)`;
        scanner.style.backgroundColor = isGameOver ? "#ff3333" : "#00ffcc";
    }
}

/** * SECTION 4: PATHFINDING (Scanner & Enemy) */

// Universal A* that takes a specific 'memory' set
function a_star_custom(start, targetCoords, memory, isEnemy = false) {
    let nodes = Array.from({ length: SIZE }, (_, y) => Array.from({ length: SIZE }, (_, x) => ({ f: 9999, g: 9999, x, y, parent: null })));
    let openList = [];
    nodes[start.y][start.x].g = 0;
    openList.push(nodes[start.y][start.x]);

    while (openList.length > 0) {
        openList.sort((a, b) => a.f - b.f);
        let curr = openList.shift();

        // Goal check
        if (isEnemy) {
            if (curr.x === targetCoords.x && curr.y === targetCoords.y) {
                let p = []; while (curr) { p.push({x: curr.x, y: curr.y}); curr = curr.parent; }
                return p.reverse();
            }
        } else if (isCenterGoal(curr.x, curr.y)) {
            let p = []; while (curr) { p.push({x: curr.x, y: curr.y}); curr = curr.parent; }
            return p.reverse();
        }

        for (let d = 0; d < 4; d++) {
            let nx = curr.x + dx[d], ny = curr.y + dy[d];
            if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && !memory[curr.y][curr.x][d]) {
                let neighbor = nodes[ny][nx];
                
                let danger = 0;
                if (!isEnemy) { // Scanner avoids enemies
                    enemies.forEach(e => {
                        let dist = Math.abs(nx - e.x) + Math.abs(ny - e.y);
                        if (dist < 3) danger += (4 - dist) * 1500;
                    });
                }

                let tg = curr.g + 1 + danger;
                if (tg < neighbor.g) {
                    neighbor.g = tg;
                    neighbor.f = tg + Math.abs(nx - targetCoords.x) + Math.abs(ny - targetCoords.y);
                    neighbor.parent = curr;
                    openList.push(neighbor);
                }
            }
        }
    }
    return null;
}

/** * SECTION 5: SYMMETRIC AI LOGIC */

async function moveEnemies() {
    for (let enemy of enemies) {
        // Balance: Enemy moves at 75% speed
        if (enemy.waitState) { enemy.waitState = false; continue; }
        enemy.waitState = true;

        // 1. Enemy "feels" local walls to update its memory
        for (let d = 0; d < 4; d++) {
            if (mazeGrid[enemy.y][enemy.x].walls[d]) {
                enemy.memory[enemy.y][enemy.x][d] = true;
                let nx = enemy.x + dx[d], ny = enemy.y + dy[d];
                if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE) enemy.memory[ny][nx][(d + 2) % 4] = true;
            }
        }

        // 2. Enemy tries to path to Scanner using ONLY what it has seen
        let path = a_star_custom({x: enemy.x, y: enemy.y}, {x: posX, y: posY}, enemy.memory, true);

        if (path && path.length > 1) {
            enemy.x = path[1].x;
            enemy.y = path[1].y;
        } else {
            // Explore if path is unknown
            let valid = [];
            for (let d = 0; d < 4; d++) if (!mazeGrid[enemy.y][enemy.x].walls[d]) valid.push(d);
            let move = valid[Math.floor(Math.random() * valid.length)];
            enemy.x += dx[move]; enemy.y += dy[move];
        }

        if (enemy.x === posX && enemy.y === posY) isGameOver = true;
    }
    render(); 
}

async function runSolver() {
    strategyText.innerText = "SOLVING...";
    while (!isGameOver) {
        if (isCenterGoal(posX, posY)) { strategyText.innerText = "GOAL REACHED"; break; }
        
        // Scanner updates its memory
        update_walls(); 
        
        // Scanner paths to center (Avoiding enemies based on current position)
        let path = a_star_custom({x: posX, y: posY}, {x: 7.5, y: 7.5}, wallMemory, false);
        
        if (!path || path.length < 2) {
            await moveEnemies();
            await new Promise(r => setTimeout(r, 100));
            continue;
        }

        let next = path[1], targetDir = -1;
        for (let d = 0; d < 4; d++) if (dx[d] === (next.x - posX) && dy[d] === (next.y - posY)) targetDir = d;

        while (dir !== targetDir && !isGameOver) {
            dir = ((targetDir - dir + 4) % 4 === 3) ? (dir + 3) % 4 : (dir + 1) % 4;
            await updateUI();
        }
        
        posX = next.x; posY = next.y; 
        visitedHistory[posY][posX]++;
        await updateUI();
        await moveEnemies(); 

        if (isGameOver) { strategyText.innerText = "TERMINATED"; break; }
    }
}

async function updateUI() {
    const delay = getDelay();
    syncScanner();
    const cellEl = document.getElementById(`cell-${posX}-${posY}`);
    if (cellEl && !isCenterGoal(posX, posY) && !(posX === 0 && posY === 0)) cellEl.classList.add('explored');
    const scanner = document.getElementById('scanner-probe');
    if (scanner) scanner.style.transition = `all ${delay * 0.8}ms linear`;
    await new Promise(r => setTimeout(r, delay));
}

function update_walls() {
    [dir, (dir + 3) % 4, (dir + 1) % 4].forEach(d => {
        if (mazeGrid[posY][posX].walls[d]) {
            wallMemory[posY][posX][d] = true; 
            let nx = posX + dx[d], ny = posY + dy[d];
            if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE) wallMemory[ny][nx][(d + 2) % 4] = true;
        }
    });
}

document.getElementById('generateBtn').onclick = generateMaze;
document.getElementById('solveBtn').onclick = runSolver;
generateMaze();