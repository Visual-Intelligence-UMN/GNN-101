import { deepClone, get_features_origin, graph_to_matrix, linkPrediction, LinkType, load_json, NodeType } from "@/utils/utils";
import { getNodeSet } from "@/utils/linkPredictionUtils";
import { error } from "console";
import { extractSubgraph } from "./graphDataUtils";


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

        //console.log("mergedNodes", mergedNodes);

        //compute the structure of the subgraph
        const subGraph = extractSubgraph(graph, mergedNodes);

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
            var new_node = {
              id: nodeMapping[Number(key)],
              name: node_name,
              features: subGraph[key],
              is_aromatic: false
            }
            final_data.nodes.push(new_node);
        }

        final_data.links = newGraph.new_relation;

        const final_data1 = deepClone(final_data);
        const final_data2 = deepClone(final_data);






        result.push(final_data)
        result.push(final_data1)
        result.push(final_data2)



// to-do: add the last layer



        return result;


    } catch (error) {
        console.log("error in data process graphvis link prediction")
    }
}

  
  

  
