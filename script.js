const DATA_PATH = "dataset.csv";

let currentScene = 1;
let movieData = [];

const TOTAL_SCENES = 3;

const margin = {
  top: 60,
  right: 70,
  bottom: 80,
  left: 105
};

const outerWidth = 1000;
const outerHeight = 540;
const width = outerWidth - margin.left - margin.right;
const height = outerHeight - margin.top - margin.bottom;

const formatBillions = value =>
  `$${d3.format(".2f")(value / 1_000_000_000)}B`; // make it look like "$14.03B"

const formatPercent = d3.format(".1%");

const sceneText = {
  1: {
    heading: "Before the Pandemic: A Stable Box Office",
    description:
      "From 2016 through 2019, the domestic box office remained consistent, with inflation-adjusted revenue from the top-ranked films staying between $13 billion and $14 billion each year."
  },
  2: {
    heading: "Post-Pandemic:Immediate Collapse and an Imcomplete Recovery",
    description:
      "The top-ranked domestic box office fell nearly 80% in 2020. Revenue rebounded over the next three years, but even the 2023 peak remained far below the average level seen from 2016 through 2019."
  },
  3: {
    heading: "Action Films Powered the Early Recovery",
    description:
      "The recovery was not evenly distributed across genres. Action films generated more than half of top-ranked box-office revenue in both 2021 and 2022, showing how heavily the first phase of the rebound depended on this genre. Hover over bar chart to see the percentages of other genres."
  }
  // add more scenes?
};

function parseRow(d) {
  return {
    year: +d.year,
    ranking: +d.ranking,
    title: d.title,
    releaseDate: new Date(`${d.releaseDate}T00:00:00`),
    releaseYear: +d.releaseYear,
    releaseMonth: +d.releaseMonth,
    distributor: d.distributor,
    genre: d.genre,
    gross: +d.gross,
    ticketsSold: +d.ticketsSold
  };
}

function validRow(d) {
  return (
    Number.isFinite(d.year) &&
    Number.isFinite(d.ranking) &&
    Number.isFinite(d.gross) &&
    Number.isFinite(d.ticketsSold)
  );
}

function renderScene() {
  const text = sceneText[currentScene];

  d3.select("#scene-heading").text(text.heading);
  d3.select("#scene-copy").text(text.description);
  d3.select("#scene-progress").text(`Scene ${currentScene} of ${TOTAL_SCENES}`);

  d3.select("#previous-button").property("disabled", currentScene === 1);
  d3.select("#next-button")
    .property("disabled", currentScene === TOTAL_SCENES);

  if (currentScene === 1) {
    renderSceneOne(movieData);
  } else if (currentScene === 2) {
    renderSceneTwo(movieData);
  } else if (currentScene === 3) {
    renderSceneThree(movieData);
  } else {
    // .... have some more ideas but I dont think i hvae time
  }
}

function createSvg() {
  const chart = d3.select("#chart");
  chart.selectAll("*").remove();
  const svg = chart.append("svg").attr("viewBox", `0 0 ${outerWidth} ${outerHeight}`);
  const plot = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  return { svg, plot };
}

/** convert Data from csv into MAP {2016--> gross, 2017--- gross} etc */
function annualGrossData(data, startYear, endYear) {
  return Array.from(
    d3.rollup(data.filter(d => d.year >= startYear && d.year <= endYear),
      rows => d3.sum(rows, d => d.gross),
      d => d.year
    ),
    ([year, totalGross]) => ({ year, totalGross })
  ).sort((a, b) => d3.ascending(a.year, b.year));
}

