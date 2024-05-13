import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { data_prep, prep_graphs, connectCrossGraphNodes, process} from '../utils/utils';

const GraphVisualizer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);


  // This is really messy but init will stay at the top to remain in the scope of all functions


  useEffect(() => {
    const init = async (graphs: any[], offset: number) => {
      let allNodes: any[] = [];
      const margin = { top: 10, right: 30, bottom: 30, left: 40 };
      const width = (graphs.length + 1) * offset;
      // Set the dimensions and margins of the graph
      const height = 1000;
      // Append the SVG object to the body of the page
      console.log(graphs);
      const container = d3.select('#my_dataviz')
      const svg = container
           .append('svg')
           .attr('width', width)
           .attr('height', height)
      

        // Define the simulation
        graphs.forEach((data, i) => {
          const xOffset = i * offset;
          const g1 = svg
              .append("g")
              .attr("transform", `translate(${xOffset},${margin.top})`);
          const parallelogram = svg
              .append("path")
              .attr("d", `M${offset * (i + 0.1)}, ${height/4} L${(1.01+i)*offset}, ${height/7} L${(1.01+i)*offset}, ${height/1.3} L${offset * (i + 0.1)}, ${height/1.2} Z`)
              .attr("stroke", "black")
              .attr("fill", "none"); 
         
  
          // Initialize the links
          const link = g1
              .selectAll("line")
              .data(data.links)
              .join("line")
              .style("stroke", "#aaa")
  
          // Initialize the nodes
          const node = g1
              .selectAll("circle")
              .data(data.nodes)
              .join("circle")
              .attr("r", 10)
              .style("fill", "#69b3a2");

              
  
          // Define the simulation
  
          const simulation = d3
              .forceSimulation(data.nodes)
              .force(
                  "link",
                  d3
                      .forceLink(data.links)
                      .id((d : any) => d.id)
                      .distance(10)
                      .strength(0.5) 
              )
              .force("charge", d3.forceManyBody().strength(-400))
              .force("center", d3.forceCenter(graphs.length * offset / 5, height / 2))
              .on("tick", ticked)
              .on("end", ended);
  
          // Update positions each tick
          function ticked() {

                  link.attr("x1", (d: any) => d.source.x)
                  .attr("y1", (d: any) => d.source.y)
                  .attr("x2", (d: any) => d.target.x)
                  .attr("y2", (d: any) => d.target.y)
                  .attr("transform", function(d: any) {
                    // Calculate the offset for each link
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const dr = Math.sqrt(dx * dx + dy * dy);
                    const offsetX = 5 * (dy / dr); // Adjust this value for different offsets
                    const offsetY = 5 * (-dx / dr); // Adjust this value for different offsets
      
                    
                    return `translate(${offsetX}, ${offsetY})`;
                    
                    
                  });    
  
              node.attr("cx", (d : any) => d.x).attr("cy", (d : any) => d.y);
          }
  
          function ended() {
              data.nodes.forEach((node : any) => {
                  node.graphIndex = i;
                  allNodes.push(node);
              });
              if (i === graphs.length - 1) {
                  connectCrossGraphNodes(allNodes, svg, graphs, offset, height);
              
              }
          }
      });
  }
  
  

    const processDataAndRunD3 = async () => {
      try {
        setIsLoading(true);
        // Process data

        const processedData = await data_prep("./input_graph.json");

        const graphsData = await prep_graphs(3, processedData);

        // Initialize and run D3 visualization with processe  d data
        await init(graphsData, 700);
      } catch (error) {
        console.error('Error in processDataAndRunD3:', error);
      } finally {
        setIsLoading(false);
      }
    };

    processDataAndRunD3();
  }, []);

  return <div id="my_dataviz" ref={containerRef} style={{
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'start',
    height: 'auto',
    overflow: 'auto', // this enables scrollbars if content overflows
    overflowX: 'scroll',
  }}></div>
};
export default GraphVisualizer;
