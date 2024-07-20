import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { visualizeMatrix } from "../../utils/WebUtils";
import { visualizeGraphClassifier, visualizeNodeClassifier } from "@/utils/matNNVis";

interface NodeMatricesVisualizerProps {
    graph_path: string;
    intmData: any;
    changed: boolean;
    predicted: boolean;
    selectedButtons: boolean[];
}

const NodeMatricesVisualizer: React.FC<NodeMatricesVisualizerProps> = ({
    graph_path,
    intmData,
    changed,
    predicted,
    selectedButtons,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    //const lastIntmData = useRef(intmData);

    // This is really messy but init will stay at the top to remain in the scope of all functions

    console.log("updated Node", intmData);
    if (intmData != null) {
        console.log("From Node Visualizer:", intmData);
    }

    useEffect(() => {
        if ((intmData == null || changed) && !predicted) {
            visualizeMatrix(graph_path, false, 800);
        } else {
           visualizeNodeClassifier(setIsLoading, graph_path, intmData);
        }
        console.log("i fire once");
    }, [graph_path, intmData, changed]);

    // In your component:
    useEffect(() => {
        const svg = d3
            .select("#matvis")
            .select("svg.mats")
            .node() as SVGSVGElement;
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
