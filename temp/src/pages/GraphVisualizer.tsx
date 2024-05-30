import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  data_prep,
  prep_graphs,
  connectCrossGraphNodes,
  featureVisualizer,
  process,
} from "../utils/utils";
import { IntmData } from "./FileUpload";
import { visualizeGraph } from "./WebUtils";

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
      const offset = 1000;
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

        if (data.nodes) {
          const xOffset = (i - 2.5) * offset;
          const g1 = svg
            .append("g")
            .attr(
              "transform",
              `translate(${xOffset},${margin.top})`
            );

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
          const simulation = d3
            .forceSimulation(data.nodes)
            .force(
              "link",
              d3
                .forceLink(data.links)
                .id((d: any) => d.id)
                .distance(10)
            )
            .force("charge", d3.forceManyBody().strength(-400))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .on("tick", function ticked() {
              link.attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y)
                .attr("transform", function (d: any) {
                  // Calculate the offset for each link
                  const dx = d.target.x - d.source.x;
                  const dy = d.target.y - d.source.y;
                  const dr = Math.sqrt(dx * dx + dy * dy);
                  const offsetX = 5 * (dy / dr);
                  const offsetY = 5 * (-dx / dr);

                  return `translate(${offsetX}, ${offsetY})`;
                });

              node.attr("cx", (d: any) => d.x).attr(
                "cy",
                (d: any) => d.y
              );
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
                  value = intmData.final;
                }
              }
              data.nodes.forEach((node: any) => {
                node.graphIndex = i;

                if (value != null && i <= 2) {
                  node.features = value.subarray(
                    64 * node.id,
                    64 * (node.id + 1)
                  );
                }
                if (value != null && i === 3) {
                  node.features = value[index];
                  index = index + 1;
                }
                allNodes.push(node);
              });
              let maxXDistance = 0;
              let maxYDistance = 0;
              const limitedNodes = data.nodes.slice(0, 17);

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
              
              const point1 = { x: offset * (i + 0.1), y: height / 4 };
              const point2 = { x: (0.9 + i) * offset, y: height / 7 };
              const point3 = { x: (0.9 + i) * offset, y: height / 1.3 };
              const point4 = { x: (offset) * (i + 0.1), y: height / 1.2 };

              const x_dist = Math.abs(point1.x - point2.x);
              const y_dist = Math.abs(point1.y - point4.y)
              const centerX = (point1.x + point3.x) / 2;
              const centerY = (point1.y + point3.y) / 2;


              let scaleX = (graphWidth / (700));
              let scaleY = (graphHeight / (512.63));
              let transform = `translate(${centerX}, ${centerY}) scale(${scaleX}, ${scaleY}) translate(${-centerX}, ${-centerY})`;

              if (graphWidth < x_dist && graphHeight < y_dist) {
                scaleX = 1
                scaleY = 1
                transform = `translate(scale(${scaleX}, ${scaleY})`;
              }
              console.log('distances', x_dist, y_dist)
              const parallelogram = svg
                .append("polygon")  
                .attr("points", `${point1.x},${point1.y} ${point2.x},${point2.y} ${point3.x},${point3.y} ${point4.x},${point4.y}`)
                .attr("stroke", "black")
                .attr("fill", "none")
                .attr('transform',transform);
              console.log(scaleX)
              
                if (i === graphs.length - 2) {

                connectCrossGraphNodes(
                  allNodes,
                  svg,
                  graphs,
                  offset,
                  height
                );


                featureVisualizer(svg, allNodes, offset);
              }
            });
        } else if (data.grids) {
          console.log("Processing grid graph", data);

          const allGrids: any[] = [];
          const cellSize = offset / 64;

          const gridGroup = svg
            .append("g")
            .attr("transform", `translate(${offset * 1.5},${offset / 10})`);

          const grid = gridGroup
            .selectAll("rect")
            .data(data.grids)
            .join("rect")
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("stroke", "black")
            .attr("fill", "none")
            .attr("x", (d, index) => 3 * offset - index * cellSize)
            .attr("y", offset / 2.5);

          data.grids.forEach((grid: any, index: number) => {
            grid.graphIndex = i;
            grid.row = 0;
            grid.col = index;
            grid.x = index * cellSize + offset;
            grid.y = offset / 2.5;
            grid.width = cellSize;
            grid.height = cellSize;
            allGrids.push(grid);
          });
          //connectGridGraphs(allGrids,allNodes,svg,graphs,offset,height)
          featureVisualizer(svg, allGrids, offset);
        }
      });
    };

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
