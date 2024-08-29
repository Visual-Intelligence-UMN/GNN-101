import { electricConstantDependencies } from "mathjs";

export const graphList = graph_list_generate(3);

export const nodeList: { [k: string]: string } = {
  karate: "./json_data/nodes/karate_dataset1.json",
};

export const linkList: { [k: string]: string } = {
  twitch_EN: "./json_data/links/twitch.json",
};

export const modelList: { [k: string]: string } = {
  "GCN - graph classification": "./gnn_model2.onnx",
  "GCN - node classification": "./gnn_node_model.onnx",
  "GCN - link classification": "./gnn_link_model.onnx",
  "GAT - link classification": "./gat_link_model.onnx",
  "GraphSAGE - link classification": "./sage_link_model.onnx"
};

// export const modelGATList: { [k: string]: string } = {
//   "GAT link classification": "./gat_link_model.onnx"
// };

// export const modelGraphSAGEList: { [k: string]: string } = {
//   "GraphSAGE link classification": "./sage_link_model.onnx"
// };

export const modelTypeList:{ [k: string]: string } = {
  "GCN":"GCN",
  "GAT":"GAT",
  "GraphSAGE":"GraphSAGE"
};

export const formulaClass: { [k: string]: string[]} = {
  "formula_weights": ["weight-matrix-frame", "columnGroup"],
  "formula_bias": ["biasFrame", "bias"],
  "formula_x": ["output", "outputFeature"],
  "formula_summation": ["aggregatedFeatureGroup", "origin-to-aggregated", "summation", "parameter","multiplier", "original-features", "inputFeature", "sampling"],
  "formula_xj": ["original-features", "inputFeature"],
  "formula_degree": ["multiplier", "origin-to-aggregated", "parameter", "attention"],
  "formula_activation": ["relu-icon"]
}

export const formulaTextClass: { [k: string]: string[]} = {
  "formula_weights": ["weightMatrixText"],
  "formula_bias": ["biasText"],
  "formula_x": ["outputText"],
  "formula_summation": ["aggText"],
  "formula_degree":[],
  "formula_xj": [],
  "formula_activation": ["reluText"]
}

export const nodeSelectionList = [
  148, 407, 79, 116, 994, 632, 71, 110, 420, 772, 394, 109, 241, 471
];

export const midGraphNodeSelectionList = [
  696, 784, 203, 651, 50, 70, 297, 317, 623, 590, 194
];

function graph_list_generate(num: number) {
  let res: { [k: string]: string } = {};
  res["graph_0"] = "./input_graph.json";
  for (let i = 0; i < num; i++) {
    res[`graph_${i}`] = `./json_data/graphs/input_graph${i}.json`;
  }

  return res;
}

export const MUTAG_INFO = `Each graph in the MUTAG dataset represents a chemical compound. Nodes are atoms and edges are bonds between atoms.
The task is to predict whether a molecule is mutagenic on Salmonella typhimuriumor or not (i.e., can cause genetic mutations in this bacterium or not).
The dataset has 188 graphs in total, with 150 graphs in the training set and 38 graphs in the test set.
`;

export const KARATE_INFO = `Zachary's karate club dataset is a social network of a university karate club.
Nodes are people and edges are friendships between people. Each person belongs to one of four communities. 
The task is to predict the community of a person.
The training set has 4 person.
`;

const TWITCH_INFO = `The Twitch dataset is a social network of Twitch users. Nodes are Twitch users and edges are mutual follower relationships between them. 
The task is to predict whether two users are friends or not. The graph has 77774 edges in total, with 60052 in the training set.
`;

export const DatasetInfo: { [k: string]: string } = {
  "node classification": KARATE_INFO,
  "graph classification": MUTAG_INFO,
  "link classification": TWITCH_INFO,
  "GAT link classification": TWITCH_INFO,
  "GraphSAGE link classification": TWITCH_INFO,
};


export const INTRO_STEPS = [
    {
        // element: "#gnn101",
        intro: "🎉 Welcome to GNN 101! Ready to dive into the world of Graph Neural Networks?",
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