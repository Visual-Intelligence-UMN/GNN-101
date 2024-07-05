
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  data_prep,
  prep_graphs,
  connectCrossGraphNodes,
  featureVisualizer,
  softmax
} from "../utils/utils";

import { visualizeGraph, getInitialCoordinates } from "./WebUtils";
import { aggregationCalculator } from "@/utils/graphUtils";
import { sources } from "next/dist/compiled/webpack/webpack";



interface GraphVisualizerProps {
  graph_path: string;
  intmData: null | any;
  changed: boolean;
  predicted: boolean;
  selectedButtons: boolean[];
  simulationLoading: boolean;
  setSimulation: Function;
}

const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
  graph_path,
  intmData,
  changed,
  predicted,
  selectedButtons,
  simulationLoading,
  setSimulation,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastIntmData = useRef(intmData);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const currentVisualizationId = useRef(0);

  if (intmData != null) {
    console.log("From Visualizer:", intmData);
  }
  
  useEffect(() => {
    setSimulation(false)
    const visualizationId = ++currentVisualizationId.current;

    const init = async (graphs: any[], initialCoords: { [id: string]: { x: number, y: number } }) => {
      
      
      if (intmData != null) {
        console.log("From Visualizer:", intmData);
      }
      console.log("path", graph_path);
      let allNodes: any[] = [];
      const offset = 600;
      const margin = { top: 10, right: 30, bottom: 30, left: 40 };
      const width = 8 * offset - margin.left - margin.right;
      const height = 1000 - margin.top - margin.bottom;

      // Append the SVG object to the body of the page
      d3.select("#my_dataviz").selectAll("svg").remove();
      const svg = d3
        .select("#my_dataviz")
        .append("svg")
        .attr("width", width)
        .attr("height", height);


      svgRef.current = svg.node();


      graphs.forEach((data, i) => {
        console.log("i", i);
        console.log(data);

        let xOffset = (i - 2.5) * offset;
        if (i >= 4) {
          xOffset = (i - 2.5) * offset - 25 * (i * 1.5);
        }
        const g1 = svg
          .append("g")
          .attr("class", "layerVis")
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

        if (i >= 4) {
          labels.attr("opacity", 0);
        }
        data.nodes.forEach((node: any) => {
  
          if (initialCoords[node.id]) {
            node.x = initialCoords[node.id].x;
            node.y = initialCoords[node.id].y;
          } else {
            node.x = Math.random() * width;
            node.y = Math.random() * height;
          }
          if (i >= 4) {
            node.y = height / 3;
          }
        });
        // This is needed to connect links to the nodes within its own graph.
        d3.forceSimulation(data.nodes)
          .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(20))
          .stop()
          .on("tick", ticked);


        function ticked() {
          const weightExtent = d3.extent(data.links, (d: any) => d.weight);
          const widthScale = d3.scaleLinear()
            .domain(weightExtent as unknown as [number, number])
            .range([1, 10]);

          const opacityScale = d3.scaleLinear()
            .domain(weightExtent as unknown as [number, number])
            .range([0.1, 1]);
          link
            .attr("x1", (d: any) => d.source.x)
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
              return null;
            })
            .style("stroke", function (d: any) {
              return d.type === "aromatic" ? "purple" : "#aaa";
            });

          node
            .attr("cx", (d: any) => d.x)
            .attr("cy", (d: any) => d.y);


          labels
            .attr("x", (d: any) => d.x - 6)
            .attr("y", (d: any) => d.y + 6);
        }
        updatePositions();
        function updatePositions() {
          link
            .attr("x1", (d: any) => d.source.x)
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
              return null;
            })
            .style("stroke", function (d: any) {
              return d.type === "aromatic" ? "purple" : "#aaa";
            });
          node.attr("cx", (d: any) => d.x)
            .attr("cy", (d: any) => d.y);

          labels.attr("x", (d: any) => d.x - 6)
            .attr("y", (d: any) => d.y + 6);




          let value = null;
          if (intmData != null) {
            if (i === 1) {
              value = intmData.conv1;
            }
            if (i === 2) {
              value = intmData.conv2;
            }
            if (i === 3) {
              value = intmData.conv3;
            }
            if (i === 4) {
              value = intmData.pooling;
            }
            if (i === 5) {
              let final: any = intmData.final;
              value = softmax(final);

            }
          }
          data.nodes.forEach((node: any) => {
            node.graphIndex = i;
            if (value != null && i <= 4 && value instanceof Float32Array) {
              node.features = value.subarray(
                64 * node.id,
                64 * (node.id + 1)
              );
            }




            if (value != null && i >= 5) {
              node.features = value;
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

          const point1 = { x: 3.0 * offset, y: height / 8 };
          const point2 = { x: 2.9 * offset, y: height / 20 };
          const point3 = { x: 2.9 * offset, y: height / 1.7 };
          const point4 = { x: 3.0 * offset, y: height / 1.5 };

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
          if (i >= 4) {
            point1.y -= 130;
            point2.y -= 130;
            point3.y += 70;
            point4.y += 70;
            point1.x += 15;
            point4.x += 15;
            point2.x -= 15;
            point3.x -= 15;

          }
          const parallelogram = g1
            .append("polygon")
            .attr("points", `${point1.x},${point1.y} ${point2.x},${point2.y} ${point3.x},${point3.y} ${point4.x},${point4.y}`)
            .attr("stroke", "black")
            .attr("fill", "none")
            .attr('transform', transform);
          


          let text = " ";
          if (i == 0) {
            text = "Input"
          }
          if (i <= 3 && i != 0) {
            text = `GCNGconv${i}`
          }
          if (i === 4) {
            text = "Pooling"
          }
          if (i === 5) {
            text = "Prediction Result"
          }
          const textElement = g1.append("text")
            .attr("class", "layer-label")
            .attr("x", point1.x)
            .attr("y", point4.y + 100)
            .attr("text-anchor", "middle")
            .attr("fill", "black")
            .attr("font-size", "15px")
            .text(text)
            .attr("font-weight", "normal")
            .attr('opacity', 0.5);


          // doesn't show the text, need to be fixed 
          if (i === graphs.length - 1) { // 6 layers in total, call the connect when reaching the last layer of convolutional layer.
            connectCrossGraphNodes( // in this function the connection of last two layers will be drwan
              allNodes,
              svg,
              graphs,
              offset,
            );

            // since in the featureVisualizer each node has its own svgElement, circles here are made transparent
            svg.selectAll("circle")
              .attr("opacity", 0);

            if (intmData) {
              featureVisualizer(svg, allNodes, offset, height, graphs); // pass in the finaldata because nodeByIndex doesn't include nodes from the last layer
            }

          }

        }
        setIsLoading(false);
      }

      )
    };

    const handleSimulationComplete = (completedVisualizationId: number) => {
      if (completedVisualizationId === currentVisualizationId.current) {
        setSimulation(true);
      }
    };

    const runVisualization = async () => {
      if ((intmData == null || changed) && !predicted) {
        await visualizeGraph(graph_path,() => handleSimulationComplete(visualizationId), true);
      } else {
        await visualizeGNN(4);
        handleSimulationComplete(visualizationId);
      }
    };


    const visualizeGNN = async (num: number) => {
      try {
        setIsLoading(true);
        // Process data

        const processedData = await data_prep(graph_path);

        const graphsData = await prep_graphs(num, processedData);
        const initialCoordinates = getInitialCoordinates();
        // Initialize and run D3 visualization with processe  d data
        await init(graphsData, initialCoordinates);
      } catch (error) {
        console.error("Error in visualizeGNN:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    runVisualization();

    
  
    
  }, [graph_path, intmData]);
  const updateTextElements = (svg: SVGSVGElement, selectedButtons: boolean[]) => {
    d3.select(svg)
      .selectAll(".layerVis")
      .each(function (d, i) {
        const g1 = d3.select(this);

        g1.selectAll("text.layer-label")
          .transition()
          .duration(140)
          .style("opacity", () => {
            if ((i <= 2 && selectedButtons[i]) ||
              (i === 3 && selectedButtons[4]) ||
              (i === 4 && selectedButtons[5]) ||
              (i === 5 && selectedButtons[6])) {
              return 1;
            }
            return 0.5;
          })
          .attr("font-size", () => {
            if ((i <= 2 && selectedButtons[i]) ||
              (i === 3 && selectedButtons[4]) ||
              (i === 4 && selectedButtons[5]) ||
              (i === 5 && selectedButtons[6])) {
              return "18px";
            }
            return "15px";
          });
      });
  };
  useEffect(() => {
    if (svgRef.current && !isLoading) {
      updateTextElements(svgRef.current, selectedButtons);
    }
    console.log("selectBtn", selectedButtons);
  }, [selectedButtons, isLoading]);

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