/* Helper function for annotating*/
function addAnnotation({
  plot,
  boxX,
  boxY,
  boxWidth,
  boxHeight,
  targetX,
  targetY,
  heading,
  lines,
  red = false,
  lineAnchor = "top-left"
}) {
  let x1, y1;

  if (lineAnchor === "bottom-middle") {
    x1 = boxX + boxWidth / 2;
    y1 = boxY + boxHeight;
  } else {
    // Default to top-left
    x1 = boxX;
    y1 = boxY;
  }

  plot.append("line")
    .attr("class", red ? "annotation-line-red" : "annotation-line")
    .attr("x1", x1)
    .attr("y1", y1)
    .attr("x2", targetX)
    .attr("y2", targetY);

  const annotation = plot.append("g")
    .attr("transform", `translate(${boxX},${boxY})`);

  annotation.append("rect")
    .attr("class", red ? "annotation-box-red" : "annotation-box")
    .attr("width", boxWidth)
    .attr("height", boxHeight)
    .attr("rx", 10);

  annotation.append("text")
    .attr("class", "annotation-heading")
    .attr("x", 16)
    .attr("y", 27)
    .text(heading);

  const body = annotation
    .append("text")
    .attr("class", "annotation-text")
    .attr("x", 16)
    .attr("y", 52);

  lines.forEach((line, index) => {
    body.append("tspan")
      .attr("x", 16)
      .attr("dy", index === 0 ? 0 : 20)
      .text(line);
  });
}

function renderSceneOne(data) {
  /** only do pre pandemic years */
  const sceneData = annualGrossData(data, 2016, 2019);
  const { svg, plot } = createSvg();

  const x = d3.scalePoint()
    .domain(sceneData.map(d => d.year))
    .range([0, width])
    .padding(0.25);

  const y = d3.scaleLinear()
    .domain([12_500_000_000, 14_500_000_000]).nice().range([height, 0]);

   /* grid lines */
  plot.append("g")
    .attr("class", "grid")
    .call(
      d3.axisLeft(y).ticks(6).tickSize(-width).tickFormat("")
    );

    /** bottom axis */
  plot.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickSizeOuter(0));
  svg.append("text").attr("class", "axis-label")
    .attr("x", margin.left + width / 2)
    .attr("y", outerHeight - 18).attr("text-anchor", "middle")
    .text("Ranking year");

   /** left axis */
  plot.append("g")
    .attr("class", "axis")
    .call(
      d3.axisLeft(y)
        .ticks(6)
        .tickFormat(formatBillions)
    );
  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + height / 2))
    .attr("y", 24).attr("text-anchor", "middle")
    .text("Inflation-adjusted gross");

    /**
     * line
     */
  const line = d3.line().x(d => x(d.year))
    .y(d => y(d.totalGross));

  plot.append("path")
    .datum(sceneData)
    .attr("class", "data-line")
    .attr("d", line);

  plot.selectAll(".data-point")
    .data(sceneData)
    .join("circle")
    .attr("class", "data-point")
    .attr("cx", d => x(d.year))
    .attr("cy", d => y(d.totalGross))
    .attr("r", 7);

  plot.selectAll(".value-label")
    .data(sceneData)
    .join("text")
    .attr("class", "value-label")
    .attr("x", d => x(d.year))
    .attr("y", d => y(d.totalGross) - 16)
    .attr("text-anchor", "middle")
    .text(d => formatBillions(d.totalGross));

  addAnnotation({
    plot,
    boxX: width * 0.56,
    boxY: 230,
    boxWidth: 285,
    boxHeight: 105,
    targetX: (x(2017) + x(2018)) / 2,
    targetY: y(d3.mean(sceneData, d => d.totalGross)),
    heading: "A stable baseline",
    lines: [
      "Annual adjusted gross remained",
      "between about $13B and $14B",
      "from 2016 through 2019."
    ]
  });
}

