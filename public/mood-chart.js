class MoodChartApp {
    constructor() {
        this.entries = [];
        this.currentDate = new Date();
        this.sketch = null;
        this.rotationAngles = {}; // Store rotation angles for each day
        
        this.init();
    }

    async init() {
        await this.loadEntries();
        this.setupMonthNavigation();
        this.setupBackButton();
        this.updateMonthDisplay();
        this.createP5Sketch();
    }

    async loadEntries() {
        try {
            const response = await fetch('/api/entries');
            this.entries = await response.json();
            console.log('Loaded entries:', this.entries);
        } catch (error) {
            console.error('Error loading entries:', error);
        }
    }

    setupMonthNavigation() {
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.updateMonthDisplay();
            this.redrawChart();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.updateMonthDisplay();
            this.redrawChart();
        });
    }

    setupBackButton() {
        document.getElementById('back-btn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        
        document.getElementById('daily-mood-btn').addEventListener('click', () => {
            window.location.href = 'visualization.html';
        });
    }

    updateMonthDisplay() {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        const monthStr = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        document.getElementById('selected-month').textContent = monthStr;
    }

    getEntriesForMonth() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Group entries by date
        const entriesByDate = {};
        
        this.entries.forEach(entry => {
            const entryDate = new Date(entry.timestamp);
            if (entryDate.getFullYear() === year && entryDate.getMonth() === month) {
                const dateKey = entryDate.getDate();
                if (!entriesByDate[dateKey]) {
                    entriesByDate[dateKey] = [];
                }
                entriesByDate[dateKey].push(entry);
            }
        });
        
        return entriesByDate;
    }

    normalizeColor(color) {
        if (!color) return '#29BD67';
        
        // If it's already a hex color, return as is
        if (color.startsWith('#')) return color;
        
        // Convert named colors to hex approximations
        const colorMap = {
            'yellow': '#FFD700',
            'dark grey': '#808080',
            'warm yellow': '#FFE066',
            'emerald': '#50C878',
            'burnt orange': '#CC5500',
            'red': '#FF0000',
            'blue': '#0000FF',
            'green': '#00FF00',
            'purple': '#800080',
            'pink': '#FFC0CB',
            'orange': '#FFA500'
        };
        
        return colorMap[color.toLowerCase()] || color;
    }

    // Helper function to draw an irregular, ink-blot style circle
    drawInkBlotCircle(p, centerX, centerY, radius, color) {
        // Parse hex color to RGB
        const r = parseInt(color.substr(1, 2), 16);
        const g = parseInt(color.substr(3, 2), 16);
        const b = parseInt(color.substr(5, 2), 16);
        
        p.fill(r, g, b, 204); // 204 = 80% opacity (0.8 * 255)
        p.noStroke();
        
        p.beginShape();
        const numPoints = 60; // More points = smoother overall shape
        
        for (let i = 0; i < numPoints; i++) {
            const angle = p.map(i, 0, numPoints, 0, p.TWO_PI);
            
            // Create irregular radius with multiple layers of noise
            const noiseValue1 = p.noise(centerX * 0.01, centerY * 0.01, angle * 2);
            const noiseValue2 = p.noise(centerX * 0.02 + 100, centerY * 0.02, angle * 3);
            
            // Combine noise for more organic variation
            const irregularity = (noiseValue1 * 0.7 + noiseValue2 * 0.3) - 0.5;
            const variation = irregularity * radius * 0.15; // 15% variation
            
            const r = radius / 2 + variation;
            const x = centerX + p.cos(angle) * r;
            const y = centerY + p.sin(angle) * r;
            
            p.curveVertex(x, y);
        }
        
        // Close the shape by repeating first few vertices
        for (let i = 0; i < 3; i++) {
            const angle = p.map(i, 0, numPoints, 0, p.TWO_PI);
            const noiseValue1 = p.noise(centerX * 0.01, centerY * 0.01, angle * 2);
            const noiseValue2 = p.noise(centerX * 0.02 + 100, centerY * 0.02, angle * 3);
            const irregularity = (noiseValue1 * 0.7 + noiseValue2 * 0.3) - 0.5;
            const variation = irregularity * radius * 0.15;
            const r = radius / 2 + variation;
            const x = centerX + p.cos(angle) * r;
            const y = centerY + p.sin(angle) * r;
            p.curveVertex(x, y);
        }
        
        p.endShape();
    }

    createP5Sketch() {
        const self = this;
        
        this.sketch = new p5((p) => {
            let lastRotationUpdate = 0;
            let clickableAreas = []; // Store clickable areas for each day
            
            p.setup = function() {
                const isMobile = p.windowWidth < 768;
                const canvasHeight = isMobile ? 700 : 900;
                const canvas = p.createCanvas(p.windowWidth * 0.9, canvasHeight);
                canvas.parent('mood-chart-container');
                p.frameRate(30);
            };

            p.draw = function() {
                // Update rotation angles every 500ms
                const currentTime = p.millis();
                if (currentTime - lastRotationUpdate > 500) {
                    lastRotationUpdate = currentTime;
                    const year = self.currentDate.getFullYear();
                    const month = self.currentDate.getMonth();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    
                    // Generate new random rotation angles for each day
                    for (let day = 1; day <= daysInMonth; day++) {
                        const monthKey = `${year}-${month}`;
                        if (!self.rotationAngles[monthKey]) {
                            self.rotationAngles[monthKey] = {};
                        }
                        self.rotationAngles[monthKey][day] = p.random(p.TWO_PI);
                    }
                }
                
                p.background(255, 255, 255); // White background
                
                // Clear clickable areas
                clickableAreas = [];
                
                const entriesByDate = self.getEntriesForMonth();
                const year = self.currentDate.getFullYear();
                const month = self.currentDate.getMonth();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                
                // Calendar grid settings
                const cols = 7;
                const rows = Math.ceil((daysInMonth + new Date(year, month, 1).getDay()) / cols);
                const cellWidth = p.width / cols;
                
                // Adjust cell height based on screen width (mobile vs desktop)
                const isMobile = p.width < 768;
                const totalHeight = isMobile ? 600 : 800;
                const cellHeight = totalHeight / rows;
                const maxCircleSize = Math.min(cellWidth, cellHeight) * 0.7;
                
                // Get first day of month (0 = Sunday, 1 = Monday, etc.)
                const firstDay = new Date(year, month, 1).getDay();
                
                // Draw day labels (Sun, Mon, Tue, etc.)
                const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                p.fill(100);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(14);
                p.noStroke();
                for (let i = 0; i < 7; i++) {
                    const x = i * cellWidth + cellWidth / 2;
                    p.text(dayLabels[i], x, 20);
                }
                
                for (let day = 1; day <= daysInMonth; day++) {
                    const dayEntries = entriesByDate[day] || [];
                    
                    // Calculate grid position
                    const dayIndex = day - 1 + firstDay;
                    const col = dayIndex % cols;
                    const row = Math.floor(dayIndex / cols);
                    
                    const x = col * cellWidth + cellWidth / 2;
                    const y = row * cellHeight + cellHeight / 2 + 50;
                    
                    // Draw date label
                    p.fill(51);
                    p.textSize(11);
                    p.text(day, x, y - maxCircleSize / 2 - 10);
                    
                    // Draw concentric circles for this day
                    if (dayEntries.length > 0) {
                        // Get rotation angle for this day
                        const monthKey = `${year}-${month}`;
                        if (!self.rotationAngles[monthKey]) {
                            self.rotationAngles[monthKey] = {};
                        }
                        if (self.rotationAngles[monthKey][day] === undefined) {
                            self.rotationAngles[monthKey][day] = p.random(p.TWO_PI);
                        }
                        const rotationAngle = self.rotationAngles[monthKey][day];
                        
                        // Sort entries by timestamp (oldest first)
                        dayEntries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                        
                        const radiusStep = maxCircleSize / (2 * dayEntries.length);
                        
                        // Store clickable area for this day
                        clickableAreas.push({
                            x: x,
                            y: y,
                            radius: maxCircleSize / 2,
                            year: year,
                            month: month,
                            day: day
                        });
                        
                        // Apply rotation
                        p.push();
                        p.translate(x, y);
                        p.rotate(rotationAngle);
                        
                        dayEntries.forEach((entry, index) => {
                            const radius = maxCircleSize - (index * radiusStep * 2);
                            const color = self.normalizeColor(entry.userCustomDesign?.userColor);
                            
                            // Draw ink blot style circle at origin (0, 0) since we translated
                            self.drawInkBlotCircle(p, 0, 0, radius, color);
                        });
                        
                        p.pop();
                    } else {
                        // Draw light circle for days with no entries
                        p.noFill();
                        p.stroke(200);
                        p.strokeWeight(1);
                        p.circle(x, y, maxCircleSize * 0.3);
                    }
                }
            };

            p.windowResized = function() {
                const isMobile = p.windowWidth < 768;
                const canvasHeight = isMobile ? 700 : 900;
                const newWidth = Math.min(p.windowWidth * 0.9, 1200);
                p.resizeCanvas(newWidth, canvasHeight);
            };
            
            p.mousePressed = function() {
                // Check if mouse is over any clickable area
                for (let area of clickableAreas) {
                    const distance = p.dist(p.mouseX, p.mouseY, area.x, area.y);
                    if (distance < area.radius) {
                        // Navigate to visualization page for this date
                        const date = new Date(area.year, area.month, area.day);
                        const dateString = date.toISOString().split('T')[0];
                        window.location.href = `visualization.html?date=${dateString}`;
                        return;
                    }
                }
            };
        });
    }

    redrawChart() {
        // Reset rotation angles for the new month
        const monthKey = `${this.currentDate.getFullYear()}-${this.currentDate.getMonth()}`;
        this.rotationAngles[monthKey] = {};
    }
}

// Initialize the app
new MoodChartApp();
