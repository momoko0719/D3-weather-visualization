// Set the dimensions for the overall SVG container
const margin = { top: 150, right: 100, bottom: 20, left: 90 },
  gridSize = 280, // size for each small multiple
  gridWidth = gridSize - margin.left - margin.right,
  gridHeight = gridSize - margin.top - margin.bottom,
  fullWidth = gridSize * 4 + margin.left + margin.right,
  fullHeight = gridSize * 3 + margin.top + margin.bottom;

// Define the scales for the x and y axes (actual precipitation and temperature)
const xScale = d3.scaleLinear().range([0, gridWidth]);
const yScale = d3.scaleLinear().range([gridHeight, 0]);

// Append the svg object to the body of the page, centered
const svg = d3
  .select("#my_dataviz")
  .append("svg")
  .attr("width", fullWidth)
  .attr("height", fullHeight)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Add a big title for the whole visualization
const title = svg
  .append("text")
  .attr("class", "title")
  .attr("x", fullWidth / 2)
  .attr("y", -margin.top / 2)
  .attr("text-anchor", "middle")
  .attr("font-size", "24px")
  .text("Temperature and Precipitation Trends from July 2014 to June 2015");

// Read the data
d3.csv("data/weather_data.csv").then(function (data) {
  data.forEach(function (d) {
    d.actual_precipitation = +d.actual_precipitation;
    d.actual_mean_temp = +d.actual_mean_temp;
    d.actual_min_temp = +d.actual_min_temp;
    d.actual_max_temp = +d.actual_max_temp;
    d.month = +d.month;
    d.year = +d.year;
  });

  const buttonContainer = d3
    .select("#my_dataviz")
    .append("div")
    .attr("class", "button-container")
    .style("text-align", "center")
    .style("margin-top", "20px");

  buttonContainer
    .selectAll("button")
    .data(["actual_mean_temp", "actual_min_temp", "actual_max_temp"])
    .enter()
    .append("button")
    .text((d) => d.replace("actual_", "").replace("_", " "))
    .on("click", function (event, metric) {
      updateChart(metric);
    });

  function updateChart(metric) {
    yScale.domain([
      0,
      d3.max(data, function (d) {
        return d[metric];
      }),
    ]);

    // Update the circles with new data
    svg
      .selectAll(".month-group")
      .selectAll("circle")
      .transition()
      .duration(500)
      .attr("cy", (d) => yScale(d[metric]));

    // Update the y-axis
    svg
      .selectAll(".y-axis")
      .transition()
      .duration(500)
      .call(d3.axisLeft(yScale));

    svg.selectAll(".month-group").each(function () {
      const group = d3.select(this);
      const month = +group.attr("data-month");
      const year = +group.attr("data-year");
      const monthlyData = data.filter(
        (d) => d.month === month && d.year === year
      );

      group
        .selectAll("circle")
        .data(monthlyData)
        .transition()
        .attr("cy", (d) => yScale(d[metric]));
    });
  }

  updateChart("actual_mean_temp");

  // Create a sequence for the months July 2014 to June 2015
  const timeParse = d3.timeParse("%Y-%m");
  const timeFormat = d3.timeFormat("%B %Y");
  const months = d3.timeMonth.range(timeParse("2014-07"), timeParse("2015-07"));

  // Set the domains of the axes
  xScale.domain(d3.extent(data, (d) => d.actual_precipitation));
  yScale.domain([0, d3.max(data, (d) => d.actual_mean_temp)]);

  const cityNames = {
    CLT: "Charlotte",
    CQT: "Los Angeles",
    IND: "Indianapolis",
    JAX: "Jacksonville",
  };
  const color = d3
    .scaleOrdinal()
    .domain(Object.keys(cityNames))
    .range(d3.schemeCategory10);

  // Create a small multiple for each month
  months.forEach(function (month, i) {
    const monthlyData = data.filter(
      (d) => d.month === month.getMonth() + 1 && d.year === month.getFullYear()
    );
    const monthlySvg = svg
      .append("g")
      .attr("class", "month-group")
      .attr("data-month", month.getMonth() + 1) // This should be a number
      .attr("data-year", month.getFullYear()) // This should be a number
      .attr(
        "transform",
        `translate(${(i % 4) * gridSize},${Math.floor(i / 4) * gridSize})`
      );

    // Draw the scatter plot for each city's data
    monthlyData.forEach(function (d) {
      monthlySvg
        .append("circle")
        .attr("cx", xScale(d.actual_precipitation))
        .attr("cy", yScale(d.actual_mean_temp))
        .attr("r", 4)
        .style("fill", color(d.city));
    });

    // Add x and y axes to each small multiple
    monthlySvg
      .append("g")
      .attr(
        "transform",
        `translate(0, ${gridSize - margin.top - margin.bottom})`
      )
      .call(
        d3
          .axisBottom(xScale)
          .ticks(3)
          .tickSize(-gridSize + margin.top + margin.bottom)
      )
      .append("text")
      .attr("fill", "#000")
      .attr("text-anchor", "end")
      .attr("x", gridWidth)
      .attr("y", 35)
      .attr("font-weight", "bold")
      .text("Precipitation (in)");

    monthlySvg
      .append("g")
      .call(
        d3
          .axisLeft(yScale)
          .ticks(3)
          .tickSize(-gridSize + margin.left + margin.right)
      )
      .append("text")
      .attr("fill", "#000")
      .attr("text-anchor", "end")
      .attr("y", -45)
      .attr("x", 0)
      .attr("transform", "rotate(-90)")
      .attr("font-weight", "bold")
      .text("Temperature (°F)");

    // Add centered titles (month and year) at the top of each small multiple
    monthlySvg
      .append("text")
      .attr("x", (gridSize - margin.left - margin.right) / 2)
      .attr("y", -margin.top / 4)
      .attr("dy", "1em")
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text(timeFormat(month));

    monthlySvg
      .selectAll("circle")
      .data(monthlyData)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.actual_precipitation))
      .attr("cy", (d) => yScale(d[currentMetric]))
      .attr("r", 4)
      .style("fill", (d) => color(d.city));
  });

  updateChart("actual_mean_temp");

  // Add a legend for the color values, positioned to the right of the grid
  const legend = svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + (margin.right + 900) + ", 10)");

  legend
    .selectAll("mydots")
    .data(Object.entries(cityNames))
    .enter()
    .append("circle")
    .attr("cx", 0)
    .attr("cy", function (d, i) {
      return 100 + i * 25;
    })
    .attr("r", 7)
    .style("fill", function (d) {
      return color(d[0]);
    });

  legend
    .selectAll("mylabels")
    .data(Object.entries(cityNames))
    .enter()
    .append("text")
    .attr("x", 20)
    .attr("y", function (d, i) {
      return 100 + i * 25;
    })
    .text(function (d) {
      return d[1];
    })
    .attr("text-anchor", "left")
    .style("alignment-baseline", "middle");
});
