import React, { useState, ChangeEvent } from "react";
import { graphPrediction, linkPrediction, nodePrediction } from "@/utils/utils";
import { Hint, PredictionVisualizer } from "../components/WebUtils";
import { IntmData, IntmDataLink, IntmDataNode } from "@/types";

interface ClassifyGraphProps {
    graphPath: string;
    modelPath: string;
    setChangedG: Function;
    setIntmData: Function;
    setPredicted: Function;
    predicted: boolean;
    probabilities: number[] | number[][];
    setProbabilities: (prob: number[] | number[][]) => void;
    onlyShownButton?: boolean;
    simulationLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

// parameter will be the user input for json file
const ClassifyGraph: React.FC<ClassifyGraphProps> = ({
    graphPath,
    modelPath,
    setChangedG,
    setIntmData,
    setPredicted,
    predicted,
    probabilities,
    setProbabilities,
    onlyShownButton = false,
    simulationLoading,
    setIsLoading
}) => {
    let prob: number[] | number[][] = [];
    const classifyGraph = async () => {
        try {
            setIsLoading(true); // 开始加载
            setPredicted(true);

        //	const { prob, intmData } = await graphPrediction(modelPath, graphPath);


            let intmData: IntmData | IntmDataNode | IntmDataLink;
            let prob: number[] | number[][] = [];

            if (modelPath.includes("node")) {
                ({ prob, intmData } = await nodePrediction(modelPath, graphPath));
            } else if (modelPath.includes("graph")) {
                ({ prob, intmData } = await graphPrediction(modelPath, graphPath));
            } else if(modelPath.includes("edge")) {
                ({ prob, intmData } = await linkPrediction(
                    modelPath,
                    "/json_data/graphs/testing_graph.json" // this is for twitch dataset originally
                ));
            } else {
                ({ prob, intmData } = await graphPrediction(modelPath, graphPath));
            }
    
            setChangedG(false);
            setIntmData(intmData);
    
            if (Array.isArray(prob[0])) {
                setProbabilities(prob as number[][]);
            } else {
                setProbabilities(prob as number[]);
            }
    
            console.log("Prediction results:", prob);
        } catch (error) {
            console.error("Prediction error:", error);
        } finally {
            setIsLoading(false); // 加载完成
        }
    };    
    const prediction = !predicted ? (
        onlyShownButton ? (
            <button
                onClick={classifyGraph}
                className=" border border-4 hover:border-4 py-1 px-2 rounded-lg text-4xl"
                id="click-to-predict"
                style={{ color: "rgb(25, 118, 210)", borderColor: "rgb(25, 118, 210)", backgroundColor: 'white' }}
            >

                Click to Predict!
                {/* flash */}
                <span className="relative h-4 w-4" style={{ right: '-18px', top: '-28px' }}>
                    <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500"></span>
                </span>
            </button>
        ) : (
            onlyShownButton && (
                <div className="mt-3">
                    <span
                        className="loading text-xl opacity-60 font-light"
                        style={{ color: "rgb(25, 118, 210" }}
                    >
                        Loading
                    </span>
                </div>
            )
        )
    ) : modelPath == "./gnn_node_model.onnx" ? (
        <></>
    ) : Array.isArray(probabilities[0]) ? (
        <div></div>
    ) : probabilities.length > 0 && typeof probabilities[0] === "number" ? (
        <PredictionVisualizer
            result={{
                "Non-Mutagenic": probabilities[0] as number,
                Mutagenic: probabilities[1] as number,
            }}
        />
    ) : (
        <div role="status" className="flex items-center" >
            <svg aria-hidden="true" className="w-14 h-14 text-gray-200 animate-spin fill-blue-400" viewBox="0 0 100 101" >
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
            </svg>
            <span className="text-gray-500 text-2xl animate-pulse">Predicting... <br />It may take 10-20 seconds</span>
        </div>
    );
    const content =
        modelPath == "./gnn_node_model.onnx" ? (
            <>{prediction}</>
        ) : (
            onlyShownButton ? (
                prediction
            )
                :
                (
                    <div className="flex gap-x-4 items-center mb-2">
                        {!predicted && (
                            <div className="flex gap-x-4 items-center">
                                <h1 className="text-3xl font-black">Predictions</h1>
                                <p className="mt-1 	mx-3">No data available yet!</p>
                                <Hint text='Press the "Click to Predict!" to predict' />
                            </div>
                        )}
                        {prediction}
                    </div>
                )
        );

    return content;
};

export default ClassifyGraph;