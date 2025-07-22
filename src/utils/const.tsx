// test

import { inter3 } from "@/pages";

export const formulaClass: { [k: string]: string[] } = {
    "formula_weights": ["weight-matrix-frame", "columnGroup", "weight-matrix-text"],
    "formula_bias": ["biasFrame", "bias"],
    "formula_x": ["output", "outputFeature"],
    "formula_summation": ["aggregatedFeatureGroup", "origin-to-aggregated", "summation", "parameter", "multiplier", "original-features", "inputFeature", "sampling"],
    "formula_xj": ["original-features", "inputFeature"],
    "formula_degree": ["multiplier", "origin-to-aggregated", "parameter", "attention"],
    "formula_activation": ["relu-icon"]
}

export const formulaTextClass: { [k: string]: string[] } = {
    "formula_weights": ["weightMatrixText"],
    "formula_bias": ["biasText"],
    "formula_x": ["outputText"],
    "formula_summation": ["aggText"],
    "formula_degree": [],
    "formula_xj": [],
    "formula_activation": ["reluText"]
}

export const nodeSelectionList = [
    148, 407, 79, 116, 994, 632, 71, 110, 420, 772, 394, 109, 241, 471
];

export const midGraphNodeSelectionList = [
    317, 784, 203, 651, 50, 70, 297, 696, 623, 590, 194
];

export const twitchNodeSelectionList = [
    194, 497, 567, 590, 1147, 1169, 1588, 1882, 
    1906, 2369, 2779, 3649, 3728, 3797, 4591, 
    4990, 5117, 6509
];

export const nodeList: { [k: string]: string } = {
    karate: "./json_data/nodes/karate_dataset1.json",
};

export const linkList: { [k: string]: string } = {
    twitch_EN: "./json_data/links/twitch.json",
};

export const modelList: { [k: string]: string } = {
    "GCN - graph classification": "./gnn_model2.onnx",
    "GCN - node classification": "./gnn_node_model.onnx",
    "GCN - link prediction": "./gnn_link_model.onnx",
    "GAT - link prediction": "./gat_link_model.onnx",
    "GraphSAGE - link prediction": "./sage_link_model.onnx"
};


export const simulatedModelList: { [k: string]: string } = {
    "graph-task-simodel": "./simulations/simulated_gcn_graph_model.onnx",
    "node-task-simodel": "./simulations/simulated_gcn_node_model.onnx",
};

// export const modelGATList: { [k: string]: string } = {
//   "GAT link classification": "./gat_link_model.onnx"
// };

// export const modelGraphSAGEList: { [k: string]: string } = {
//   "GraphSAGE link classification": "./sage_link_model.onnx"
// };

export const modelTypeList: { [k: string]: string } = {
    "GCN": "GCN",
    "GAT": "GAT",
    "GraphSAGE": "GraphSAGE"
};

const chemicalNames = ['C16NO2', 'C6FNO2', 'C7NO3']
function graph_list_generate(namelist: string[]) {
    let res: { [k: string]: string } = { };

    for (let i = 0; i < namelist.length; i++) {
        res[`molecule_${chemicalNames[i]}`] = `./json_data/graphs/input_graph${i}.json`;
    }

    console.log("Generating graph list with chemical names:", res);

    return res;
}

export const graphList = graph_list_generate(chemicalNames);

export const MUTAG_INFO = <p>Each graph in the <a className={`underline ${inter3.className}`} href="https://huggingface.co/datasets/graphs-datasets/MUTAG" target="__blank">MUTAG dataset</a> represents a chemical compound. Nodes are atoms and edges are bonds between atoms.
    The task is to predict whether a molecule is mutagenic on Salmonella typhimuriumor or not (i.e., can cause genetic mutations in this bacterium or not).
    The dataset has 188 graphs in total, with 150 graphs in the training set and 38 graphs in the test set.
</p>;

export const KARATE_INFO = <p> <a className={`underline ${inter3.className}`} href="https://pytorch-geometric.readthedocs.io/en/2.5.3/generated/torch_geometric.datasets.KarateClub.html" target="__blank">Zachary`s karate club dataset</a> is a social network of a university karate club.
    Nodes are people and edges are friendships between people. Each person belongs to one of four communities.
    The task is to predict the community of a person.
    The training set has 4 person.
</p>;

const TWITCH_INFO = <p><a className={`underline ${inter3.className}`} href="https://snap.stanford.edu/data/twitch_gamers.html" target="__blank">The Twitch dataset</a> is a social network of Twitch users. Nodes are Twitch users and edges are mutual follower relationships between them.
    The task is to predict whether two users are friends or not. The graph has 77774 edges in total, with 60052 in the training set.
</p>

export const DatasetInfo: { [k: string]: JSX.Element } = {
    "GCN - node classification": KARATE_INFO,
    "GCN - graph classification": MUTAG_INFO,
    "GCN - link prediction": TWITCH_INFO,
    "GAT - link prediction": TWITCH_INFO,
    "GraphSAGE - link prediction": TWITCH_INFO,
};


export const INTRO_STEPS = [
    {
        // element: "#gnn101",
        intro: "🎉 Welcome to GNN 101! Ready to dive into the world of Graph Neural Networks? For best experience, we highly recommend using Chrome or Edge browser. ",
    },
    {
        element: "#model-selector",
        intro: "🔍 GNN models of different tasks and architectures!",
    },
    {
        element: "#graph-selector",
        intro: "🔍 Explore different graphs used in GNN. ",
    },
    // {
    //     element: '#task-selector',
    //     intro: 'Click here to select the task for GNN!',
    // },
    // {
    //     element: '#model-architecture',
    //     intro: 'The model architecture menu is here!',
    // },
    // {
    //     element: '#dataset-selector',
    //     intro: 'Click here to switch the input data!',
    // },
    // {
    //     element: '#dataset-description',
    //     intro: 'The dataset description is here!',
    // },
    // {
    //     element: '#graph-statistics',
    //     intro: 'Here is the graph statistic!',
    // },
    {
        element: '#text-panel',
        intro: '📖  Dive deeper into GNNs with the text panel! Scroll down to see more!',
    },
    {
        element: '#click-to-predict',
        intro: '🚀 Ready to start? Click "Start Prediction" ',
    }
];