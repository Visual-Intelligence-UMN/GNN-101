import { Inter } from "@next/font/google";
import { Scrollbar } from "react-scrollbars-custom";
import styles from "./sidebar.module.css";

const inter = Inter({
  variable: "--font-inter",
  weight: "300",
  subsets: ["latin-ext"],
});

type Props = {
  isGraphView: boolean;
  setIsGraphView: (isGraphView: boolean) => void;
  predicted: boolean;
};
export default function Sidebar(props: Props) {
  return (
    <div className={`${styles.sidebar} ${inter.className}`}>
      <Scrollbar
        noScrollX={true}
        removeTracksWhenNotUsed={false}
        //   maximalThumbYSize={80}
        disableTrackYWidthCompensation={true}
        trackClickBehavior={"jump" as any}
        trackYProps={{
          style: {
            width: "15px",
            borderRadius: "10px",
            backgroundColor: "#f0f0f0",
            top: "0",
            bottom: "0",
          },
        }}
        thumbYProps={{
          style: {
            backgroundColor: "#d9d9d9",
            borderRadius: "10px",
            boxShadow: "0 5px 6px rgba(0, 0, 0, 0.25)",
          },
        }}
      >
        <div className="p-4">
          <h1 className="text-2xl font-black text-3xl">What is an GNN?</h1>
          <p>
            GNN Stands for Graph Neural Networks. As its name suggests, GNN is a
            class of neural networks that operate on graph data, which is a
            collection of nodes connected by edges. Consider social networks as
            an example, GNNs can analyze connections to understand communities,
            predict behavior, or recommend products based on social
            interactions. Nowadays, GNNs are increasingly used to solve a wide
            variety of tasks such as model molecules in chemistry, predict
            protein interactions in biology, or studying citation networks in
            social science.
          </p>
        </div>

        <div className="p-4">
          <h1 className="text-2xl font-black text-3xl">Input Data of a GNN:</h1>
          <p>
            To start, let’s establish what a graph is. A graph represents the
            relations (edges) between a collection of entities (nodes). For
            example, the right panel shows a graph of a chemical compound, from
            the{" "}
            <a
              href="https://huggingface.co/datasets/graphs-datasets/MUTAG"
              target="__blank"
            >
              MUTAG
            </a>{" "}
            dataset. In this graph, nodes are atoms and edges are bonds between
            atoms.
          </p>

          <p>
            <span className={styles.tag}>Representation</span>{" "}
            <button
              className={styles.button}
              onClick={() => props.setIsGraphView(!props.isGraphView)}
            >
              Click to Switch
            </button>
            <br />
            <span style={{ color: props.isGraphView ? "black" : "gray" }}>
              {" "}
              Node Link Diagram
            </span>{" "}
            or{" "}
            <span style={{ color: props.isGraphView ? "gray" : "black" }}>
              {" "}
              Adjacency Matrix
            </span>
            <br />
            A graph can be represented as either a node-link diagram or an
            adjacency matrix. A node-link diagram is an intuitive visual
            representation of the graph where nodes are depcited as circles and
            edges are lines connecting the circles. It is easy to understand and
            informative, especially for small graphs.
            <br />
            An adjacency matrix is a square matrix where the rows and columns
            represent the nodes, and the value at each intersection (cell)
            indicates the presence or absence of an edge between the
            corresponding nodes. It is a compact way to represent the graph,
            especially for large and dense graphs.
            <br />
          </p>

          <span className={styles.tag}>Node Features</span>
          <p>
            The information of each graph node can be stored as embeddings. For
            example, in the chemical compound graph, an one-hot encoding is used
            to represent the atom type, whether it is a carbon, oxygen,
            nitrogen, etc.
            {/* TODO: maybe also show node features before clicking prediction */}
          </p>
        </div>

        <div className="p-4">
          <h1 className="text-2xl font-black text-3xl">
            Layers inside a Graph:
          </h1>
          <p>
            Traditional neural networks are designed to operate on
            regular-structured inputs (such as sentences, images and video),
            which are very different from the irregular nature of graphs. To
            process graphs, we need to define layers that can operate on the
            graph structure.
          </p>

          {!props.predicted &&
            "Click on the right side to predict and show inner layers"}

          <p>
            Depending on how we sort the nodes, the same graph can be
            represented by adjacent matrixes that look very different from each
            other. Layers in a GNN needs to be permutation invariant. Message
            passing, where neighboring nodes exchange information and influence
            each other’s updated embeddings.
          </p>

          <p>
            Message-passing forms the backbone of many GNN architectures,
            including Graph Convolutional Networks (GCN), Graph Attention
            Networks (GAT), Graph Sample and Aggregate (GraphSAGE), Graph
            Isomorphism Network (GIN), etc. We will start with GCN, which is one
            of the most popular GNN architectures.
          </p>
          <span className={styles.tag}>Click to show GCNConv </span>
          <p>
            This is a paragraph explaining how to interact with the demo. The
            quick brown fox jumps over the lazy dog. The quick brown fox jumps
            over the lazy dog. The quick brown fox jumps over the lazy dog. The
            quick brown fox jumps over the lazy dog. The quick brown fox jumps
            over the lazy dog.
          </p>

          <p>We are working on adding more GNN layers, please stay tuned!</p>
        </div>

        <div className="p-4">
          <>
            <h1 className="text-2xl font-black text-3xl">
              Tasks that GNNs can solve:
            </h1>
            <p>
              By learning the features of each node, GNNs can solve then use
              these node features to solve tasks at different levels of
              granularity, including graph-level, node-level, community-level,
              and edge-level tasks. This website currently supports graph-level
              and node-level tasks. We are working on adding support for other
              tasks, please stay tuned!
            </p>
            <span className={styles.tag}>Graph-Level Tasks </span>
            <p>
              Given a input graph, GNN can predict the properties of the entire
              graph. For example, in the MUTAG dataset, the task is to predict
              whether a molecule is mutagenic or not. A global mean pooling
              layer is used to aggregate the node features into a single graph
              feature, which is then fed into a fully connected layer to make
              the prediction.
            </p>
            <span className={styles.tag}>Node-Level Tasks </span>
            <p>
              Given a input graph, GNN can predict the properties of each node
              in the graph. For example, in the Karate dataset, the task is to
              predict the community of each person in the social network. A node
              classification layer is used to predict the label of each node.
            </p>
            <span className={styles.tag}>Edge-Level Tasks </span>
            <p>Coming Soon!</p>
          </>
        </div>

        <div className="px-4">
          <h1 className="text-2xl font-black text-3xl">About this website:</h1>
          <p>
            This website is developed and maintained by the UMN Visual
            Intelligence Lab. The GNNs you interact with are inferenced
            real-time on the your web browser, supported by the ONNX web
            runtime.
            <br />
            🤸 Team Members:
            <ul className="list-disc list-inside px-4">
              <li>Harry Lu</li>
              <li>Cheongwei Chen</li>
              <li>Matthew Xu</li>
              <li>Qianwen Wang</li>
            </ul>
            {/* email to */}
            📧 Contact: qianwen@umn.edu
            <br />
            💻 Source Code:
            <a
              href="https://github.com/Visual-Intelligence-UMN/web-gnn-vis"
              target="_blank"
            >
              https://github.com/Visual-Intelligence-UMN/web-gnn-vis
            </a>
          </p>
        </div>
      </Scrollbar>
    </div>
  );
}
