class MoodVisualization {
    constructor() {
        // Check for date parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const dateParam = urlParams.get('date');
        
        if (dateParam) {
            this.selectedDate = new Date(dateParam);
        } else {
            this.selectedDate = new Date();
        }
        
        this.entries = [];
        this.margin = { top: 40, right: 20, bottom: 80, left: 60 };
        
        // Ensure minimum width and proper calculation
        const containerWidth = Math.max(window.innerWidth - 120, 380); // Minimum 600px
        this.width = Math.min(containerWidth, 1000) - this.margin.left - this.margin.right;
        this.height = 400 - this.margin.top - this.margin.bottom;
        
        console.log('Chart dimensions:', { width: this.width, height: this.height });
        
        this.init();
    }

    async init() {
        try {
            console.log('Starting visualization initialization...');
            
            this.bindEvents();
            console.log('Events bound successfully');
            
            await this.loadEntries();
            console.log('Entries loaded successfully');
            
            this.setupVisualization();
            console.log('Visualization setup complete');
            
            this.updateDateDisplay();
            console.log('Date display updated');
            
            this.renderVisualization();
            console.log('Visualization rendered successfully');
            
        } catch (error) {
            console.error('Error during initialization:', error);
            document.getElementById('mood-chart').innerHTML = 
                `<div style="padding: 40px; text-align: center; color: #666;">
                    <p><strong>Error loading visualization:</strong></p>
                    <p>${error.message}</p>
                    <p>Please check the console for more details.</p>
                </div>`;
        }
    }

