// UTILS FILE BECAUSE WE HAVE SO MANY HELPER FUNCTIONS
import * as d3 from 'd3';
import * as ort from 'onnxruntime-web';
import { env } from 'onnxruntime-web';

env.wasm.wasmPaths = {
  'ort-wasm-simd.wasm': './ort-wasm-simd.wasm'
};

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
    name: string;
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
  
  const atom_map : { [key: string]: string } = {
    "1,0,0,0,0,0,0": "Carbon",
    "0,1,0,0,0,0,0": "Hydrogen",
    "0,0,1,0,0,0,0": "Oxygen",
    "0,0,0,1,0,0,0": "Nitrogen",
    "0,0,0,0,1,0,0": "Fluorine",
    "0,0,0,0,0,1,0": "Phosphorus",
    "0,0,0,0,0,0,1": "Sulfur"
  };
  
  try {
    var data = await load_json(o_data);
    var nodes = data.x;
    var edges = data.edge_index;
    

    for (var i = 0; i < nodes.length; i++) {
      var feature_str = nodes[i].join(',');
      var atom_name = atom_map[feature_str] || "Unknown";

      var new_node = {
        "id": i,
        "name": atom_name,
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
      console.log(new_relation)
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

export function connectCrossGraphNodes(nodes: any, svg: any, graphs: any[], offset : number, height : number) {
  const nodesById = d3.group(nodes, (d : any) => d.id);
  let upperIndex = 0; 
  let lowerIndex = 0;
  let upperIndexBlue = 0;
  let lowerIndexBlue = 0;

    
        
  nodesById.forEach((nodes, id) => {
      nodes.forEach((node : any, i) => {
          const tooltip = svg
            .append('text')
            .attr('visibility', 'hidden') 
            .attr('text-anchor', 'middle') 
            .attr('x', i * offset + node.x)
            .attr('y', node.y - 20)
            .style('font-size', '20px')
            .style('background', 'rgba(0, 0, 0, 0.7)')
            .style('fill', '#000')
            .text(`${node.name}`);
          
    
          node.tooltip = tooltip  
          if (!node.links) {
            node.links = [];
          }
          
        
          
          if (i < nodes.length - 1) {
              const nextNode = nodes[i + 1];
              const xOffset1 = node.graphIndex * offset;
              const xOffset2 = nextNode.graphIndex * offset;
              
              if (!nextNode.links) {
                nextNode.links = [];
              }

                // Red line control points
              const controlX = (node.x + xOffset1 + nextNode.x + xOffset2) / 2;
              let controlY;

              if ((node.y + 10 + nextNode.y + 10) / 2 < height / 2) {
                  controlY = Math.min(node.y + 10, nextNode.y + 10) - 50 - upperIndex * 10; 
                  upperIndex++;
              } else {
                  controlY = Math.max(node.y + 10, nextNode.y + 10) + 50 + lowerIndex * 10; 
                  lowerIndex++;
              }

              const path = svg.append("path")
                  .attr("d", `M ${node.x + xOffset1} ${node.y + 10} Q ${controlX} ${controlY} ${nextNode.x + xOffset2} ${nextNode.y + 10}`)
                  .style("stroke", "red")
                  .style("opacity", 0.1) 
                  .style("stroke-width", 1)
                  .style("fill", "none")
 
              node.links.push(path);
              nextNode.links.push(path);
                   
              let drawnLinks = new Set();  

              const nextGraphLinks = graphs[nextNode.graphIndex].links;
              nextGraphLinks.forEach((link : any) => {

                const sortedIds = [link.source.id, link.target.id].sort();
                const linkId = sortedIds.join("-");

                if ((link.source.id === nextNode.id || link.target.id === nextNode.id) && !drawnLinks.has(linkId)) {
                    drawnLinks.add(linkId);  

                    const neighborNode = link.source.id === nextNode.id ? link.target : link.source;
                    if (!neighborNode.links) {
                      neighborNode.links = [];
                    }
                    const neighborControlX = (node.x + node.graphIndex * offset + neighborNode.x + neighborNode.graphIndex * offset) / 2;
                    let neighborControlY;

                    if ((node.y + 10 + neighborNode.y + 10) / 2 < height / 2) {
                        neighborControlY = (node.y + 10 + neighborNode.y + 10) / 2 - 30 - upperIndexBlue * 10;
                        upperIndexBlue++;
                    } else {
                        neighborControlY = (node.y + 10 + neighborNode.y + 10) / 2 + 30 + lowerIndexBlue * 10;
                        lowerIndexBlue++;
                      }

                    const path = svg.append("path")
                      .attr("d", `M ${node.x + node.graphIndex * offset} ${node.y + 10} Q ${neighborControlX} ${neighborControlY} ${neighborNode.x + neighborNode.graphIndex * offset} ${neighborNode.y + 10}`)
                      .style("stroke", "blue")
                      .style("opacity", 0.1)
                      .style("stroke-width", 1)
                      .style("fill", "none");

                      node.links.push(path);
                      neighborNode.links.push(path)
                    }
                });

              node.svgElement = svg.append("circle")
              .attr("cx", node.x + xOffset1)
              .attr("cy", node.y + 10)
              .attr("r", 10)
              .style("fill", "#69b3a2");
          

            node.svgElement.on("mouseover", function() {
              node.tooltip.style('visibility', 'visible')  
              node.links.forEach((link : any) => {
                  link.style("stroke-width", 4) 
                      .style("opacity", 1)
                      

                });
              }).on("mouseout", function() {
                node.tooltip.style('visibility', 'hidden');
                node.links.forEach((link : any) => {
                  link.style("stroke-width", 1) 
                      .style("opacity", 0.1)
                      
              }
          )}
      )}
      else {
        node.svgElement = svg.append("circle")
              .attr("cx", node.x + i * offset)
              .attr("cy", node.y + 10)
              .attr("r", 10)
              .style("fill", "#69b3a2");

        node.svgElement.on("mouseover", function() {
          node.tooltip.style('visibility', 'visible')  
          node.links.forEach((link : any) => {
              link.style("stroke-width", 4) 
                  .style("opacity", 1)
                });
              }).on("mouseout", function() {
                node.tooltip.style('visibility', 'hidden');
                node.links.forEach((link : any) => {
                  link.style("stroke-width", 1) 
                      .style("opacity", 0.1)
                    }
                  )}

      )}
      
    })
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
