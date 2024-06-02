// UTILS FILE BECAUSE WE HAVE SO MANY HELPER FUNCTIONS
import * as d3 from "d3";
import * as ort from "onnxruntime-web";
import { env } from "onnxruntime-web";
import { features } from 'process';
import { HeatmapData } from "@/utils/matUtils";

env.wasm.wasmPaths = {
    "ort-wasm-simd.wasm": "./ort-wasm-simd.wasm",
};

//helper
//for debugging purpose, input an array with coordination, draw points based on those coordinations
export function drawPoints(cName:string, color:string, points: number[][]): void {
  const svg = d3.select(cName);
  svg.selectAll("circle")
      .data(points)
      .enter()
      .append("circle")
      .attr("cx", d => d[0])
      .attr("cy", d => d[1])
      .attr("r", 1) // the raidus of the point
      .attr("fill", color); // set color to color
}

//helper
//set implementation
export function uniqueArray<T>(array: T[]): T[] {
  return array.filter((value, index, self) => self.indexOf(value) === index);
}

//helper
//direct get coordinates - you can use this function to get the coordination of a specific element in the SVG
export function get_coordination(element: any) {
    const bbox = element.getBBox();
    const cx = bbox.x + bbox.width / 2;
    const cy = bbox.y + bbox.height / 2;

    const transformAttr = d3
        .select(element.parentNode as SVGElement)
        .attr("transform");
    let translate = [0, 0]; // 默认为无位移
    if (transformAttr) {
        const matches = transformAttr.match(/translate\(([^,]+),([^)]+)\)/);
        if (matches) {
            translate = matches.slice(1).map(Number);
        }
    }

    const adjustedX = cx + translate[0];
    const adjustedY = cy + translate[1] - 10;
    return [adjustedX, adjustedY];
}

//helper
//get coordinates for type child in the parent node parent
export function get_cood_from_parent(
    parent: string,
    child: string
): number[][] {
    let res: number[][] = [];
    const mainNode = d3.select(parent);
    mainNode.selectAll(child).each(function () {
        const children = d3.select(this as SVGGraphicsElement);
        const r = get_coordination(children.node());
        res.push(r);
    });
    console.log("COOD", res);
    return res;
}

//helper
//print text coordinates in MatricesVisualizer
export function printAxisTextCoordinates(): void {
    d3.selectAll<SVGTextElement, any>(".x-axis text").each(function () {
        const bbox = this.getBBox();
        console.log(
            `X Axis Text: [x: ${bbox.x}, y: ${bbox.y}, width: ${bbox.width}, height: ${bbox.height}]`
        );
    });

    d3.selectAll<SVGTextElement, any>(".y-axis text").each(function () {
        const bbox = this.getBBox();
        console.log(
            `Y Axis Text: [x: ${bbox.x}, y: ${bbox.y}, width: ${bbox.width}, height: ${bbox.height}]`
        );
    });
}


//Split a large 1d array into a 1d array with multiple 8*8 matrices
type Matrix = number[][];

export function splitIntoMatrices(
    array: number[],
    matrixSize: number = 8
){
    // 创建一个空的二维数组
    let result: number[][] = [];
    // 计算每个子数组的长度
    let n = array.length / 64;
    let subArrayLength = 64;

    // 遍历 n 次来创建子数组
    for (let i = 0; i < n; i++) {
        // 截取从 i * subArrayLength 开始的 subArrayLength 长度的部分
        let subArray = array.slice(i * subArrayLength, (i + 1) * subArrayLength);
        // 将截取的子数组添加到结果数组中
        result.push(subArray);
    }

    // 返回生成的二维数组
    return result;
}

//get the category of node features in the original input graph
export function get_category_node(data: number[]) {
    for (let i = 0; i < data.length; i++) {
        if (data[i] == 1) {
            return i;
        }
    }
    return 0;
}

