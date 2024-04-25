import {analyzeGraph} from "./utils";

let session;

async function loadModel() {
    // await session.loadModel("gnn_model.onnx");
    session = await ort.InferenceSession.create("gnn_model.onnx");
    console.log("Model loaded successfully");
}

/**
 * Compute softmax probabilities for an array of logits.
 * @param {number[]} logits - The input logits for a single example.
 * @returns {number[]} - The softmax probabilities.
 */
function softmax(logits) {
    // Find the maximum logit to improve numerical stability.
    const maxLogit = Math.max(...logits);

    // Compute the exponential of each logit, adjusted by the max logit for numerical stability.
    const expLogits = logits.map(logit => Math.exp(logit - maxLogit));

    // Compute the sum of the exponentials.
    const sumExpLogits = expLogits.reduce((acc, val) => acc + val, 0);

    // Divide each exponential by the sum of exponentials to get the probabilities.
    const probabilities = expLogits.map(expLogit => expLogit / sumExpLogits);

    return probabilities;
}

window.onload = loadModel;

/** 
function analyzeGraph(graphData) {
    const nodeCount = graphData.x.length; 
    const edgePairs = graphData.edge_index;
    const edges = edgePairs[0].length;
    const degreeMap = new Array(nodeCount).fill(0);
    const hasLoop = new Set();
    let isDirected = false;

    for (let i = 0; i < edges; i++) {
        const source = edgePairs[0][i];
        const target = edgePairs[1][i];

        degreeMap[source]++;
        degreeMap[target]++;

        if (source === target) {
            hasLoop.add(source);
        }

        if (!isDirected && !edgePairs[1].includes(source) || !edgePairs[0].includes(target)) {
            isDirected = true;
        }
    }

    const totalDegree = degreeMap.reduce((acc, degree) => acc + degree, 0);
    const averageDegree = totalDegree / nodeCount;

    const hasIsolatedNode = degreeMap.some(degree => degree === 0);

    console.log(`Node Count: ${nodeCount}`);
    console.log(`Edge Count: ${edges}`);
    console.log(`Average Node Degree: ${averageDegree}`);
    console.log(`Has Isolated Node: ${hasIsolatedNode}`);
    console.log(`Has Loop: ${hasLoop.size > 0}`);
    console.log(`Is Directed: ${isDirected}`);
}
*/


function classifyGraph() {
    console.log("start classifying....a");
    const inputElement = document.getElementById('graphInput');
    if (inputElement.files.length > 0) {
        const file = inputElement.files[0];
        // Assuming the user's input is a JSON file representing the graph
        // You will need to convert this to the appropriate tensor format
        const reader = new FileReader();
        reader.onload = async function(e) {  
            await loadModel();
            const graphData = JSON.parse(e.target.result);
            analyzeGraph(graphData);
            // Convert `graphData` to tensor-like object expected by your ONNX model
            let xTensor = new ort.Tensor("float32", new Float32Array(graphData['x'].flat()), [graphData.x.length, graphData.x[0].length]);  // flat for converting, and then adjust as needed
            let edgeIndexTensor = new ort.Tensor("int32", new Int32Array(graphData['edge_index'].flat()), [graphData.edge_index.length, graphData.edge_index[0].length]);  // flat for converting, and then adjust as needed
            // let yTensor = new ort.Tensor(new Float32Array(graphData['y']), "float32", [graphData.y.length]);  // flat for converting, and then adjust as needed
            let batchTensor = new ort.Tensor( "int32", new Int32Array(graphData['batch']),[graphData.batch.length]);  // flat for converting, and then adjust as needed

            const outputMap = await session.run({x: xTensor, edge_index: edgeIndexTensor, batch: batchTensor});
            console.log(outputMap);  
            const outputTensor = outputMap.final; 
            
            //conv1 data
            console.log(outputMap.conv1.cpuData);
            //conv2 data
            console.log(outputMap.conv2.cpuData);
            //conv3 data
            console.log(outputMap.conv3.cpuData);
            //the final output of gcn model data
            console.log(outputTensor);
            console.log(outputTensor.cpuData);

            const probabilities = softmax(outputTensor.cpuData);
            // Process and display the results
            document.getElementById('result').innerText = `Non-Mutagenic: ${probabilities[0].toFixed(2)} \n Mutagenic: ${probabilities[1].toFixed(2)}`;
        };
        reader.readAsText(file);
    }
    else {
        console.error("Please upload a file first");
    }
}
