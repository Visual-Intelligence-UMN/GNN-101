import React, { useState, ChangeEvent } from 'react';
import * as ort from 'onnxruntime-web';
import { analyzeGraph, softmax, loadModel,load_json } from '@/utils/utils';
import { path } from 'd3';
import { PredictionVisualizer } from './WebUtils';

interface GraphData {
  x: number[][];
  edge_index: number[][];
  y?: number[];
  batch: number[];
}

interface ClassifyGraphProps{
  graph_path: string;
  dataComm: Function;
  changedComm: Function;
  changed: boolean;
}

// parameter will be the user input for json file
const ClassifyGraph: React.FC<ClassifyGraphProps>=({graph_path, dataComm, changedComm, changed}) => {
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

        console.log("Final");
        console.log(outputTensor);
        console.log(outputTensor.cpuData);

        const prob = softmax(outputTensor.cpuData);
        const intmData = {
          "conv1":outputMap.conv1.cpuData,
          "conv2":outputMap.conv2.cpuData, 
          "conv3":outputMap.conv3.cpuData,
          "final":outputTensor.cpuData
        };

        dataComm(intmData);
        changedComm(false);
        
        setGraphName(graph_path);
        
        console.log("Probabilities:",prob);
        setProbabilities(prob);
  };

  return (
    <div>
      <div className="flex gap-x-4">
          <div>
            <h1 className="text-xl font-semibold">Predictions</h1>
          </div>
          <div>
      <button onClick={classifyGraph}>Classify a Graph</button>
      </div>
      </div>
      <div>
      {probabilities && (!changed) && probabilities.length === 2 ? (
        <div>
        <div className="flex gap-x-4">
          <div>
            <h1 className="text-xl font-semibold">Results</h1>
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
                <PredictionVisualizer result={probabilities}/>
              </div>
            </div>
          </div>
        </div>
        <p>Classification Result for: {graphName}</p>
        </div>

      ) : (
        <p>No data available</p>
      )}
    </div>
    </div>
  );
}

export default ClassifyGraph;