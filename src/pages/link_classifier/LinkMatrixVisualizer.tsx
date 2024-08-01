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
}

const LinkMatricesVisualizer: React.FC<LinkMatricesVisualizerProps> = ({
    graph_path,
    intmData,
    changed,
    predicted,
    selectedButtons,
    hubNodeA,
    hubNodeB
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    // const lastIntmData = useRef(intmData);

    // This is really messy but init will stay at the top to remain in the scope of all functions

    useEffect(() => {
        if ((intmData == null || changed) && !predicted) {
            console.log("visualize partial graph");
            visualizePartialGraphMatrix(graph_path, false, 600, hubNodeA, hubNodeB);
        } else {
           visualizeLinkClassifier(setIsLoading, graph_path, intmData, hubNodeA, hubNodeB);
        }
    }, [graph_path, intmData, changed, hubNodeA, hubNodeB]);

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
