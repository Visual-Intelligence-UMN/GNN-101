import React, { useState, ChangeEvent } from 'react';
import * as ort from 'onnxruntime-web';
import { analyzeGraph, softmax, loadModel, load_json } from '@/utils/utils';
import { path } from 'd3';
import { Hint, PredictionVisualizer } from './WebUtils';

interface GraphData {
  x: number[][];
  edge_index: number[][];
  y?: number[];
  batch: number[];
}

interface ClassifyGraphProps {
  graph_path: string;
  dataComm: Function;
  changedComm: Function;
  changed: boolean;
}

export interface IntmData {
  conv1: Float32Array;
  conv2: Float32Array;
  conv3: Float32Array;
  pooling: Float32Array;
  dropout: Float32Array;
  final: Float32Array;
}

// parameter will be the user input for json file
const ClassifyGraph: React.FC<ClassifyGraphProps> = ({ graph_path, dataComm, changedComm, changed }) => {
  const [probabilities, setProbabilities] = useState<number[]>([]);
  const [graphName, setGraphName] = useState("None");

  const classifyGraph = async () => {
    console.log("start classifying....a");
    const session = await loadModel();
    const graphData: GraphData = await load_json(graph_path);
    analyzeGraph(graphData);

    // Convert `graphData` to tensor-like object expected by your ONNX model
    const xTensor = new ort.Tensor(
      "float32",
      new Float32Array(graphData.x.flat()),
      [graphData.x.length, graphData.x[0].length]
    );

    const edgeIndexTensor = new ort.Tensor(
      "int32",
      new Int32Array(graphData.edge_index.flat()),
      [graphData.edge_index.length, graphData.edge_index[0].length]
    );

    const batchTensor = new ort.Tensor(
      "int32",
      new Int32Array(graphData.batch),
      [graphData.batch.length]
    );

    const outputMap = await session.run({
      x: xTensor,
      edge_index: edgeIndexTensor,
      batch: batchTensor,
    });

    console.log(outputMap);
    const outputTensor = outputMap.final;

    //onOutputReady(outputMap)

    console.log("Conv1");
    console.log(outputMap.conv1.cpuData);

    console.log("Conv2");
    console.log(outputMap.conv2.cpuData);

    console.log("Conv3");
    console.log(outputMap.conv3.cpuData);

    console.log("Pooling");
    console.log(outputMap.pooling.cpuData);

    console.log("Dropout");
    console.log(outputMap.dropout.cpuData);

    console.log("Final");
    console.log(outputTensor);
    console.log(outputTensor.cpuData);



    const prob = softmax(outputTensor.cpuData);
    const intmData: IntmData = {
      conv1: outputMap.conv1.cpuData,
      conv2: outputMap.conv2.cpuData,
      conv3: outputMap.conv3.cpuData,
      pooling: outputMap.pooling.cpuData,
      dropout: outputMap.dropout.cpuData,
      final: outputTensor.cpuData
    };

    dataComm(intmData);
    changedComm(false);

    setGraphName(graph_path);

    console.log("Probabilities:", prob);
    setProbabilities(prob);
  };

  return (
    <div>
      {probabilities && (changed) && (
        <div>
          <hr className="border-t border-gray-300 my-4"></hr>
          <div className="flex gap-x-4 items-center mb-2">
            <div className="flex gap-x-4 justify-center items-center">
              <h1 className="text-xl font-semibold">Predictions</h1>
              <Hint text='Press the "Classify a Graph" to predict' />
            </div>
            <div>
              <button
                onClick={classifyGraph}
                className=" bg-red-200 border border-gray-300 hover:border-black hover:bg-red-300 text-black py-1 px-2 rounded"
              >
                Click to Predict!
              </button>
              <br />
            </div>
          </div>
        </div>
      )}
      <div>
        {probabilities && (!changed) && probabilities.length === 2 ? (
          <div>
            <div className="flex gap-x-4 items-center my-4">
              <div className="flex gap-x-4">
                <h1 className="text-xl font-semibold">Results</h1>
                <Hint text={"results"} />
              </div>
              <div>
                <div className="flex gap-x-4">
                  <div >
                    <p>
                      Non-Mutagenic<br />
                      Mutagenic<br />
                    </p>
                  </div>
                  <div>
                    <PredictionVisualizer result={probabilities} />
                  </div>
                </div>
              </div>
            </div>
            <p>Classification Result for: {graphName}</p>
          </div>

        ) : (
          <p>No data available, please click "Click to Predict" to get the prediction result. </p>
        )}
      </div>
      <hr className="border-t border-gray-300 my-4"></hr>
    </div>
  );
}

export default ClassifyGraph;
