export const graphList = graph_list_generate(3);
export const modelList: {[k:string]: string} = {
    "graph classification": "./gnn_model2.onnx", 
    'node classification':"./xxx.onnx", 
};


function graph_list_generate(num: number) {
    let res:{[k:string]: string} = {};
    res['graph_0'] = "./input_graph.json"
    for (let i = 0; i < num; i++) {
        res[`graph_${i}`] =`./json_data/input_graph${i}.json`
    }
    console.log("Graphs List", res);
    return res;
}