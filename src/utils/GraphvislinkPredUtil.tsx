import { deepClone, get_features_origin, graph_to_matrix, linkPrediction, LinkType, load_json, NodeType } from "@/utils/utils";
import { getNodeSet } from "@/utils/linkPredictionUtils";
import { error } from "console";
import { AdjacencyListForSearch, extractSubgraph,  } from "./graphDataUtils";
import { sources } from "next/dist/compiled/webpack/webpack";


// this function transfrom the raw graph
export async function dataProccessGraphVisLinkPrediction(graph_path: any, hubNodeA: number, hubNodeB: number ) {
    try {
        let result: any = []
        const data = await load_json(graph_path);

        const features = await get_features_origin(data);
        const graph = await graph_to_matrix(data);



        let nodesA:number[] = getNodeSet(graph, hubNodeA)[0];
        let nodesB:number[] = getNodeSet(graph, hubNodeB)[0];

        //console.log("nodesA", nodesA);
        //console.log("nodesB", nodesB);

        const mergedNodes = [...nodesA, ...nodesB];

        let nodes2A:number[] = getNodeSet(graph, hubNodeA)[1];
        let nodes2B:number[] = getNodeSet(graph, hubNodeB)[1];

        const mergedNodes2 = [...nodes2A, ...nodes2B];



        //console.log("mergedNodes", mergedNodes);

        //compute the structure of the subgraph
        const subGraph = extractSubgraph(graph, mergedNodes);
        const subGraph2 = extractSubgraph(graph, mergedNodes2);


        let subGraph3: AdjacencyListForSearch = {};
        subGraph3[hubNodeA] = [];
        subGraph3[hubNodeB] = [];
        subGraph3[hubNodeA].push(hubNodeA);
        subGraph3[hubNodeA].push(hubNodeB);
        subGraph3[hubNodeB].push(hubNodeA);
        subGraph3[hubNodeB].push(hubNodeB);


        let subGraphSet = [];
        subGraphSet.push(subGraph)
        subGraphSet.push(subGraph2)
        subGraphSet.push(subGraph3)



        //console.log("subGraph", subGraph);

        type Graph = {
            new_relation: LinkType[];
            x: any[];
        };


        let newGraph: Graph = { x: [], new_relation: []};


        const nodeMapping: { [key: number]: number } = {};
        let newId = 0;

        for (const originalId of mergedNodes) {
            nodeMapping[originalId] = newId++;
        }


        for (const key in subGraph) {
            if (subGraph.hasOwnProperty(key)) {
                const value = subGraph[key];

                newGraph.x.push(data.x[key])
                for (let j = 0; j < value.length; j++) {
                    if (key != value[j]) {
                        var new_relation = {
                            source: nodeMapping[Number(key)],
                            target: nodeMapping[(value[j])],
                            type: "single"
                        }
                        newGraph.new_relation.push(new_relation)
                    }
                }
                }
            }

            var new_relation: LinkType = {
                source: nodeMapping[hubNodeB],
                target: nodeMapping[hubNodeA],
                type: "single"               
            }
            newGraph.new_relation.push(new_relation)
        
        let final_data = {
            nodes: [] as NodeType[],
            links: [] as LinkType[],
        };
        for (const key in subGraph) {
            let node_name = "Unknown";
            const features: number[] = data.x[key];
            var new_node = {
              id: nodeMapping[Number(key)],
              name: node_name,
              features: features,
              is_aromatic: false,
              original_id: Number(key),
            }
            final_data.nodes.push(new_node);
        }

        final_data.links = newGraph.new_relation;

        const final_data1 = deepClone(final_data);
        const final_data2 = deepClone(final_data);


        var new_node = {
            id: 0,
            name: "Unknown",
            features: [0],
            is_aromatic: false,
            original_id: 0,
          }
        var new_relation = {
            source: 0,
            target: 0,
            type: "single"
        }

        let final_data3 = {
            nodes: [] as NodeType[],
            links: [] as LinkType[],
        };
        final_data3.nodes.push(new_node)
        final_data3.links.push(new_relation)


        result.push(final_data)
        result.push(final_data1)
        result.push(final_data2)
        result.push(final_data3)





// to-do: add the last layer


        return [result, subGraphSet, nodeMapping];


    } catch (error) {
        console.log("error in data process graphvis link prediction")
    }
}



export function isValidNode(subgraph: any, node: any) {

    if (node.original_id === 0) {
        return;
    }
    for (const key in subgraph[node.graphIndex]) {
        if (node.original_id === Number(key)) {
            return true;
        }
    }
    return false;

}
  
  

  
