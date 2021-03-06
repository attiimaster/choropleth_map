const eduUrl = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json';
const mapUrl = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json';

fetchData(eduUrl, mapUrl);

async function fetchData(eduUrl, mapUrl) {
  const edu = await d3.json(eduUrl);
  const map = await d3.json(mapUrl);
  drawSvg(edu, map);
}

function drawSvg(edu, map) {

//setup
const w = 960;
const h = 600;
const padding = 50;

console.log("edu", edu);
console.log("map", map);

const min = d3.min(edu, obj => obj.bachelorsOrHigher);
const max = d3.max(edu, obj => obj.bachelorsOrHigher);

const x = d3.scaleLinear()
  .domain([min, max])
  .range([600, 860]);

const color = d3.scaleThreshold()
  .domain(d3.range(min, max, (max - min)/9))
  .range(d3.schemeBuGn[9]);

const path = d3.geoPath();

const svg = d3.select("body")
              .append("svg")
              .attr("width", w)
              .attr("height", h)
        .attr("class", "svg");

//tooltip
const tooltip = d3.select("body")
  .append("div")
  .attr("id", "tooltip")
  .style("visibility", "hidden")

//counties
svg.append("g")
  .attr("class", "counties")
  .selectAll("path")
  .data(topojson.feature(map, map.objects.counties).features).enter()
  .append("path")
  .attr("class", "county")
  .attr("data-fips", d => d.id)
  .attr("data-education", d => getEduData(d.id).bachelorsOrHigher)
  .attr("d", path)
  .attr("fill", d => color(getEduData(d.id).bachelorsOrHigher))
  .on("mouseover", d => toggleTooltip(d.id))
  .on("mouseout", d => toggleTooltip(d.id))

//county borders
svg.append("path")
  .datum(topojson.mesh(map, map.objects.states, (a, b) => a !== b))
  .attr("class", "states")
  .attr("d", path);

//legend
const legend = svg.append("g")
  .attr("id", "legend")
  .attr("transform", "translate(0, 40)");

legend.selectAll("rect")
  .data(color.range().map(d => {
      d = color.invertExtent(d);
      if (d[0] == null) d[0] = x.domain()[0];
      if (d[1] == null) d[1] = x.domain()[1];
      return d;
    }))
  .enter().append("rect")
    .attr("height", 8)
    .attr("x", d => x(d[0]))
    .attr("width", d => x(d[1]) - x(d[0]))
    .attr("fill", d => color(d[0]));

legend.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("Bachelors Degree or higher");

legend.call(d3.axisBottom(x)
    .tickSize(13)
    .tickFormat(x => Math.floor(x) + "%")
    .tickValues(color.domain()))
  .select(".domain")
    .remove();


  function getEduData(id) {
    for (let i=0; i<edu.length;i++) {
      if (edu[i].fips === id) {
        return edu[i];
      }
    }
  }
  function toggleTooltip(id) {
    const visibility = document.getElementById("tooltip").style.visibility;
    const d = getEduData(id);
    visibility === "hidden" ? 
      tooltip.style("visibility", "visible")
        .attr("data-fips", d.id)
        .attr("data-education", d.bachelorsOrHigher)
        .style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px")
        .text(d.area_name + "(" + d.state + ")" + ": " + d.bachelorsOrHigher + "%")
      :
      tooltip.style("visibility", "hidden")
  }
}