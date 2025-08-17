// test

import { inter3 } from "@/pages";

export const formulaClass: { [k: string]: string[] } = {
    "formula_weights": ["weight-matrix-frame", "columnGroup", "weight-matrix-text"],
    "formula_bias": ["biasFrame", "bias"],
    "formula_x": ["output", "outputFeature"],
    "formula_summation": [
        "aggregatedFeatureGroup", 
        "origin-to-aggregated", 
        "summation", 
        "parameter", 
        "multiplier", 
        "original-features", 
        "inputFeature", 
        "sampling",
        "summation-rect",
        "inputFeatureRect"
    ],
    "formula_xj": ["original-features", "inputFeature", "inputFeatureRect"],
    "formula_degree": ["multiplier", "origin-to-aggregated", "parameter", "attention"],
    "formula_activation": ["relu-icon"]
}

export const formulaInterpretation: any = {
    "formula_weights": {
        "title": "Weight Matrix",
        "text1": "A learnable weight matrix that transforms input features",
        "text2": "(same length as each column) to output features (same length as each row)"
    },
    "formula_bias": {
        "title": "Bias",
        "text1": "A learnable bias vector added to the transformed features.",
        "text2": "It helps the model to fit the data better by shifting the output."
    },
    "formula_x": {
        "title": "Output Features",
        "text1": "The output features of the GNN layer.",
        "text2": "These are the transformed features after applying the weight matrix and bias."
    },
    "formula_summation": {
        "GCN": {
            "title": "GCN Aggregation",
            "text1": "The summation of the features of the current node and its neighbors, ",
            "text2": "multiplied with degree multipliers before multiply with weight matrix."
        },
        "GAT": {
            "title": "GAT Aggregation",
            "text1": "The summation of the features of the current node and its neighbors.",
            "text2": "multiplied with attention scores before multiply with weight matrix."
        },
        "GraphSAGE": {
            "title": "GraphSAGE Aggregation",
            "text1": "The summation of the features of the current node and its neighbors,",
            "text2": "with an user-defined aggregator(e.g., mean, max, LSTM)."
        }
    },
    "formula_xj": {
        "title": "Input Features",
        "text1": "The features of the input nodes.",
        "text2": "These are the features that will be transformed by the weight matrix."
    },
    "formula_degree": {
        "GCN": {
            "title": "A Value from Degree Matrix",
            "text1": "A value derived from the degree of the current node and its neighbors,where e_{i, j} = 1, ",
            "text2": "d_i is the degree of current node, and d_j is the degree of a designated neighbor node."
        },
        "GAT": {
            "title": "Attention Score",
            "text1": "An attention mechanism that assigns different weights to different neighbors,",
            "text2": "as a multiplier in the aggregation process of GAT."
        }
    },
    "formula_activation": {
        "title": "Activation Function",
        "text1": "A non-linear function applied to the output features.",
        "text2": "This introduces non-linearity to the model, allowing it to learn complex patterns."
    }

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
 317, 784, 203, 651, 50, 70, 297, 696, 623, 590, 194
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
    "GraphSAGE - link prediction": "./sage_link_model.onnx",
    "GCN - graph classification(Sandbox)": "./simulations/simulated_gcn_graph_model.onnx",
    "GCN - node classification(Sandbox)": "./simulations/simulated_gcn_node_model.onnx",
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
    {
        element: '#text-panel',
        intro: '📖  Dive deeper into GNNs with the text panel! Scroll down to see more!',
    },
    {
        element: '#click-to-predict',
        intro: '🚀 Ready to start? Click "Start Prediction" ',
    }
];

export const dualViewVisualizerStyle = `
    .container {
      display: flex;
      gap: 20px;
      padding: 20px;
    }
    .view {
      border: 1px solid #ccc;
      padding: 10px;
    }
    .node {
      fill: white;
      stroke: #69b3a2;
      stroke-width: 1.5px;
      cursor: pointer;
    }
    .node.highlighted {
      fill: #006d5b; 
      stroke: #004f41; 
      stroke-width: 2px;
    }
    .link {
      stroke: #aaa;
      stroke-width: 1px;
      stroke-opacity: 0.6;
      cursor: pointer;
    }
    .link.highlighted {
      stroke: #006d5b; 
      stroke-width: 2px;
      stroke-opacity: 1;
    }
    .matrix-cell {
      stroke: #fff;
      stroke-width: 0.5px;
      cursor: pointer;
    }
    .matrix-cell.highlighted {
      fill: #006d5b !important;
      stroke: #004f41;
      stroke-width: 1px;
    }
    .node-label {
      font-size: 10px;
      pointer-events: none;
      text-anchor: middle;
      dominant-baseline: middle;
    }
    .axis-label {
      font-size: 11px;
    }
    .info-container-wrapper {
      display: flex;
      gap: 20px;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
      position: relative;
    }
    .info-container {
      background: #f9f9f9;
      padding: 10px 15px;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      font-size: 14px;
      flex: 1;
      min-width: 250px;
      position: relative;
      color: #333;
    }
    .info-title {
      font-size: 16px;
      font-weight: bold;
      position: relative;
      color: #333;
    }
    .info-box {
      position: relative;
      width: 100%;
      background: white;
      padding: 10px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
      font-size: 13px;
      line-height: 1.5;
      z-index: 10;
      margin-top: 10px;
      color: #333;
    }
    @media (max-width: 768px) {
      .info-container-wrapper {
        flex-direction: column;
      }
    }
  `;

