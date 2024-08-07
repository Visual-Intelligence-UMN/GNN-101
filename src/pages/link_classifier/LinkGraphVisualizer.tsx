
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

    const init = async (graphs: any[]) => {
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

      graphs.forEach((data, i) => {

        let xOffset = (i - 2.5) * offset;
        const g1 = svg
          .append("g")
          .attr("class", "layerVis")
          .attr("transform", `translate(${xOffset},${margin.top})`)
          .attr("layerNum", i);

        const link = g1
          .selectAll("line")
          .data(data.links)
          .join("line")
          .style("stroke", "#aaa");

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
          .attr("dominant-baseline", "central");




    


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


          data.nodes.forEach((node: any) => {
            node.graphIndex = i;
            // if (value != null && i <= 4 && value instanceof Float32Array) {
            //   node.features = value.subarray(
            //     64 * node.id,
            //     64 * (node.id + 1)
            //   );
            // }
            allNodes.push(node);
          })


    
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
                2
              );
              svg.selectAll("circle")
              .attr("opacity", 0);
  
              if (intmData) {
                featureVisualizer(svg, allNodes, offset, height, graphs, 900, 600, 15, 10, 3, 20, colorSchemes, 0);
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
        await init(processedData);
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
