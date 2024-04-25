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

//testing code
console.log(get_weights());
