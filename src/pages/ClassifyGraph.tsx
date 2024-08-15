import React, { useState, ChangeEvent } from "react";
import { graphPrediction, linkPrediction, nodePrediction } from "@/utils/utils";
import { Hint, PredictionVisualizer } from "../components/WebUtils";
import { on } from "events";
import { useEffect } from "react";
import { IntmData, IntmDataLink, IntmDataNode } from "@/types";
import { only } from "node:test";

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
}) => {
  let prob: number[] | number[][] = [];
  const classifyGraph = async () => {
    setPredicted(true);

    //	const { prob, intmData } = await graphPrediction(modelPath, graphPath);

    
    let intmData: IntmData | IntmDataNode | IntmDataLink;

    if (modelPath == "./gnn_node_model.onnx")
      ({ prob, intmData } = await nodePrediction(modelPath, graphPath));
    else if (modelPath == "./gnn_model2.onnx")
      ({ prob, intmData } = await graphPrediction(modelPath, graphPath));
    else
      ({ prob, intmData } = await linkPrediction(
        modelPath,
        "./json_data/links/twitch.json"
      ));

    setChangedG(false);
    setIntmData(intmData);

    

    if (Array.isArray(prob[0])) {
      setProbabilities(prob as number[][]);
      console.log("prob 1", probabilities);
    } else {
      setProbabilities(prob as number[]);
      console.log("prob 2", probabilities);
    }
    console.log("check in prediction", prob, probabilities);
  };

  const prediction = !predicted ? (
    onlyShownButton ? (
      <button
        onClick={classifyGraph}
        className=" border border-4 opacity-60 hover:opacity-90 hover:border-4 py-1 px-2 rounded-lg text-4xl"
        style={{ color: "rgb(25, 118, 210)", borderColor: "rgb(25, 118, 210)" }}
      >
        Click to Predict!
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
    <span>Predicting...Estimated waiting time is 10 seconds...</span>
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