function renderSceneTwo(data) {
  const sceneData = annualGrossData(data, 2016, 2025); //exclude 2026 bc incomplete
  const { svg, plot } = createSvg();

  const x = d3.scalePoint()
    .domain(sceneData.map(d => d.year))
    .range([0, width])
    .padding(0.15);

  const y = d3.scaleLinear()
    .domain([0, d3.max(sceneData, d => d.totalGross)])
    .nice()
    .range([height, 0]);

  plot.append("g")
    .attr("class", "grid")
    .call(
      d3.axisLeft(y).ticks(6).tickSize(-width).tickFormat("")
    );

  plot.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickSizeOuter(0));

  plot.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y)
        .ticks(6)
        .tickFormat(formatBillions)
    );

  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", margin.left + width / 2)
    .attr("y", outerHeight - 18).attr("text-anchor", "middle")
    .text("Ranking year");

  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + height / 2))
    .attr("y", 24).attr("text-anchor", "middle")
    .text("Inflation-adjusted gross");

  const line = d3.line().x(d => x(d.year))
    .y(d => y(d.totalGross));

  plot.append("path").datum(sceneData)
    .attr("class", "data-line")
    .attr("d", line);

    /**highlight 2020 one in red and make bigger */
  plot.selectAll(".scene-two-point").data(sceneData).join("circle")
    .attr("class", d => d.year === 2020 ? "data-point-red" : "data-point")
    .attr("cx", d => x(d.year))
    .attr("cy", d => y(d.totalGross))
    .attr("r", d => d.year === 2020 ? 8 : 6);


    /** calc statistic values */
  const collapse = sceneData.find(d => d.year === 2020);
  const peakRecovery = sceneData.find(d => d.year === 2023);
  const prePandemicAverage = d3.mean(
    sceneData.filter(d => d.year >= 2016 && d.year <= 2019),
    d => d.totalGross
  );
  const recoveryPercent = peakRecovery.totalGross / prePandemicAverage;

  addAnnotation({
    plot,
    boxX: width * 0.06,
    boxY: height * 0.60,
    boxWidth: 250,
    boxHeight: 104,
    targetX: x(2020),
    targetY: y(collapse.totalGross),
    heading: "A 79.8% collapse",
    lines: [
      "Adjusted gross fell from $13.39B",
      "in 2019 to only $2.71B",
      "in 2020."
    ],
    red: true
  });

  addAnnotation({
    plot,
    boxX: width * 0.61,
    boxY: 35,
    boxWidth: 285,
    boxHeight: 104,
    targetX: x(2023),
    targetY: y(peakRecovery.totalGross),
    heading: "Recovery remained partial",
    lines: [
      `The 2023 peak reached only`,
      `${formatPercent(recoveryPercent)} of the 2016–2019`,
      "pre-pandemic average."
    ]
  });
}

