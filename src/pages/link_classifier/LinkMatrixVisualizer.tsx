import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { visualizeMatrix, visualizePartialGraphMatrix } from "../../components/WebUtils";
import { visualizeLinkClassifier } from "@/utils/matNNVis";

interface LinkMatricesVisualizerProps {
  graph_path: string;
  intmData: any;
  changed: boolean;
  predicted: boolean;
  selectedButtons: boolean[];
  hubNodeA: number;
  hubNodeB: number;
  innerComputationMode: string;
  onLoadComplete: () => void;
}

const LinkMatricesVisualizer: React.FC<LinkMatricesVisualizerProps> = ({
  graph_path,
  intmData,
  changed,
  predicted,
  selectedButtons,
  hubNodeA,
  hubNodeB,
  innerComputationMode,
  onLoadComplete
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const visualizeData = async () => {
      try {
        setIsLoading(true);
        if ((intmData == null || changed) && !predicted) {
          console.log("visualize partial graph");
          let gridSize = 800;
          await visualizePartialGraphMatrix(graph_path, false, gridSize, hubNodeA, hubNodeB);
        } else {
          console.log("visualize link classifier", hubNodeA, hubNodeB);
          await visualizeLinkClassifier(setIsLoading, graph_path, intmData, hubNodeA, hubNodeB, innerComputationMode);
        }
      } catch (error) {
        console.error("Error visualizing data:", error);
      } finally {
        setIsLoading(false);
        onLoadComplete(); // 确保在可视化完成后调用
      }
    };

    visualizeData();
  }, [graph_path, intmData, changed, hubNodeA, hubNodeB, predicted, onLoadComplete]);

  const updateTextElements = (svg: SVGSVGElement, selectedButtons: boolean[]) => {
    console.log("selected buttons", selectedButtons);
    d3.select(svg)
      .selectAll(".layerVis")
      .each(function (d, i) {
        const g1 = d3.select(this);
        g1.selectAll("text.layerName")
          .transition()
          .duration(140)
          .style("opacity", () => {
            if ((i <= 1 && selectedButtons[i]) ||
              (i === 2 && selectedButtons[2]) ||
              (i === 3 && selectedButtons[6])) {
              return 1;
            }
            return 0.5;
          })
          .attr("font-size", () => {
            if ((i <= 1 && selectedButtons[i]) ||
              (i === 2 && selectedButtons[2]) ||
              (i === 3 && selectedButtons[6])) {
              return "18px";
            }
            return "15px";
          });
      });
  };

  useEffect(() => {
    const svg = d3
      .select("#matvis")
      .select("svg.mats")
      .node() as SVGSVGElement;
    if (svg && !isLoading) {
      updateTextElements(svg, selectedButtons);
    }
  }, [selectedButtons, isLoading]);

  return (
    <div
      id="matvis"
      ref={containerRef}
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "start",
        height: "auto",
        overflow: "auto",
        overflowX: "auto",
      }}
    ></div>
  );
};

export default LinkMatricesVisualizer;