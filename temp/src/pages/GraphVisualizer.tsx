
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  data_prep,
  prep_graphs,
  connectCrossGraphNodes,
  featureVisualizer,
  process,
  myColor,
  softmax,
} from "../utils/utils";
import { IntmData } from "./FileUpload";
import { visualizeGraph } from "./WebUtils";
import { shiftGElements } from "@/utils/graphUtils"



interface GraphVisualizerProps {
  graph_path: string;
  intmData: null | IntmData;
  changed: boolean;
}

const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
  graph_path,
  intmData,
  changed,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastIntmData = useRef(intmData);

  console.log("updated", intmData);
  if (intmData != null) {
    console.log("From Visualizer:", intmData);
  }

  useEffect(() => {
    const init = async (graphs: any[]) => {
      console.log("intmData", intmData);
      if (intmData != null) {
        console.log("From Visualizer:", intmData);
      }

      console.log("path", graph_path);
      let allNodes: any[] = [];
      const offset = 600;
      const margin = { top: 10, right: 30, bottom: 30, left: 40 };
      const width = 6 * offset - margin.left - margin.right;
      const height = 1000 - margin.top - margin.bottom;

      // Append the SVG object to the body of the page
      d3.select("#my_dataviz").selectAll("svg").remove();
      const svg = d3
        .select("#my_dataviz")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
        

      graphs.forEach((data, i) => {
        console.log("i", i);
        console.log(data);

        const xOffset = (i - 2.5) * offset;
        const g1 = svg
          .append("g")
          
          .attr("transform", `translate(${xOffset},${margin.top})`)
          .attr("layerNum", i)
          
        



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
          .attr("r", 17)
          .style("fill", "white")
          .style("stroke", "#69b3a2")
          .style("stroke-width", 1)
          .style("stroke-opacity", 1)
          .attr("opacity", 1)
          



        const labels = g1
          .selectAll("text")
          .data(data.nodes)
          .join("text")
          .text((d: any) => d.id)
          .attr("font-size", `17px`);



          // Define the simulation
          const simulation = d3
            .forceSimulation(data.nodes)
            .force(
              "link",
              d3
                .forceLink(data.links)
                .id((d: any) => d.id)
                .distance(10)
            )

            .force("center", d3.forceCenter(width / 2, height / 2.8))
            .force("collide", d3.forceCollide().radius(20).strength(0.8))
            .force("aromatic", d3.forceManyBody().strength((d: any) => (d.is_aromatic ? -210: -100)).theta(0.9))
        
            .on("tick", function ticked() {
              link.attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y)
                .attr("transform", function (d: any) {
                  if (d.type === "double") {
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const dr = Math.sqrt(dx * dx + dy * dy);
                    const offsetX = 5 * (dy / dr);
                    const offsetY = 5 * (-dx / dr);
                    return `translate(${offsetX}, ${offsetY})`;
                  } 
                  else {
                    return null;
                  }
                })
                .style("stroke", function (d: any) {
                  if (d.type === "aromatic") {
                    return "purple";
                  }
                  else {
                    return "#aaa";
                  }
                }) ;

              node.attr("cx", (d: any) => d.x).attr(
                "cy",
                (d: any) => d.y
              );
              labels.attr("x", (d: any) => d.x - 6)
              .attr("y", (d: any) => d.y + 6);
            })
            .on("end", function ended() {
              let value = null;
              let index = 0;
              if (intmData != null) {
                if (i === 0) {
                  value = intmData.conv1;
                }
                if (i === 1) {
                  value = intmData.conv2;
                }
                if (i === 2) {
                  value = intmData.conv3;
                }
                if (i === 3) {
                  value = intmData.pooling;
                }
                if (i === 4) {
                  value = intmData.final;
                }
                if (i === 5) {
                  let final: any = intmData.final;
                  value = softmax(final);
                }
              }
              data.nodes.forEach((node: any) => {
                node.graphIndex = i;

                if (value != null && i <= 3 && value instanceof Float32Array) {
                  node.features = value.subarray(
                    64 * node.id,
                    64 * (node.id + 1)
                  );
                }
  
                if (value != null && i >= 4) {
                  node.features.push(value[index]);
                  index = index + 1;
                }
                allNodes.push(node);
              });

              let maxXDistance = 0;
              let maxYDistance = 0;
              const limitedNodes = data.nodes.slice(0, 17); // Why is it 17?

              limitedNodes.forEach((node1: any) => {
                limitedNodes.forEach((node2: any) => {
                  if (node1 !== node2) {
                    const xDistance = Math.abs(node1.x - node2.x);
                    const yDistance = Math.abs(node1.y - node2.y);
                    if (xDistance > maxXDistance) {
                      maxXDistance = xDistance;
                    }

                    if (yDistance > maxYDistance) {
                      maxYDistance = yDistance;
                    }
                  }
                });
              });
              
              const graphWidth = maxXDistance + 20
              const graphHeight = maxYDistance + 20;
              
              const point1 = { x: offset * (i), y: height / 8};
              const point2 = { x: (0.9 + i) * offset, y: height / 20};
              const point3 = { x: (0.9 + i) * offset, y: height / 1.7};
              const point4 = { x: (offset) * (i), y: height / 1.5};

              const x_dist = Math.abs(point1.x - point2.x);
              const y_dist = Math.abs(point1.y - point4.y)
              const centerX = (point1.x + point3.x) / 2;
              const centerY = (point1.y + point3.y) / 2;

              const tolerance = 140;

              let scaleX = ((graphWidth + tolerance + 20) / x_dist);
              let scaleY = ((graphHeight + tolerance + 20) / y_dist);
              let transform = `translate(${centerX}, ${centerY}) scale(${scaleX}, ${scaleY}) translate(${-centerX}, ${-centerY})`;

              if (graphWidth + tolerance < x_dist && graphHeight + tolerance < y_dist) {
                transform = `scale(1, 1)`;
              }
              const parallelogram = svg
                .append("polygon")  
                .attr("points", `${point1.x},${point1.y} ${point2.x},${point2.y} ${point3.x},${point3.y} ${point4.x},${point4.y}`)
                .attr("stroke", "black")
                .attr("fill", "none")
                .attr('transform', transform);
              

  
              let text = " ";
              if (i <= 2) {
                text = `GCNGconv${i + 1}`
              }
              if (i === 3) {
                text = "Pooling"
              }
              if (i === 4) {
                text = "Model Output"
              }
              if (i === 5) {
                text = "Prediction Result"
              }
              const textElement = svg.append("text")
              .attr("x", centerX)
              .attr("y", point4.y + 30) // position the text 30px below the bottom of the parallelogram
              .attr("text-anchor", "middle") // center the text horizontally
              .attr("fill", "black") // set the text color to black
              .attr("font-size", "15px") // set the font size to 15px
              .text(text);
              
              
                if (i === graphs.length - 2) {

                connectCrossGraphNodes(
                  allNodes,
                  svg,
                  graphs,
                  offset,
                );
                
                
                
              
              svg.selectAll("circle")
              .attr("opacity", 0);
              svg.selectAll("text")
              .attr("opacity", 0);
              featureVisualizer(svg, allNodes, offset, height);

             

              }


            });

 
        }
        

        
        

  )


}

    const visualizeGNN = async (num: number) => {
      try {
        setIsLoading(true);
        // Process data

        const processedData = await data_prep(graph_path);

        const graphsData = await prep_graphs(num, processedData);

        // Initialize and run D3 visualization with processe  d data
        await init(graphsData);
      } catch (error) {
        console.error("Error in visualizeGNN:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (intmData == null || changed) {
      visualizeGraph(graph_path);
    } else {
      visualizeGNN(3);
    }
    console.log("i fire once");
  }, [graph_path, intmData]);

  return (
    <div
      id="my_dataviz"
      ref={containerRef}
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "start",
        height: "auto",
        overflow: "auto", // this enables scrollbars if content overflows
        overflowX: "scroll",
      }}
    ></div>
  );
};

export default GraphVisualizer;
