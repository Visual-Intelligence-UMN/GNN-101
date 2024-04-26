import React, { useState, ChangeEvent } from 'react';
import * as ort from 'onnxruntime-web';
import { analyzeGraph, softmax, loadModel } from '@/utils/utils';

interface GraphData {
  x: number[][];
  edge_index: number[][];
  y?: number[];
  batch: number[];
}


// parameter will be the user input for json file
function ClassifyGraph() {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const classifyGraph = async () => {
    console.log("start classifying....a");
    const inputElement = document.getElementById("graphInput") as HTMLInputElement;

    if (inputElement.files && inputElement.files.length > 0) {
      const file = inputElement.files[0];

      // Assuming the user's input is a JSON file representing the graph
      // You will need to convert this to the appropriate tensor format
      const reader = new FileReader();
      reader.onload = async (e) => {
        const session = await loadModel();
        const graphData: GraphData = JSON.parse(e.target?.result as string);
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

        console.log("Conv1");
        console.log(outputMap.conv1.cpuData);

        console.log("Conv2");
        console.log(outputMap.conv2.cpuData);

        console.log("Conv3");
        console.log(outputMap.conv3.cpuData);

        console.log("Final");
        console.log(outputTensor);
        console.log(outputTensor.cpuData);

        const probabilities = softmax(outputTensor.cpuData);
        const resultElement = document.getElementById("result");
        if (resultElement) {
          resultElement.innerText = `Non-Mutagenic: ${probabilities[0].toFixed(
            2
          )} \n Mutagenic: ${probabilities[1].toFixed(2)}`;
        }
      };
      reader.readAsText(file);
    } else {
      console.error("Please upload a file first");
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={classifyGraph}>Classify Graph</button>
    </div>
  );
}

export default ClassifyGraph;