    bindEvents() {
        try {
            console.log('Binding events...');
            
            const backBtn = document.getElementById('back-btn');
            const moodChartBtn = document.getElementById('mood-chart-btn');
            const prevDayBtn = document.getElementById('prev-day');
            const nextDayBtn = document.getElementById('next-day');
            
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    window.location.href = 'index.html';
                });
            } else {
                console.warn('back-btn element not found');
            }

            if (moodChartBtn) {
                moodChartBtn.addEventListener('click', () => {
                    window.location.href = 'mood-chart.html';
                });
            } else {
                console.warn('mood-chart-btn element not found');
            }

            if (prevDayBtn) {
                prevDayBtn.addEventListener('click', () => {
                    this.selectedDate.setDate(this.selectedDate.getDate() - 1);
                    this.updateDateDisplay();
                    this.renderVisualization();
                });
            } else {
                console.warn('prev-day element not found');
            }

            if (nextDayBtn) {
                nextDayBtn.addEventListener('click', () => {
                    this.selectedDate.setDate(this.selectedDate.getDate() + 1);
                    this.updateDateDisplay();
                    this.renderVisualization();
                });
            } else {
                console.warn('next-day element not found');
            }
            
            // Add window resize handler for responsive behavior
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    console.log('Window resized, refreshing visualization...');
                    this.renderVisualization();
                }, 250); // Debounce resize events
            });
            
            console.log('Events bound successfully');
        } catch (error) {
            console.error('Error binding events:', error);
        }
    }

    async loadEntries() {
        try {
            console.log('Loading entries...');
            const response = await fetch('/api/entries');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.entries = await response.json();
            console.log('Loaded entries:', this.entries.length);
        } catch (error) {
            console.error('Error loading entries:', error);
            this.entries = [];
            
            // Show error message in chart area
            document.getElementById('mood-chart').innerHTML = 
                '<p style="text-align: center; color: #666; padding: 40px;">Unable to load journal entries. Please make sure the server is running.</p>';
        }
    }

    updateDateDisplay() {
        const dateStr = this.selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        document.getElementById('selected-date').textContent = dateStr;
    }

    getEntriesForDate(date) {
        const dateStr = date.toDateString();
        return this.entries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate.toDateString() === dateStr;
        }).map(entry => ({
            id: entry.id,
            hour: new Date(entry.timestamp).getHours(),
            sentiment: entry.sentimentAnalysis?.sentimentScore || 50,
            color: this.normalizeColor(entry.userCustomDesign?.userColor) || '#29BD67',
            emotion: entry.sentimentAnalysis?.emotionalCategory || 'neutral',
            text: entry.userInput
        }));
    }

    normalizeColor(color) {
        if (!color) return '#29BD67';
        
        // If it's already a hex color, return as is
        if (color.startsWith('#')) return color;
        
        // Convert named colors to hex approximations
        const colorMap = {
            'yellow': '#FFFF00',
            'dark grey': '#696969', 
            'warm yellow': '#FFD700',
            'emerald': '#50C878',
            'burnt orange': '#CC5500',
            'red': '#FF0000',
            'blue': '#0000FF',
            'green': '#008000',
            'purple': '#800080',
            'pink': '#FFC0CB',
            'black': '#000000',
            'white': '#FFFFFF',
            'gray': '#808080',
            'grey': '#808080'
        };
        
        return colorMap[color.toLowerCase()] || color;
    }

    setupVisualization() {
        try {
            console.log('Setting up visualization...');
            
            // Check if mood-chart element exists
            const chartElement = document.getElementById('mood-chart');
            if (!chartElement) {
                throw new Error('Chart container element #mood-chart not found');
            }
            
            // Clear previous visualization
            d3.select("#mood-chart").selectAll("*").remove();

            // Calculate responsive dimensions
            const container = document.getElementById('mood-chart');
            const containerWidth = container.clientWidth || 800;
            const isMobile = window.innerWidth <= 768;
            
            // Adjust dimensions for mobile
            this.width = Math.max(containerWidth - this.margin.left - this.margin.right, 300);
            this.height = isMobile ? 250 : 400; // Even more compact on mobile
            this.margin = {
                top: 15,
                right: isMobile ? 10 : 30,
                bottom: isMobile ? 35 : 40, // Less space for labels
                left: isMobile ? 15 : 40
            };

            // Create SVG with responsive dimensions
            const svgWidth = this.width + this.margin.left + this.margin.right;
            const svgHeight = this.height + this.margin.top + this.margin.bottom;
            
            console.log('SVG dimensions:', { svgWidth, svgHeight, width: this.width, height: this.height, isMobile });
            
            if (svgWidth <= 0 || svgHeight <= 0) {
                throw new Error(`Invalid chart dimensions: width=${svgWidth}, height=${svgHeight}`);
            }

            this.svg = d3.select("#mood-chart")
                .append("svg")
                .attr("width", svgWidth)
                .attr("height", svgHeight)
                .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`) // Make responsive
                .attr("preserveAspectRatio", "xMidYMid meet")
                .style("max-width", "100%")
                .style("height", "auto")
                .append("g")
                .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        // Setup scales
        this.xScale = d3.scaleBand()
            .domain(d3.range(0, 24, 2)) // Every 2 hours: 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22
            .range([0, this.width])
            .padding(isMobile ? 0.3 : 0.2); // More padding on mobile

        this.yScale = d3.scaleLinear()
            .domain([0, 100])
            .range([this.height, 0]);

        console.log('Scales created:', { 
            xDomain: this.xScale.domain(), 
            xRange: this.xScale.range(),
            yDomain: this.yScale.domain(),
            yRange: this.yScale.range()
        });

        // Add axes - only x-axis
        const xAxis = this.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisBottom(this.xScale).tickFormat(d => `${d}:00`).tickSize(0)); // Remove tick lines
            
        // Remove the axis domain line
        xAxis.select(".domain").remove();
            
        // Style axis for mobile
        xAxis.selectAll("text")
            .style("font-size", isMobile ? "9px" : "10px")
            .style("fill", "white")
            .style("text-anchor", isMobile ? "end" : "middle")
            .attr("transform", isMobile ? "rotate(-45)" : null)
            .attr("dx", isMobile ? "-0.8em" : null)
            .attr("dy", isMobile ? "0.15em" : null);

        // Remove y-axis and labels - no longer needed
        console.log('Visualization setup completed successfully');
        
        } catch (error) {
            console.error('Error in setupVisualization:', error);
            throw error;
        }
    }

    renderVisualization() {
        console.log('Rendering visualization...');
        
        const dayEntries = this.getEntriesForDate(this.selectedDate);
        console.log('Day entries:', dayEntries);
        
        // Update insights
        this.updateInsights(dayEntries);

        // Define gradient for hour bars
        const defs = this.svg.select("defs").empty() 
            ? this.svg.append("defs") 
            : this.svg.select("defs");
        
        const gradient = defs.append("linearGradient")
            .attr("id", "hourBarGradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");
        
        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#333")
            .attr("stop-opacity", 0.05);
        
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#333")
            .attr("stop-opacity", 0.5);

        // Draw hour bars
        const bars = this.svg.selectAll(".hour-bar")
            .data(d3.range(0, 24, 2));

        bars.enter()
            .append("rect")
            .attr("class", "hour-bar")
            .merge(bars)
            .attr("x", d => this.xScale(d))
            .attr("y", 0)
            .attr("width", this.xScale.bandwidth())
            .attr("height", this.height)
            .attr("rx", this.xScale.bandwidth() / 2)
            .attr("ry", this.xScale.bandwidth() / 2)
            .attr("fill", "url(#hourBarGradient)")
            .attr("stroke", "#ddd")
            .attr("stroke-width", 0);

        console.log('Bars drawn, bandwidth:', this.xScale.bandwidth());

        // Draw mood dots
        const dots = this.svg.selectAll(".mood-dot")
            .data(dayEntries);

        dots.exit().remove();

        dots.enter()
            .append("circle")
            .attr("class", "mood-dot")
            .merge(dots)
            .attr("cx", d => {
                // Find the closest 2-hour mark
                const hourMark = Math.floor(d.hour / 2) * 2;
                return this.xScale(hourMark) + this.xScale.bandwidth() / 2;
            })
            .attr("cy", d => this.yScale(d.sentiment))
            .attr("r", window.innerWidth <= 768 ? 16 : 24) // 2x larger dot size
            .attr("fill", d => d.color)
            .attr("stroke", "#fff")
            .attr("stroke-width", 0)
            .style("cursor", "pointer")
            .on("mouseover", (event, d) => this.showTooltip(event, d))
            .on("mouseout", () => this.hideTooltip())
            .on("click", (event, d) => {
                event.preventDefault();
                
                // Navigate to edit page with entry ID
                window.location.href = `edit-entry.html?id=${d.id}`;
            });
    }

    showTooltip(event, d) {
        // Remove any existing tooltip first
        this.hideTooltip();
        
        const isMobile = window.innerWidth <= 768;
        
        const tooltip = d3.select("body").append("div")
            .attr("class", "mood-tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.9)")
            .style("color", "white")
            .style("padding", "12px")
            .style("border-radius", "8px")
            .style("font-size", isMobile ? "14px" : "12px")
            .style("pointer-events", "none")
            .style("z-index", "9999")
            .style("max-width", isMobile ? "90vw" : "300px")
            .style("word-wrap", "break-word")
            .style("line-height", "1.4")
            .style("box-shadow", "0 4px 15px rgba(0, 0, 0, 0.3)")
            .style("opacity", 0);

        // Simple, readable content
        const entryText = d.text.length > 150 ? d.text.substring(0, 150) + '...' : d.text;
        
        tooltip.html(`
            <div style="margin-bottom: 8px;">
                <strong>${d.hour}:00</strong>
            </div>
            <div style="border-top: 1px solid rgba(255,255,255,0.3); padding-top: 8px; font-style: italic;">
                "${entryText}"
            </div>
        `);

        // Show tooltip
        tooltip.transition()
            .duration(200)
            .style("opacity", 1);

        // Position tooltip
        const rect = tooltip.node().getBoundingClientRect();
        let left = event.pageX + 10;
        let top = event.pageY - rect.height - 10;

        // Keep tooltip on screen
        if (left + rect.width > window.innerWidth) {
            left = event.pageX - rect.width - 10;
        }
        if (top < 0) {
            top = event.pageY + 20;
        }

        // Center on mobile
        if (isMobile) {
            left = (window.innerWidth - rect.width) / 2;
            top = event.pageY - rect.height - 30;
            if (top < 50) top = event.pageY + 30;
        }

        tooltip
            .style("left", left + "px")
            .style("top", top + "px");

        // Add click-to-dismiss on mobile
        if (isMobile) {
            const dismissHandler = (e) => {
                this.hideTooltip();
                document.removeEventListener('click', dismissHandler);
            };
            // Small delay to prevent immediate dismissal
            setTimeout(() => {
                document.addEventListener('click', dismissHandler);
            }, 100);
        }
    }

    hideTooltip() {
        d3.selectAll(".mood-tooltip").remove();
    }
    
    updateInsights(dayEntries) {
        const insightsDiv = document.getElementById('data-insights');
        const insightText = document.getElementById('insight-text');
        
        if (dayEntries.length === 0) {
            insightsDiv.style.display = 'none';
        } else {
            // Find entry with most deviation from 50 (neutral)
            let maxDeviation = 0;
            let highlightEntry = null;
            
            dayEntries.forEach(entry => {
                const originalEntry = this.entries.find(e => e.id === entry.id);
                const deviation = Math.abs(entry.sentiment - 50);
                
                if (deviation > maxDeviation) {
                    maxDeviation = deviation;
                    highlightEntry = {
                        ...entry,
                        category: originalEntry?.sourceEvent?.category || 'an event'
                    };
                }
            });
            
            if (highlightEntry) {
                insightText.textContent = `You felt ${highlightEntry.emotion} from ${highlightEntry.category}`;
                
                // Update styling with entry color
                const entryColor = highlightEntry.color;
                insightsDiv.style.borderLeftColor = entryColor;
                insightsDiv.style.display = 'block';
            } else {
                insightsDiv.style.display = 'none';
            }
        }
        
        // Update weekly insights
        this.updateWeeklyInsights();
    }
    
    updateWeeklyInsights() {
        const weeklyInsightsDiv = document.getElementById('weekly-insights');
        const weeklyInsightText = document.getElementById('weekly-insight-text');
        
        // Get start and end of current week (Sunday to Saturday)
        const currentDate = new Date(this.selectedDate);
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
        
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        // Filter entries for this week
        const weekEntries = this.entries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= weekStart && entryDate <= weekEnd;
        });
        
        if (weekEntries.length === 0) {
            weeklyInsightsDiv.style.display = 'none';
            return;
        }
        
        // Calculate sum of sentiment scores by category
        const categoryScores = {};
        
        weekEntries.forEach(entry => {
            const category = entry.sourceEvent?.category || 'uncategorized';
            const score = entry.sentimentAnalysis?.sentimentScore || 50;
            
            if (!categoryScores[category]) {
                categoryScores[category] = {
                    sum: 0,
                    count: 0
                };
            }
            
            categoryScores[category].sum += score;
            categoryScores[category].count += 1;
        });
        
        // Find most positive and most negative categories
        let mostPositive = null;
        let mostNegative = null;
        let highestSum = -Infinity;
        let lowestSum = Infinity;
        
        Object.entries(categoryScores).forEach(([category, data]) => {
            if (data.sum > highestSum) {
                highestSum = data.sum;
                mostPositive = category;
            }
            if (data.sum < lowestSum) {
                lowestSum = data.sum;
                mostNegative = category;
            }
        });
        
        if (mostPositive && mostNegative) {
            weeklyInsightText.textContent = `This week ${mostPositive} gives you the most positivity; ${mostNegative} cause the most negativity.`;
            
            // CSS handles the background styling
            weeklyInsightsDiv.style.display = 'block';
        } else {
            weeklyInsightsDiv.style.display = 'none';
        }
    }
}

// Initialize visualization when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    // Check if D3 is loaded
    if (typeof d3 === 'undefined') {
        console.error('D3.js is not loaded!');
        document.getElementById('mood-chart').innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">D3.js library failed to load. Please refresh the page.</p>';
        return;
    }
    
    console.log('D3.js loaded successfully, version:', d3.version);
    
    // Small delay to ensure everything is ready
    setTimeout(() => {
        new MoodVisualization();
    }, 100);
});