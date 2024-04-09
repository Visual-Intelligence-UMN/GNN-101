let session;
// const sessionOptions = {
//     // Specify that you want to use the WebAssembly backend
//     executionProviders: ['wasm']
// };

async function loadModel() {
    // await session.loadModel("gnn_model.onnx");
    session = await ort.InferenceSession.create("gnn_model.onnx");
    console.log("Model loaded successfully");
}



function classifyGraph() {
    const inputElement = document.getElementById('graphInput');
    if (inputElement.files.length > 0) {
        const file = inputElement.files[0];
        // Assuming the user's input is a JSON file representing the graph
        // You will need to convert this to the appropriate tensor format
        const reader = new FileReader();
        reader.onload = async function(e) {
            await loadModel();
            const graphData = JSON.parse(e.target.result);
            // Convert `graphData` to tensor-like object expected by your ONNX model
            let xTensor = new ort.Tensor("float32", new Float32Array(graphData['x'].flat()), [graphData.x.length, graphData.x[0].length]);  // flat for converting, and then adjust as needed
            let edgeIndexTensor = new ort.Tensor("int32", new Int32Array(graphData['edge_index'].flat()), [graphData.edge_index.length, graphData.edge_index[0].length]);  // flat for converting, and then adjust as needed
            // let yTensor = new ort.Tensor(new Float32Array(graphData['y']), "float32", [graphData.y.length]);  // flat for converting, and then adjust as needed
            let batchTensor = new ort.Tensor( "int32", new Int32Array(graphData['batch']),[graphData.batch.length]);  // flat for converting, and then adjust as needed


            const outputMap = await session.run({x: xTensor, edge_index: edgeIndexTensor, batch: batchTensor});
            const outputTensor = outputMap['output']['data'];
            // Process and display the results
            document.getElementById('result').innerText = `Classification result: ${outputTensor}`;
        };
        reader.readAsText(file);
    }
    else {
        console.error("Please upload a file first");
    }
}
