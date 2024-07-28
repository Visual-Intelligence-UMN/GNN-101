//loading json file from the path
async function load_json(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(
                "Network response was not ok " + response.statusText
            );
        }
        return await response.json();
    } catch (error) {
        console.error(
            "There has been a problem with your fetch operation:",
            error
        );
    }
}

//transform the json data file to the way that d3.js want
async function data_prep(o_data) {
    try {
        var data = await load_json(o_data);

        var final_data = {
            nodes: [],
            links: [],
        };
        var nodes = data.x;
        var edges = data.edge_index;

        for (var i = 0; i < nodes.length; i++) {
            var new_node = {
                id: i,
                name: i,
                features: nodes[i],
            };
            final_data.nodes.push(new_node);
        }
        for (var i = 0; i < edges[0].length; i++) {
            var new_relation = {
                source: edges[0][i],
                target: edges[1][i],
            };
            final_data.links.push(new_relation);
        }

        return final_data;
    } catch (error) {
        console.error("There has been an error in data_prep:", error);
    }
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

//init the graphs data
async function prep_graphs(g_num, data) {
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

//process the json file and return the appropriate data structure
async function process() {
    var data = await data_prep("./input_graph.json");

    return data;
}

//get weights of the model
function get_weights() {
    return JSON.stringify("./weights.json");
}

//get the statistic of the graph
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








    return {
        node_count: nodeCount,
        edge_count: edges,
        avg_node_degree: averageDegree,
        has_isolated_node: hasIsolatedNode,
        has_loop: hasLoop.size > 0,
        is_directed: isDirected,
    };
}

export {load_json, data_prep, prep_graphs, process, get_weights, analyzeGraph};

//testing code

