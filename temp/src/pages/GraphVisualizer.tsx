import React, { useEffect, useRef, useState} from 'react';
import * as d3 from 'd3';

interface GraphVisualizerProps {
  graphData: any;
}

const GraphVisualizer: React.FC<GraphVisualizerProps> = ({ graphData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const margin = { top: 10, right: 30, bottom: 30, left: 40 };
  const width = 1600 - margin.left - margin.right;
  const height = 1200 - margin.top - margin.bottom;
  const [isLoading, setIsLoading] = useState(true);
  

  // This is really messy but init will stay at the top to remain in the scope of all functions
  const init = async (graphs: any[]) => {
    console.log('we have ' + graphs.length + ' graphs and the first one is ' + JSON.stringify(graphs[0]));
    
    const svg = containerRef.current && d3.select(containerRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);
try {
    graphs.forEach((data, i) => {
      console.log('entering at ' + i)
      const xOffset = i * (width + 60);
      const g1 = svg?.append("g")
        .attr("transform", `translate(${xOffset},${margin.top})`);
      // Initialize the links
      console.log('g1 is ' + g1)
      if (g1) {
        console.log('If i dont make it... const link murdered me </3')
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
      
      

      // Update positions each tick
      const ticked = () => {
        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);
        node
          .attr("cx", (d: any) => d.x)
          .attr("cy", (d: any) => d.y);
      }
      // Define the simulation
      const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(10)) 
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", ticked);

    } else {
      console.error('There has been an error in g1 :(((( ');
    }
    });
  } catch (error) {console.error('There has been an error in init :(((( ', error);}
  };

  useEffect(() => {
    const load_json = async (path: string) => {
      try {
        const response = await fetch(path);
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
      }
    }
    // data_prep
    async function data_prep(o_data: any){
      // Painful explicit typing because we are using Typescript
      type NodeType = {
        id: number;
        name: number;
        features: any; 
      };
      type LinkType = {
        source: number;
        target: number;
      };
      
      let final_data = {
        nodes: [] as NodeType[],
        links: [] as LinkType[],
      }

      try {
        var data = await load_json(o_data);
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
    } // end of data_prep
    // prep_graphs
    async function prep_graphs(g_num: number, data: any){
      var graphs = [];
      for(var i=0; i < g_num; i++){
          graphs.push(data);
      }
      return graphs;
    }

    const processDataAndRunD3 = async () => {
      try {
        setIsLoading(true);
        // Process data
        // const processedData = await data_prep("./input_graph.json");

        const graphsData = await prep_graphs(3, graphData);

        // Initialize and run D3 visualization with processed data
        await init(graphsData);
      } catch (error) {
        console.error('Error in processDataAndRunD3:', error);
      } finally {
        setIsLoading(false);
      }
    };

    processDataAndRunD3();
  }, [graphData]);

  return <div ref={containerRef} />;
};

export default GraphVisualizer;