//get the features from a JSON structure
export async function get_features_origin(data: any) {
    return data.x;
}

//get axis from gData
export function get_axis_gdata(data: number[][]) {
    let res: string[];
    res = [];
    for (let i = 0; i < data.length; i++) {
        res.push(i.toString());
    }
    return res;
}

//write a function to convert gData to heatmap data
export function matrix_to_hmap(data: number[][]) {
    let res: any[];
    res = [];
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[0].length; j++) {
            let d = {
                group: i.toString(),
                variable: j.toString(),
                value: data[i][j], // 将字符串转换为数字
            };
            if (data[i][j] === 1) {
                d.value = 56;
            }
            res.push(d);
        }
    }
    return res;
}


//input a JSON file and transform it into a matrix representation of graph
export async function graph_to_matrix(data: any) {
    //get the number of nodes
    const nodeCount = data.x.length;
    //tranformation process
    let matrix: number[][];
    matrix = Array.from({ length: nodeCount }, () => Array(nodeCount).fill(0));
    for (let i = 0; i < data.edge_index[0].length; i++) {
        let source = data.edge_index[0][i];
        let target = data.edge_index[1][i];
        console.log("target:", target, "source:", source, "iter:", i);
        matrix[source][target] = 1;
    }
    console.log("matrix representation", matrix);
    return matrix;
}

//prepare for matrices data to visualize
export async function prepMatrices(n: number, mat: number[][]) {
    let matrices = [];
    for (let i = 0; i < n; i++) {
        matrices.push(mat);
    }
    //push a 8*8 matrix
    // if (matrices.length > 1) {
    //     const array1: number[][] = Array(8)
    //         .fill(null)
    //         .map(() => Array(8).fill(0));
    //   //  matrices.push(array1);
    // //}
    return matrices;
}

export const load_json = async (path: string) => {
  try {
    console.log('entered load_json');
    const response = await fetch(path);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('There has been a problem with your fetch operation:', error);
  }
}

export type NodeType = {
  id: number;
  name: string;
  features: number[];
};

export type LinkType = {
  source: number;
  target: number;
};

export async function data_prep(o_data: any) {

  

  let final_data = {
    nodes: [] as NodeType[],
    links: [] as LinkType[],

  };

  const atom_map: { [key: string]: string } = {
    "1,0,0,0,0,0,0": "C",
    "0,1,0,0,0,0,0": "N",
    "0,0,1,0,0,0,0": "O",
    "0,0,0,1,0,0,0": "F",
    "0,0,0,0,1,0,0": "I",
    "0,0,0,0,0,1,0": "Cl",
    "0,0,0,0,0,0,1": "Br"
  };

  try {
    var data = await load_json(o_data);
    var nodes = data.x;
    var edges = data.edge_index;

    for (var i = 0; i < nodes.length; i++) {
      var feature_str = nodes[i].join(',');
      var atom_name = atom_map[feature_str] || "Unknown";
      var new_node = {
        id: i,
        name: atom_name,
        features: nodes[i]
      }
      final_data.nodes.push(new_node);
    }

    for (var i = 0; i < edges[0].length; i++) {
      var new_relation = {
        source: edges[0][i],
        target: edges[1][i]
      }
      final_data.links.push(new_relation);
      console.log(new_relation);
    }


    
    return final_data;
  } catch (error) {
    console.error('There has been an error in data_prep:', error);
  }
} // end of data_prep

export async function prep_graphs(g_num: number, data: any) {
  var graphs = [];
  
  for (var i = 0; i < g_num; i++) {
    var graphData = {};
      graphData = {
        nodes: deepClone(data.nodes),
        links: deepClone(data.links),
      };
      graphs.push(graphData);
  }
  for (var i = 0; i < 2; i++) {
    var node: NodeType = {
      id: 0,
      name: " ",
      features: [0],
    } 

    var node_array = [];
    node_array.push(node);

     var links: LinkType = {
       source: 0,
       target: 0,
     }
    var graphData = {};
      graphData = {
        nodes: node_array,
        links: links,
      }
      graphs.push(graphData);
    }
    console.log("QWE",graphs)
  return graphs;
}

