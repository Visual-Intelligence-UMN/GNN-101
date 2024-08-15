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
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    // const lastIntmData = useRef(intmData);

    // This is really messy but init will stay at the top to remain in the scope of all functions

    useEffect(() => {
        if ((intmData == null || changed) && !predicted) {
            console.log("visualize partial graph");
            visualizePartialGraphMatrix(graph_path, false, 400, hubNodeA, hubNodeB);
        } else {
            console.log("visualize link classifier", hubNodeA, hubNodeB);
           visualizeLinkClassifier(setIsLoading, graph_path, intmData, hubNodeA, hubNodeB, innerComputationMode);
        }
    }, [graph_path, intmData, changed, hubNodeA, hubNodeB]);


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
                overflow: "auto", // this enables scrollbars if content overflows
                overflowX: "auto",
            }}
        ></div>
    );
};

export default LinkMatricesVisualizer;
