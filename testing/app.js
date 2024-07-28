import { analyzeGraph } from "./utils.js";

let session;

async function loadModel() {
    // await session.loadModel("gnn_model.onnx");
    session = await ort.InferenceSession.create("gnn_model.onnx");

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
    const expLogits = logits.map((logit) => Math.exp(logit - maxLogit));

    // Compute the sum of the exponentials.
    const sumExpLogits = expLogits.reduce((acc, val) => acc + val, 0);

    // Divide each exponential by the sum of exponentials to get the probabilities.
    const probabilities = expLogits.map((expLogit) => expLogit / sumExpLogits);

    return probabilities;
}

window.onload = loadModel;

function classifyGraph() {

    const inputElement = document.getElementById("graphInput");
    if (inputElement.files.length > 0) {
        const file = inputElement.files[0];
            // Assuming the user's input is a JSON file representing the graph
        // You will need to convert this to the appropriate tensor format
        const reader = new FileReader();
        reader.onload = async function (e) {
            await loadModel();
            const graphData = JSON.parse(e.target.result);
            analyzeGraph(graphData);
            // Convert `graphData` to tensor-like object expected by your ONNX model
            let xTensor = new ort.Tensor(
                "float32",
                new Float32Array(graphData["x"].flat()),
                [graphData.x.length, graphData.x[0].length]
            ); // flat for converting, and then adjust as needed
            let edgeIndexTensor = new ort.Tensor(
                "int32",
                new Int32Array(graphData["edge_index"].flat()),
                [graphData.edge_index.length, graphData.edge_index[0].length]
            ); // flat for converting, and then adjust as needed
            // let yTensor = new ort.Tensor(new Float32Array(graphData['y']), "float32", [graphData.y.length]);  // flat for converting, and then adjust as needed
            let batchTensor = new ort.Tensor(
                "int32",
                new Int32Array(graphData["batch"]),
                [graphData.batch.length]
            ); // flat for converting, and then adjust as needed

            const outputMap = await session.run({
                x: xTensor,
                edge_index: edgeIndexTensor,
                batch: batchTensor,
            });

            const outputTensor = outputMap.final;

            //conv1 data



            //conv2 data



            //conv3 data



            //the final output of gcn model data




            const probabilities = softmax(outputTensor.cpuData);
            // Process and display the results
            document.getElementById(
                "result"
            ).innerText = `Non-Mutagenic: ${probabilities[0].toFixed(
                2
            )} \n Mutagenic: ${probabilities[1].toFixed(2)}`;
        };
        reader.readAsText(file);
    } else {
        console.error("Please upload a file first");
    }
}
