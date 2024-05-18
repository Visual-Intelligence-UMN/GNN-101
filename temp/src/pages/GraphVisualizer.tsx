import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { data_prep, prep_graphs, connectCrossGraphNodes, process, featureVisualizer } from '../utils/utils';

interface GraphVisualizerProps {
  graph_path: string;  
  intmData: null | any;
  changed: boolean;
}

const GraphVisualizer: React.FC<GraphVisualizerProps>=({graph_path, intmData, changed}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastIntmData = useRef(intmData);


  // This is really messy but init will stay at the top to remain in the scope of all functions
  
  console.log("updated",intmData);
  if(intmData != null){
    console.log("From Visualizer:", intmData);
  }


  useEffect(() => {
    const init = async (graphs: any[]) => {
      
      console.log("intmData", intmData);
      if(intmData != null){
        console.log("From Visualizer:", intmData);
      }


      console.log("path ", graph_path);
      let allNodes: any[] = [];
      const margin = { top: 10, right: 30, bottom: 30, left: 40 };
      const width = 3500 - margin.left - margin.right;
      const height = 1000 - margin.top - margin.bottom;
      const offset = 700;
      // Append the SVG object to the body of the page
      console.log(graphs);
      d3.select('#my_dataviz').selectAll('svg').remove();
    const svg = d3
        .select("#my_dataviz")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    graphs.forEach((data, i) => {
        console.log("i",i)
        const xOffset = (i - 1) * offset;
        const g1 = svg
            .append("g")
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

            const parallelogram = svg.append("path")
            .attr("d", `M${offset * (i + 1)}, ${height / 4} L${(2 + i) * offset}, ${height / 7} L${(2 + i) * offset}, ${height / 1.3} L${offset * (i + 1)}, ${height / 1.2} Z`)
            .attr("stroke", "black")
            .attr("fill", "none");
  
          // Define the simulation
          const simulation = d3.forceSimulation(data.nodes)
            .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(10))
            .force("charge", d3.forceManyBody().strength(-400))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .on("tick", ticked)
            .on("end", ended);
  
          // Update positions each tick
          function ticked() {
            link.attr("x1", (d:any) => d.source.x)
              .attr("y1", (d:any) => d.source.y)
              .attr("x2", (d:any) => d.target.x)
              .attr("y2", (d:any) => d.target.y)
              .attr("transform", function(d: any) {
                // Calculate the offset for each link
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const dr = Math.sqrt(dx * dx + dy * dy);
                const offsetX = 5 * (dy / dr); 
                const offsetY = 5 * (-dx / dr); 
  
                return `translate(${offsetX}, ${offsetY})`;
              });
  
            node.attr("cx", (d:any) => d.x)
              .attr("cy", (d:any) => d.y);
          }
  
          function ended() {
            let value = null;
            let index = 0;
            if (intmData != null) {
              if (i === 0) {value = intmData.conv1}
              if (i === 1) {value = intmData.conv2}
              if (i === 2) {value = intmData.conv3}
              if (i === 3) {value = intmData.final}
            }
            data.nodes.forEach((node:any) => {
              node.graphIndex = i;
              
              if (value != null && i <= 2) {
                node.features = value.subarray(64 * node.id, 64 * (node.id + 1))
              }
              if (value != null && i === 3) {
                node.features = value[index];
                index = index + 1;
              }
              allNodes.push(node);
            });
            if (i === graphs.length - 1) {
              if(graphs.length!=1){
                connectCrossGraphNodes(allNodes, svg, graphs, offset, height);
                featureVisualizer(svg, allNodes, offset);
              }
            }
          }
    });
    };

    const processDataAndRunD3 = async (num: number) => {
      try {
        setIsLoading(true);
        // Process data

        const processedData = await data_prep(graph_path);

        const graphsData = await prep_graphs(num, processedData);

        // Initialize and run D3 visualization with processe  d data
        await init(graphsData);
      } catch (error) {
        console.error('Error in processDataAndRunD3:', error);
      } finally {
        setIsLoading(false);
      }
    };
    

    if(intmData==null || changed){
      processDataAndRunD3(1);
    }else{
      processDataAndRunD3(4);
    }
    console.log('i fire once')
  }, [graph_path, intmData]);

  return <div id="my_dataviz" ref={containerRef} style={{
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'start',
    height: 'auto',
    overflow: 'auto', // this enables scrollbars if content overflows
    overflowX: 'auto',
  }}></div>
};
export default GraphVisualizer;