function renderSceneThree(data) {
  const filtered = data.filter(d => d.year >= 2016 && d.year <= 2026);

  /** stacked bar chart */
  const topGenres = ["Action", "Adventure", "Comedy", "Horror"];
  const byYear = d3.rollup(filtered,
    rows => {
      const total = d3.sum(rows, d => d.gross);
      const shares = {};
      let topGenresGross = 0;

      topGenres.forEach(genre => {
        const genreGross = d3.sum(rows.filter(d => d.genre === genre), d => d.gross);
        shares[genre] = genreGross / total;
        topGenresGross += genreGross;
      });

      shares.Other = (total - topGenresGross) / total;
      return shares;
    },
    d => d.year
  );

  const sceneData = Array.from(byYear, ([year, shares]) => ({
    year,
    ...shares,
  })).sort((a, b) => d3.ascending(a.year, b.year));

  const categories = [...topGenres, "Other"];
  const stack = d3.stack().keys(categories)(sceneData);
  const {svg, plot} = createSvg();

  const x = d3.scaleBand().domain(sceneData.map(d => d.year)).range([0, width]).padding(0.16);
  const y = d3.scaleLinear().domain([0, 1]).range([height, 0]);

  plot.append("g")
    .attr("class", "grid")
    .call(
      d3.axisLeft(y).ticks(6).tickSize(-width).tickFormat("")
    );

  plot.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickSizeOuter(0));

  plot.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y).ticks(6).tickFormat(formatPercent)
    );

  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", margin.left + width / 2)
    .attr("y", outerHeight - 18).attr("text-anchor", "middle")
    .text("Ranking year");

  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + height / 2))
    .attr("y", 24).attr("text-anchor", "middle")
    .text("Share of annual gross");

  const color = d3.scaleOrdinal()
    .domain(categories)
    .range(["#cb71c8", "#6980f5", "#ca5153", "#d8b784", "#d9d9d9af"]);

  plot.selectAll(".series").data(stack)
    .join("g")
    .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(series => series.map(d => ({ ...d, key: series.key })))
    .join("rect")
    .attr("x", d => x(d.data.year))
    .attr("y", d => y(d[1]))
    .attr("height", d => y(d[0]) - y(d[1]))
    .attr("width", x.bandwidth())
    .on("mousemove", function(event, d) {
      const value = d.data[d.key];
      showTooltip(
        event,
        `<b>${d.data.year}</b><br>${d.key}: ${formatPercent(value)}`
      );
    })
    .on("mouseleave", hideTooltip);

  const labelYears = [2021, 2022]; // add labels for these 2 years sprcifically
  plot
    .selectAll(".action-label")
    .data(sceneData.filter(d => labelYears.includes(d.year)))
    .join("text")
    .attr("class", "value-label")
    .attr("x", d => x(d.year) + x.bandwidth() / 2)
    .attr("y", d => y(d.Action / 2))
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .text(d => formatPercent(d.Action));

  addLegend(svg, categories, color);

  const target = sceneData.find(d => d.year === 2021);

  addAnnotation({
    plot,
    boxX: 480,
    boxY: 300,
    boxWidth: 260,
    boxHeight: 80,
    targetX: x(2021) + x.bandwidth() / 2,
    targetY: y(target.Action),
    heading: "Action dominated the rebound",
    lines: [
      "Action in 2021 and 2022 produced more",
      "than every other genre combined."
    ]
  });

  const target2026 = sceneData.find(d => d.year === 2026);
  addAnnotation({
    plot,
    boxX: 700,
    boxY: 5,
    boxWidth: 300,
    boxHeight: 80,
    targetX: x(2026) + x.bandwidth() / 2,
    targetY: y(target2026[categories[0]]),
    heading: "2026 (In Progress)",
    lines: ["Data for the current year is incomplete",
      "but provides insight to most recent trends."],
    lineAnchor: "bottom-middle"
  });
}

function addLegend(svg, categories, color) {
  const legend = svg.append("g").attr("transform", `translate(${margin.left},${outerHeight - 48})`);

  const item = legend.selectAll("g").data(categories).join("g")
    .attr("transform", (d, i) => `translate(${i * 150},0)`);

  item.append("rect").attr("width", 14)
    .attr("height", 14)
    .attr("fill", d => color(d));

  item.append("text").attr("class", "legend").attr("x", 20)
    .attr("y", 12)
    .text(d => d);
}

function showTooltip(event, html) {
  const tooltip = d3.select("#tooltip");
  tooltip.html(html).property("hidden", false).style("left", `${event.clientX + 14}px`)
    .style("top", `${event.clientY + 14}px`);
}

function hideTooltip() {
  d3.select("#tooltip").property("hidden", true);
}

d3.csv(DATA_PATH, parseRow)
  .then(data => {
    movieData = data.filter(validRow);
    renderScene();
  })
  .catch(error => {
    console.error(error);
    d3.select("#status").text(
      "dataset could not be loaded"
    );
  });

d3.select("#previous-button").on("click", () => {
  if (currentScene > 1) {
    currentScene -= 1;
    renderScene();
  }
});

d3.select("#next-button").on("click", () => {
  if (currentScene < TOTAL_SCENES) {
    currentScene += 1;
    renderScene();
  }
});
