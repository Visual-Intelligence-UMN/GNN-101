// UTILS FILE BECAUSE WE HAVE SO MANY HELPER FUNCTIONS
import * as d3 from 'd3';
import * as ort from 'onnxruntime-web';
import { env } from 'onnxruntime-web';

env.wasm.wasmPaths = {
  'ort-wasm-simd.wasm': './ort-wasm-simd.wasm'
};


//get axis from gData
export function get_axis_gdata(data:number[][]){
  let res: string[];
  res = [];
  for(let i=0; i<data.length; i++){
    res.push(i.toString());
  }
  return res;
}

//write a function to convert gData to heatmap data
export function matrix_to_hmap(data: number[][]){
  let res: any[];
  res = [];
  for(let i=0; i<data.length; i++){
    for(let j=0; j<data[0].length; j++){
      let d = {
        group: i.toString(),
        variable: j.toString(),
        value: data[i][j]  // 将字符串转换为数字
      };
      if(data[i][j]===1){d.value = 56;}
      res.push(d);
    }
  }
  return res;
}

//input a JSON file and transform it into a matrix representation of graph
export async function graph_to_matrix(data: any){
  //get the number of nodes
  const nodeCount = data.x.length;
  //tranformation process
  let matrix: number[][];
  matrix = Array.from({ length: nodeCount }, () => Array(nodeCount).fill(0));
  for(let i=0; i<data.edge_index[0].length; i++){
    let source = data.edge_index[0][i];
    let target = data.edge_index[1][i];
    console.log("target:",target,"source:",source,"iter:",i);
    matrix[source][target] = 1;
  }
  console.log("matrix representation",matrix);
  return matrix;
}

//prepare for matrices data to visualize
export async function prepMatrices(n:number, mat: number[][]){
  let matrices = [];
  for(let i=0; i<n; i++){
    matrices.push(mat);
  }
  return matrices;
}

export const load_json = async (path: string) => {
  try {
    console.log('entered load_json')
    const response = await fetch(path);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('There has been a problem with your fetch operation:', error);
  }
}
// data_prep
export async function data_prep(o_data: any) {
  // Painful explicit typing because we are using Typescript
  type NodeType = {
    id: number;
    name: number;
    features: any;
  };
  type LinkType = {
    source: number;
    target: number;
  };

  let final_data = {
    nodes: [] as NodeType[],
    links: [] as LinkType[],
  }

  try {
    var data = await load_json(o_data);
    var nodes = data.x;
    var edges = data.edge_index;

    for (var i = 0; i < nodes.length; i++) {
      var new_node = {
        "id": i,
        "name": i,
        "features": nodes[i]
      }
      final_data.nodes.push(new_node);
    }
    for (var i = 0; i < edges[0].length; i++) {
      var new_relation = {
        "source": edges[0][i],
        "target": edges[1][i]
      }
      final_data.links.push(new_relation);
    }

    return final_data;
  } catch (error) {
    console.error('There has been an error in data_prep:', error);
  }
} // end of data_prep
// prep_graphs
export async function prep_graphs(g_num: number, data: any) {
  var graphs = [];
    for(var i=0; i<g_num; i++){
        let graphData = {
            nodes: deepClone(data.nodes),
            links: deepClone(data.links)
        };
        graphs.push(graphData);
    }
    return graphs;
}

export function connectCrossGraphNodes(nodes: any, svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>, graphs: any[]) {
  const nodesById = d3.group(nodes, (d:any) => d.id);
  console.log(nodesById);
  nodesById.forEach((nodes, id) => {
    nodes.forEach((node, i) => {
      if (i < nodes.length - 1) {
        const nextNode = nodes[i + 1];
        const xOffset1 = node.graphIndex * 500;
        const xOffset2 = nextNode.graphIndex * 500;

        console.log("first cood");
        console.log(nodes[i].x, nodes[i].y);
        console.log("second cood");
        console.log(nextNode.x, nextNode.y);

        svg.append("line")
          .attr("x1", nodes[i].x + xOffset1)
          .attr("y1", nodes[i].y + 10)
          .attr("x2", nextNode.x + xOffset2)
          .attr("y2", nextNode.y + 10)
          .style("stroke", "red")
          .style("opacity", 0.2)
          .style("stroke-width", 2);

        const nextGraphLinks = graphs[nextNode.graphIndex].links;
        nextGraphLinks.forEach((link: any) => {
          if (
            link.source.id === nextNode.id ||
            link.target.id === nextNode.id
          ) {
            const neighborNode =
              link.source.id === nextNode.id
                ? link.target
                : link.source;
            svg.append("line")
              .attr("x1", node.x + node.graphIndex * 500)
              .attr("y1", node.y + 10)
              .attr(
                "x2",
                neighborNode.x + neighborNode.graphIndex * 500
              )
              .attr("y2", neighborNode.y + 10)
              .style("stroke", "blue")
              .style("opacity", 0.2)
              .style("stroke-width", 1);
          }
        });
      }
    });
  })
}

// helper helper function
function deepClone(obj: any) {
  return JSON.parse(JSON.stringify(obj));
}

export async function process() {
  var data = await data_prep("./input_graph.json");
  console.log(data);
  return data;
}

export async function loadModel() {
  //await session.loadModel("gnn_model.onnx");
  let session: any;
  try{
    session = await ort.InferenceSession.create("./gnn_model.onnx",{ executionProviders: ['wasm'] });
    console.log("Model loaded successfully");
  }catch(error){
    console.log("Load model failed", error);
  }
  return session;
}

export function softmax(logits: number[]) {
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

export function analyzeGraph(graphData: any) {
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

      if (
          (!isDirected && !edgePairs[1].includes(source)) ||
          !edgePairs[0].includes(target)
      ) {
          isDirected = true;
      }
  }

  const totalDegree = degreeMap.reduce((acc, degree) => acc + degree, 0);
  const averageDegree = totalDegree / nodeCount;

  const hasIsolatedNode = degreeMap.some((degree) => degree === 0);

  console.log(`Node Count: ${nodeCount}`);
  console.log(`Edge Count: ${edges}`);
  console.log(`Average Node Degree: ${averageDegree}`);
  console.log(`Has Isolated Node: ${hasIsolatedNode}`);
  console.log(`Has Loop: ${hasLoop.size > 0}`);
  console.log(`Is Directed: ${isDirected}`);

  return {
      node_count: nodeCount,
      edge_count: edges,
      avg_node_degree: averageDegree,
      has_isolated_node: hasIsolatedNode,
      has_loop: hasLoop.size > 0,
      is_directed: isDirected,
  };
}