export function featureVisualizer(svg: any, nodes: any[], offset: number) {
  const nodesById = d3.group(nodes, (d: any) => d.id);

  const myColor = d3.scaleLinear<string>()
    .domain([-0.25, 0, 0.25])
    .range(["orange", "white", "#69b3a2"]);

  nodesById.forEach((nodes, id) => {
    nodes.forEach((node: any, i: number) => {
      const features = node.features;

      const featureGroup = svg.append("g")
        .attr("transform", `translate(${(i - 2.5) * offset + node.x + 100}, ${node.y - 100})`);

       


      featureGroup.selectAll("rect")
        .data(features)
        .enter()
        .append("rect")
        .attr("x", 0)  
        .attr("y", (d: any, i: number) => (i) * 5)  
        .attr("width", 20)
        .attr("height", 5)
        .style("fill", (d: number) => myColor(d))
        .style("stroke-width", 1)
        .style("stroke", "grey")
        .style("opacity", 0.8);

      featureGroup.append("text")
        .attr("x", 10)  
        .attr("y", -8)  
        .attr("dy", ".35em")  
        .text(node.id)
        .style("font-size", "15px")
        .style("fill", "black")
        .style("text-anchor", "middle");  

      node.featureGroup = featureGroup;  

      if (!node.svgElement) {
        node.svgElement = svg.append("circle")
          .attr("cx", (node.x + ((node.graphIndex - 2.5) * offset)))
          .attr("cy", (node.y + 10))
          .attr("r", 10)
          .attr("fill", "transparent");
      }
      node.svgElement.raise();

      node.svgElement.on("mouseover", function() {
        featureGroup.style('visibility', 'visible');
        if (node.links) {
          node.links.forEach((link: any) => {
            link.style("opacity", 1);
          });
        }
        if (node.relatedNodes) {
          node.relatedNodes.forEach((n: any) => {
            n.featureGroup.style('visibility', 'visible')

          })
        }
      }).on("mouseout", function() {
        featureGroup.style('visibility', 'hidden');
        if (node.links) {
          node.links.forEach((link: any) => {
            link.style("opacity", 0.1);
          });
        }
        if (node.relatedNodes) {
          node.relatedNodes.forEach((n: any) => {
            n.featureGroup.style('visibility', 'hidden')
          })
        }
      });

      featureGroup.style('visibility', 'hidden');
    });
  });
}


function calculateAverage(arr: number[]): number {
  const sum = arr.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
  const average = sum / arr.length;

  if (average * 100 < 1 || average > 0.1) {
    return 1;
  }
  return average * 100;
}

