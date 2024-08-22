import { electricConstantDependencies } from "mathjs";

export const graphList = graph_list_generate(3);

export const nodeList: { [k: string]: string } = {
  karate: "./json_data/nodes/karate_dataset1.json",
};

export const linkList: { [k: string]: string } = {
  twitch_EN: "./json_data/links/twitch.json",
};

export const modelList: { [k: string]: string } = {
  "graph classification": "./gnn_model2.onnx",
  "node classification": "./gnn_node_model.onnx",
  //  "link classification": "./gnn_link_model.onnx",
};
export const formulaClass: { [k: string]: string[]} = {
  "formula_weights": ["weight-matrix-frame", "weightUnit"],
  "formula_bias": ["biasFrame", "bias"],
  "formula_x": ["output", "outputFeature"],
  "formula_summation": ["aggregatedFeatureGroup", "origin-to-aggregated", "summation", "multiplier"],
  "formula_neighbor_aggregate": ["original-features", "inputFeature"],
  "formula_activation": ["relu-icon"]
}

export const formulaTextClass: { [k: string]: string[]} = {
  "formula_weights": ["weightMatrixText"],
  "formula_bias": ["biasText"],
  "formula_x": ["outputText"],
  "formula_summation": ["aggText"],
  "formula_neighbor_aggregate": [],
  "formula_activation": ["reluText"]
}

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
  "edge classification": TWITCH_INFO,
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