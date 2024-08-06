import { get_features_origin, graph_to_matrix, linkPrediction, LinkType, load_json, NodeType } from "@/utils/utils";
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



        for (const key in subGraph) {
            if (subGraph.hasOwnProperty(key)) {
                const value = subGraph[key];
                //console.log(`Key: ${key}, Value: ${JSON.stringify(value)}`);
                newGraph.x.push(data.x[key])
                for (let j = 0; j < value.length; j++) {
                    if (key != value[j]) {
                        var new_relation = {
                            source: Number(key),
                            target: Number(value[j]),
                            type: "single"
                        } 
                        newGraph.new_relation.push(new_relation)
                    }

                    
                }
                }
            }
        

        let final_data = {
            nodes: [] as NodeType[],
            links: [] as LinkType[],
        };
        var nodes = newGraph.x;
        for (const key in subGraph) {
            let node_name = "Unknown";
            var new_node = {
              id: Number(key),
              name: node_name,
              features: subGraph[key],
              is_aromatic: false
            }
            final_data.nodes.push(new_node);
        }

        final_data.links = newGraph.new_relation;

        let nodes1A:number[] = getNodeSet(graph, hubNodeA)[1];
        let nodes1B:number[] = getNodeSet(graph, hubNodeB)[1];

        //console.log("nodesA", nodesA);
        //console.log("nodesB", nodesB);

        const mergedNodes1 = [...nodes1A, ...nodes1B];

        const subGraph1 = extractSubgraph(graph, mergedNodes1);

        //console.log("subGraph", subGraph1);


        let newGraph1: Graph = { x: [], new_relation: []};



        for (const key in subGraph1) {
            if (subGraph1.hasOwnProperty(key)) {
                const value = subGraph1[key];
                //console.log(`Key: ${key}, Value: ${JSON.stringify(value)}`);
                newGraph1.x.push(data.x[key])
                for (let j = 0; j < value.length; j++) {
                    if (key != value[j]) {
                        var new_relation = {
                            source: Number(key),
                            target: Number(value[j]),
                            type: "single"
                        } 
                        newGraph1.new_relation.push(new_relation)
                    }

                    
                }
                }
            }
        
            let final_data1 = {
                nodes: [] as NodeType[],
                links: [] as LinkType[],
            };
            var nodes1 = newGraph1.x;
            for (const key in subGraph) {
                let node_name = "Unknown";
                var new_node1 = {
                  id: Number(key),
                  name: node_name,
                  features: subGraph1[key],
                  is_aromatic: false
                }
                final_data1.nodes.push(new_node1);
            }
    
            final_data1.links = newGraph1.new_relation;    
      
          


            var final_data2 = {
                nodes: [] as NodeType[],
                links: [] as LinkType[],
            }
            var NodeA= {
                id: hubNodeA,
                name: "Unknown",
                features: data.x[hubNodeA],
                is_aromatic: false
              }

            var NodeB= {
                id: hubNodeB,
                name: "Unknown",
                features: data.x[hubNodeB],
                is_aromatic: false
            }
            var new_relation_A: LinkType = {
                source: hubNodeA,
                target: hubNodeB,
                type: "single"
            }
            var new_relation_B: LinkType = {
                source: hubNodeB,
                target: hubNodeA,
                type: "single"               
            }
            final_data2.nodes.push(NodeA)
            final_data2.nodes.push(NodeB);
            final_data2.links.push(new_relation_A)
            final_data2.links.push(new_relation_B)


        result.push(final_data)
        result.push(final_data1)
        result.push(final_data2)



// to-do: add the last layer





        
    

        return result;


    } catch (error) {
        console.log("error in data process graphvis link prediction")
    }
}

  
  

  
