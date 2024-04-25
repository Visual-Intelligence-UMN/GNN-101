//data preprocessing

async function load_json(path){
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return await response.json(); 
    } catch (error) {
      console.error('There has been a problem with your fetch operation:', error);
    }
}
  

async function data_prep(o_data){
      try {
        var data = await load_json(o_data);
  
        var final_data = {
            "nodes":[], 
            "links":[]
        }
        var nodes = data.x;
        var edges = data.edge_index;
  
        for(var i=0; i<nodes.length; i++){
            var new_node = {
                "id":i,
                "name":i,
                "features":nodes[i]
            }
            final_data.nodes.push(new_node);
        }
        for(var i=0; i<edges[0].length; i++){
            var new_relation = {
                "source":edges[0][i],
                "target":edges[1][i]
            }
            final_data.links.push(new_relation);
        }
        
        return final_data; 
      } catch (error) {
        console.error('There has been an error in data_prep:', error);
      }
}

async function process(){
    var data = await data_prep("./input_graph.json");
    console.log(data);
    return data;
}
  
var data = await process(); 
console.log(data);


//prepare for the scratch graphs
var g_num = 3;

async function prep_graphs(g_num, data){
    var graphs = [];
    for(var i=0; i<g_num; i++){
        graphs.push(data);
    }
    console.log(graphs);
    return graphs;
}

var graphs = await prep_graphs(g_num);

// Import D3 version 7
import * as d3 from 'https://cdn.skypack.dev/d3@7';

// Set the dimensions and margins of the graph
const margin = { top: 10, right: 30, bottom: 30, left: 40 };
const width = 1600 - margin.left - margin.right;
const height = 1200 - margin.top - margin.bottom;

async function init(graphs){
// Append the SVG object to the body of the page
console.log(graphs);
const svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);


graphs.forEach((data, i)=>{
    const xOffset = i * (width + 60); 
  const g1 = svg.append("g")
    .attr("transform", `translate(${xOffset},${margin.top})`);

    // Initialize the links
    const link = g1
      .selectAll("line")
      .data(data.links)
      .join("line")
        .style("stroke", "#aaa");

    // Initialize the nodes
    const node = g1
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
        .attr("r", 10)
        .style("fill", "#69b3a2");

    // Define the simulation
    
    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id(d => d.id).distance(10))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", ticked);

    // Update positions each tick
    function ticked() {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    }
});
}

// Run the data processing and D3 initialization
async function processDataAndRunD3() {
    try {
      // Process data
      var processedData = await data_prep("./input_graph.json");
      var graphs_data = await prep_graphs(3, processedData);

      // Initialize and run D3 visualization with processed data
      await init(graphs_data);
    } catch (error) {
      console.error('Error in processDataAndRunD3:', error);
    }
}

// Start the process
processDataAndRunD3();