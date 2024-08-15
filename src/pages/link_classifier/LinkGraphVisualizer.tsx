
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  data_prep,
  prep_graphs,
  connectCrossGraphNodes,
  featureVisualizer,
  softmax,
  myColor,
  loadNodesLocation
} from "@/utils/utils";

import { visualizeGraph, visualizePartialGraph } from "@/components/WebUtils";
import { aggregationCalculator } from "@/utils/graphUtils";
import { sources } from "next/dist/compiled/webpack/webpack";
import { buildBinaryLegend, buildLegend } from "@/utils/matHelperUtils";
import { findAbsMax } from "@/utils/matNNVis";
import { injectSVG } from "@/utils/svgUtils";
import { dataProccessGraphVisLinkPrediction } from "@/utils/GraphvislinkPredUtil";
import { linkPredFeatureVisualizer } from "@/utils/linkPredGraphVisUtil";



interface LinkVisualizerProps {
  graph_path: string;
  intmData: null | any;
  changed: boolean;
  predicted: boolean;
  selectedButtons: boolean[];
  simulationLoading: boolean;
  setSimulation: Function;
  hubNodeA: number;
  hubNodeB: number;
  innerComputationMode: string;
}


const LinkGraphVisualizer: React.FC<LinkVisualizerProps> = ({
  graph_path,
  intmData,
  changed,
  predicted,
  selectedButtons,
  simulationLoading,
  setSimulation,
  hubNodeA,
  hubNodeB,
  innerComputationMode
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastIntmData = useRef(intmData);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const currentVisualizationId = useRef(0);
  const parse = typeof graph_path === 'string' ? graph_path.match(/(\d+)\.json$/) : null;
  const select = parse ? parse[1] : '';

  useEffect(() => {
    setSimulation(false);
    const visualizationId = ++currentVisualizationId.current;

    const init = async (graphs: any[], subgraph: any[], nodeMapping: any) => {
      if (intmData != null) {}

      let allNodes: any[] = [];
      const offset = 600;
      const margin = { top: 10, right: 30, bottom: 30, left: 40 };
      const width = 8 * offset - margin.left - margin.right;
      const height = 1000 - margin.top - margin.bottom;
      let widthPadding = 0;
      let heightPadding = 0;
      let point1 = {x: 0, y: 0}
      let point2 = {x: 0, y: 0}
      let point3 = {x: 0, y: 0}
      let point4 = {x: 0, y: 0}

      d3.select("#my_dataviz").selectAll("svg").remove();
      const svg = d3
        .select("#my_dataviz")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "gvis");

      svgRef.current = svg.node();

      let colorSchemes: any = [];

      const transformedSubgraph = Object.fromEntries(
        Object.entries(subgraph).map(([key, value]) => {
          const mappedKey = nodeMapping[key];
          return [mappedKey, value];
        })
      );

      console.log("BAD", innerComputationMode)
      graphs.forEach((data, i) => {

        let xOffset = (i - 3.5) * offset;
        const g1 = svg
          .append("g")
          .attr("class", "layerVis")
          .attr("transform", `translate(${xOffset},${margin.top})`)
          .attr("layerNum", i);

        const link = g1
          .selectAll("line")
          .data(data.links)
          .join("line")
          .style("stroke", "#aaa")
          .style("stroke-dasharray", (d: any) => {

   
              let is_source = false;
              let is_target = false;
                if (nodeMapping[hubNodeA] === d.source || nodeMapping[hubNodeA] == d.target) {
    
                  is_source = true
     
                }
              
                if (nodeMapping[hubNodeB] === d.target || nodeMapping[hubNodeB] == d.source) {
                  is_target = true
   
                }
              

              if (is_source && is_target){ 
                return "20";
              }

    
        
            return "none"
          
        })
          
          .style("opacity", (d: any) => {
            if (i < 3) {
   
              let is_source = false;
              let is_target = false;
              for (let key in subgraph[i]) {
     
                if (nodeMapping[key] === d.source) {
    
                  is_source = true
                  break;
                }
              }
              for (let key in subgraph[i]) {
                if (nodeMapping[key] === d.target) {
                  is_target = true
                  break;
                }
              }

              if (is_source && is_target){ 
                return 1

            } else {
              return 0.2
            } } else {
              return 0;
            }
          


          } )


        const node = g1
          .selectAll("circle")
          .data(data.nodes)
          .join("circle")
          .attr("r", 17)
          .style("fill", "white")
          .style("stroke", "#69b3a2")
          .style("stroke-width", 1)
          .style("stroke-opacity", 1)
          .attr("opacity", 1);

        const labels = g1
          .selectAll("text")
          .data(data.nodes)
          .join("text")
          .text((d: any) => d.id)
          .attr("font-size", `12px`)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("opacity", 0)


        d3.forceSimulation(data.nodes)
          .force(
            "link",
            d3
              .forceLink(data.links)
              .id((d: any) => d.id)
              .distance(10)
          )
          .force("charge", d3.forceManyBody().strength(-500))
          .force("center", d3.forceCenter(width / 2, height / 3))
          .on("tick", ticked)
          .on("end", updatePositions);

        function ticked() {
          link
            .attr("x1", (d: any) => d.source.x)
            .attr("y1", (d: any) => d.source.y)
            .attr("x2", (d: any) => d.target.x)
            .attr("y2", (d: any) => d.target.y);

          node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
          labels.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
        }


        function updatePositions() {


          let value:number[] = [];
          if (intmData != null) {
            if (i === 1) {
              value = intmData.conv1;
            }
            if (i === 2) {
              value = intmData.conv2;
            }
            if (i === 3) {
              value = intmData.prob_adj;
            }
          }


          data.nodes.forEach((node: any) => {
            node.graphIndex = i;
            if (value != null && i <= 2 && value instanceof Float32Array) {
               node.features = Array.from(value.subarray(
                64 * node.id,
                64 * (node.id + 1)
              ));
            }
            if (value != null && i === 3 && value instanceof Float32Array) {
              node.features = Array.from(value.subarray(
                node.id,
                (node.id + 1)
              ));
            }

            allNodes.push(node);
          })
          

          console.log("VAWAD", allNodes)

  
  const extentX = d3.extent(data.nodes, (d: any) => d.x) as [number | undefined, number | undefined];
  const extentY = d3.extent(data.nodes, (d: any) => d.y) as [number | undefined, number | undefined];

  if (extentX[0] === undefined || extentX[1] === undefined || extentY[0] === undefined || extentY[1] === undefined) {
    console.error("Extent calculation returned undefined values");
    return;
  }
  if (i === 0) {
  widthPadding = (extentX[1] - extentX[0]) * 1;
  heightPadding = (extentY[1] - extentY[0]) * 0.1;


  point1 = { x: 4.0 * offset - widthPadding, y: height / 8 - heightPadding};
  point2 = { x: 3.9 * offset + widthPadding, y: height / 20 - heightPadding};
  point3 = { x: 3.9 * offset + widthPadding, y: height / 1.7 + heightPadding};
  point4 = { x: 4.0 * offset - widthPadding, y: height / 1.5 + heightPadding};
  }


  let x_dist = Math.abs(point1.x - point2.x);
  let y_dist = Math.abs(point1.y - point4.y)
  let centerX = (point1.x + point3.x) / 2;
  let centerY = (point1.y + point3.y) / 2;
  const text_x = point1.x
  let text_y = point4.y;


  let featureCoords = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
          if (i == 4) {
            featureCoords[0] = { x: centerX, y: centerY };
          }
          if (i == 5) {
            featureCoords[1] = {x: centerX, y: centerY};
          }


          let text = " ";
          if (i == 0) {
            text = "Input"
          }
          if (i <= 2 && i != 0) {
            text = `GCNConv${i}`
          }
          if (i === 3) {
            text = "Prediction Result"
          }


          if (graph_path === "./json_data/graphs/input_graph0.json") {
            text_y += 80;
          }
          const textElement = g1.append("text")
            .attr("class", "layer-label")
            .attr("x", text_x)
            .attr("y", text_y)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .attr("fill", "black")
            .attr("font-size", "15px")
            .text(text)
            .attr("font-weight", "normal")
            .attr('opacity', 0.5);

            const absMax = findAbsMax(allNodes[0].features);


           let cst:any = null;
          let cstOffset = 25;
 

          if(i==0){
            cst = buildBinaryLegend(myColor, 0, 1, text+" Color Scheme", text_x, text_y + cstOffset, g1)
          }
          else if(i==5){
            cst = buildBinaryLegend(myColor, value[0], value[1], text+" Color Scheme", text_x, text_y + cstOffset, g1)
          }
          else {
            cst = buildLegend(myColor, absMax, text+" Color Scheme", text_x - 50, text_y + cstOffset, g1);
          }

          colorSchemes.push(cst);





          const parallelogram = g1
            .append("polygon")
            .attr("points", `${point1.x},${point1.y} ${point2.x},${point2.y} ${point3.x},${point3.y} ${point4.x},${point4.y}`)
            .attr("stroke", "black")
            .attr("fill", "none");



            if (i === graphs.length - 1) {
              connectCrossGraphNodes(
                allNodes,
                svg,
                graphs,
                offset,
                subgraph,
                2,
                hubNodeA,
                hubNodeB
              );
              svg.selectAll("circle")
              .attr("opacity", 0);
  
              if (intmData) {
                linkPredFeatureVisualizer(svg, allNodes, offset, height, graphs, 1200, 900, 15, 2, 3, 20, colorSchemes, 2, subgraph, innerComputationMode);
              }
            }
        }
        

        setIsLoading(false);
      });
    };

    const handleSimulationComplete = (completedVisualizationId: number) => {
      if (completedVisualizationId === currentVisualizationId.current) {
        setSimulation(true);
      }
    };

    const runVisualization = async () => {
      if ((intmData == null || changed) && !predicted) {
        await visualizePartialGraph(graph_path, () => handleSimulationComplete(visualizationId), true, 2, hubNodeA, hubNodeB);
      } else {
        await visualizeGNN();
        handleSimulationComplete(visualizationId);
      }
    };

    const visualizeGNN = async () => {
      try {
        setIsLoading(true);
        const processedData = await dataProccessGraphVisLinkPrediction(graph_path, hubNodeA, hubNodeB);
        if (processedData) {
          let graphs = processedData[0];
          let subgraph = processedData[1];
          let nodeMapping = processedData[2]
          await init(graphs, subgraph, nodeMapping);
        }

      } catch (error) {
        console.error("Error in visualizeGNN:", error);
      } finally {
        setIsLoading(false);
      }
    };

    runVisualization();
  }, [graph_path, intmData, hubNodeA, hubNodeB]);

  const updateTextElements = (svg: SVGSVGElement, selectedButtons: boolean[]) => {
    d3.select(svg)
      .selectAll(".layerVis")
      .each(function (d, i) {
        const g1 = d3.select(this);
        g1.selectAll("text.layer-label")
          .transition()
          .duration(140)
          .style("opacity", () => {
            if ((i <= 1 && selectedButtons[i]) || (i === 2 && selectedButtons[2]) || (i === 4 && selectedButtons[4]) || (i === 3 && selectedButtons[3]) || (i === 5 && selectedButtons[5])) {
              return 1;
            }
            return 0.5;
          })
          .attr("font-size", () => {
            if ((i <= 1 && selectedButtons[i]) || (i === 2 && selectedButtons[2]) || (i === 3 && selectedButtons[3]) || (i === 4 && selectedButtons[4]) || (i === 5 && selectedButtons[5])) {
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
        overflow: "auto",
        overflowX: "scroll",
      }}
    ></div>
  );
};

export default LinkGraphVisualizer;
