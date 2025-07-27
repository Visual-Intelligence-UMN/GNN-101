import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { visualizeMatrix } from "../../components/WebUtils";
import { visualizeGraphClassifier, visualizeNodeClassifier } from "@/utils/matNNVis";

interface NodeMatricesVisualizerProps {
    graph_path: string;
    intmData: any;
    changed: boolean;
    predicted: boolean;
    selectedButtons: boolean[];
    onLoadComplete: () => void;
    simGraphData: any;
    sandBoxMode: boolean;
}

const NodeMatricesVisualizer: React.FC<NodeMatricesVisualizerProps> = ({
    graph_path,
    intmData,
    changed,
    predicted,
    selectedButtons,
    onLoadComplete,
    simGraphData,
    sandBoxMode = true, // whether the graph is simulated or not
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    //const lastIntmData = useRef(intmData);

    // This is really messy but init will stay at the top to remain in the scope of all functions


    if (intmData != null) {

    }

    useEffect(() => {
        if ((intmData == null || changed) && !predicted) {
            visualizeMatrix(graph_path, false, 800, simGraphData, sandBoxMode);
            onLoadComplete();
        } else {
           visualizeNodeClassifier(setIsLoading, graph_path, intmData, simGraphData, sandBoxMode);
           onLoadComplete();
        }

    }, [graph_path, intmData, changed]);

    // In your component

    const updateTextElements = (svg: SVGSVGElement, selectedButtons: boolean[]) => {
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
                  (i === 4 && selectedButtons[4]) ||
                  (i === 3 && selectedButtons[3])) {
                  return 1;
                }
                return 0.5;
              })
              .attr("font-size", () => {
                if ((i <= 1 && selectedButtons[i]) ||
                  (i === 2 && selectedButtons[2]) ||
                  (i === 3 && selectedButtons[3]) ||
                  (i === 4 && selectedButtons[4])) {
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
                overflow: "auto", // this enables scrollbars if content overflows
                overflowX: "auto",
            }}
        ></div>
    );
};

export default NodeMatricesVisualizer;