export function connectCrossGraphNodes(nodes: any, svg: any, graphs: any[], offset: number, height: number) {
  const nodesByIndex = d3.group(nodes, (d: any) => d.graphIndex);


  nodesByIndex.forEach((nodes, graphIndex) => {

    let upperIndex = 0;
    let lowerIndex = 0;
    nodes.forEach((node: any, i) => {

      

      if (!node.links) {
        node.links = [];
      }
      if (!node.relatedNodes) {
        node.relatedNodes = []
      }

        const xOffset1 = (graphIndex - 2.5) * offset;
        const xOffset2 = (graphIndex - 1.5) * offset;

      if (graphIndex < 2) { 
        
        let drawnLinks = new Set();

         const nextGraphLinks = graphs[graphIndex + 1].links;

         nextGraphLinks.forEach((link: any) => {
           const sortedIds = [link.source.id, link.target.id].sort();
           const linkId = sortedIds.join("-");
           if ((link.source.id === node.id || link.target.id === node.id) && !drawnLinks.has(linkId)) {
             drawnLinks.add(linkId);

             const neighborNode = link.source.id === node.id ? link.target : link.source;
             if (!neighborNode.links) {
               neighborNode.links = [];
             }
             if (!neighborNode.relatedNodes) {
              neighborNode.relatedNodes = [];
             }
            
             const neighborControlX = (node.x + xOffset1 + neighborNode.x + xOffset2) / 2;
             let neighborControlY;

             if ((node.y + 10 + neighborNode.y + 10) / 2 < height / 3.5) {
               neighborControlY = (node.y + 10 + neighborNode.y + 10) / 2 - 30 - upperIndex * 10;
               upperIndex++;
             } else {
               neighborControlY = (node.y + 10 + neighborNode.y + 10) / 2 + 30 + lowerIndex * 10;
               lowerIndex++;
             }

             const stroke_width = calculateAverage(node.features);
            
             const path = svg.append("path")
               .attr("d", `M ${node.x + xOffset1} ${node.y + 10} Q ${neighborControlX} ${neighborControlY} ${neighborNode.x + (neighborNode.graphIndex - 2.5) * offset} ${neighborNode.y + 10}`)
               .style("stroke", "blue")
               .style("opacity", 0.1)
               .style("stroke-width", stroke_width)
               .style("fill", "none")

             node.links.push(path);
             neighborNode.links.push(path);
             neighborNode.relatedNodes.push(node);
      
           }
          })
          
          const nextNode = nodesByIndex.get(graphIndex + 1);
          if (nextNode) {
          nextNode.forEach((nextNode: any) => {
            if (node.id === nextNode.id) {
              const xOffsetNext = (graphIndex + 1 - 2.5) * offset;
  
              const controlX = (node.x + xOffset1 + nextNode.x + xOffsetNext) / 2;
              let controlY;
  
              if ((node.y + 10 + nextNode.y + 10) / 2 < height / 3.5) {
                controlY = Math.min(node.y + 10, nextNode.y + 10) - 50 - upperIndex * 10; 
                upperIndex++;
              } else {
                controlY = Math.max(node.y + 10, nextNode.y + 10) + 50 + lowerIndex * 10; 
                lowerIndex++;
              }
  
              const path = svg.append("path")
                .attr("d", `M ${node.x + xOffset1} ${node.y + 10} Q ${controlX} ${controlY} ${nextNode.x + xOffsetNext} ${nextNode.y + 10}`)
                .style("stroke", "red")
                .style("opacity", 0.1)
                .style("stroke-width", calculateAverage(node.features))
                .style("fill", "none");
  
              node.links.push(path);
              if (!nextNode.links) {
                nextNode.links = [];
              }
              if (!nextNode.relatedNodes) {
                nextNode.relatedNodes = [];
              }
              nextNode.links.push(path);

              nextNode.relatedNodes.push(node);
            }
          })
        }
      
        
      } else {  
        
   
          
          const nextLayer = graphs[graphIndex + 1];
          if (nextLayer) {
            let nextNode = nextLayer.nodes[0];

          const path = svg.append("path")
          .attr("d", `M ${node.x + xOffset1} ${node.y + 10} L ${nextNode.x + xOffset2} ${nextNode.y + 10}`)
           .style("stroke", "blue")
           .style("opacity", 0.1)
           .style("stroke-width", calculateAverage(node.features))
           .style("fill", "none");
           
          node.links.push(path);
          if (!nextNode.links) {
            nextNode.links = [];
          }
          nextNode.links.push(path);
        }
      }
      
    });
  });

 }



export function deepClone(obj: any) {
    return JSON.parse(JSON.stringify(obj));
}

export async function process() {
    var data = await data_prep("./input_graph.json");
    console.log(data);
    return data;
}

export async function loadModel() {
  let session: any;
  try {
    session = await ort.InferenceSession.create("./gnn_model2.onnx", { executionProviders: ['wasm'] });
    console.log("Model loaded successfully");
  } catch (error) {
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