import { Inter } from "@next/font/google";
import { Scrollbar } from "react-scrollbars-custom";
import styles from "./sidebar.module.css";
import { AnnotatedImage } from "@/components/WebUtils";


const inter = Inter({
    variable: "--font-inter",
    // weight: "300",
    subsets: ["latin-ext"],
});

type Props = {
    isGraphView: boolean;
    setIsGraphView: (isGraphView: boolean) => void;
    predicted: boolean;
    modelMode: string;
};
export default function Sidebar(props: Props) {
    return (
        <div className={`${styles.sidebar} ${inter.className} font-light`}>
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
                    <h1 className="text-3xl font-semibold text-3xl">What is an GNN?</h1>
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
                    <h1 className="text-3xl font-semibold text-3xl">Input Data of a GNN:</h1>
                    <p>
                        To start, let`s establish what a graph is. A graph represents the
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
                        representation of the graph where nodes are depicted as circles and
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
                    {props.isGraphView ? <AnnotatedImage imgSrc="./assets/PNGs/annotatedSrcShots/graphViewFeatures.png" label="Node Features" /> :
                        <AnnotatedImage imgSrc="./assets/PNGs/annotatedSrcShots/graphFeatures.png" label="Node Features" />}
                </div>

                <div className="p-4">
                    <h1 className="text-3xl font-semibold text-3xl">
                        Convolutions on a Graph:
                    </h1>
                    <p>
                        Graphs have an irregular structure can directly use traditional neural networks, which are designed to operate on
                        a fixed, grid-like structure input (such as sentences, images and video).
                        To process graphs, GNNs employ a technique called <span className="font-bold">message passing</span>, where neighboring nodes exchange information and update
                        each other`&apos;`s embeddings  to better reflect their interconnectedness and individual features.
                    </p>

                    {!props.predicted &&
                        `Click the "predict" button on the right side and show inner layers`}

                    <p>
                        Message-passing forms the backbone of many GNN variants.
                        GNN101 support three popular GNN variants,
                        Graph Convolutional Networks (GCN), Graph Attention
                        Networks (GAT), Graph Sample and Aggregate (GraphSAGE).
                        The main differences between these GNN variants are the way they aggregate information from neighbors and the way they update node embeddings.

                    </p>

                    <p>We will start with GCN, which is one
                        of the most popular GNN architectures.

                    </p>
                    {/* <span className={styles.button} onClick={() => { }}>Click to show GCNConv </span> */}
                    {/* <span>
                        <img src="./assets/PNGs/annotatedSrcShots/gcnconv.png" alt="GCNConv"></img>
                    </span> */}
                    {props.isGraphView ? <AnnotatedImage imgSrc="./assets/PNGs/annotatedSrcShots/gcnconvGraph.png" label="GCNConv" /> :
                        <AnnotatedImage imgSrc="./assets/PNGs/annotatedSrcShots/gcnconv.png" label="GCNConv" />
                    }
                    <ol className="list-inside list-disc">
                        <li>
                            <b className="font-bold">Aggregation with Normalization: </b>
                            First, a node aggregates the feature vectors of its neighbors <b className="font-bold">Xj</b> and itself <b className="font-bold">Xi</b> via a normalized degree matrix
                            <b className="font-bold"> W</b>. Intuitively, this reduces the influence of information from nodes with too many neighbors and strengthens the influence from those with fewer neighbors.
                        </li>
                        <AnnotatedImage imgSrc="./assets/PNGs/annotatedSrcShots/summation.png" label="Aggregated Vector" />
                        <li>
                            <b className="font-bold">Weighted Transformation:</b> The aggregated information is then transformed by a learnable weight matrix.
                            This matrix allows the model to learn the importance of different features for the central node.
                        </li>
                        <AnnotatedImage imgSrc="./assets/PNGs/annotatedSrcShots/matmul.png" label="Weighted Transformation" />
                        <li>
                            <b className="font-bold">Activation Function: </b>
                            Finally, we add a bias vector <b className="font-bold"> b </b>and a non-linear activation function <b className="font-bold"> σ </b>(ReLU) to the aggregated information to obtain an updated feature vector of this node.
                        </li>
                        <AnnotatedImage imgSrc="./assets/PNGs/annotatedSrcShots/activation.png" label="Activation Function" />
                        Note that the learnable weight matrix and bias vector are shared across all nodes in the graph, mimicking the convolution operation in CNNs and minimizing the number of parameters.
                    </ol>

                    {/* 
                    <p>
                        We are working on adding other types of GNN layers, please stay
                        tuned!
                    </p> */}
                </div>

                <div className="p-4">
                    <>
                        <h1 className="text-3xl font-semibold text-3xl">
                            Tasks that GNNs can solve:
                        </h1>
                        <AnnotatedImage imgSrc="./assets/PNGs/annotatedSrcShots/modelMenu.png" label="Model Selection Menu" />
                        <p>
                            By learning the features of each node, GNNs can then use
                            these node features to solve tasks at different levels of
                            granularity, including graph-level, node-level, community-level,
                            and edge-level tasks. This website currently supports graph-level
                            and node-level tasks. We are working on adding support for other
                            tasks, please stay tuned!
                        </p>

                        <span className={styles.tag}>Node-Level Tasks </span>
                        {/* <span className={styles.button} onClick={() => { }}>Click to Predict Nodes </span> */}
                        <p>
                            Given the learned features of each node, GNN can directly predict the node properties. For example, in the Karate dataset, the task is to
                            predict the community of each person in the social network.
                            After sevela layers of GCNConv, we apply a <b className="font-bold">fully connected layer </b> to each node to make the prediction.
                        </p>

                        {props.modelMode == "node classification" ? (props.isGraphView ? <AnnotatedImage imgSrc="./assets/PNGs/annotatedSrcShots/FCGraphNode.png" label="Fully Connected Layer" /> :
                            <AnnotatedImage imgSrc="./assets/PNGs/annotatedSrcShots/FCMatrixNode.png" label="Fully Connected Layer" />) : <></>}

                        {props.modelMode == "node classification" ? <AnnotatedImage imgSrc="./assets/PNGs/annotatedSrcShots/FCDetails.png" label="FC in Details" /> : <></>}

                        <span className={styles.tag}>Graph-Level Tasks </span>
                        {/* <span className={styles.button} onClick={() => { }}>Click to Predict a Graph </span> */}
                        <p>
                            GNN can predict the properties of the entire
                            graph by aggregating the learned feature of all graph nodes. For example, in the MUTAG dataset, the task is to predict
                            whether a molecule is mutagenic or not. After sevela layers of GCNConv, a <b className="font-bold">global mean pooling </b>
                            layer is used to aggregate the node features into a single graph
                            feature, which is then fed into <b className="font-bold">a fully connected layer</b> to make
                            the prediction.
                        </p>

                        {props.modelMode == "graph classification" ? <AnnotatedImage imgSrc="./assets/PNGs/annotatedSrcShots/pooling.png" label="Pooling Layer" /> : <></>}
                        {props.modelMode == "graph classification" ? (props.isGraphView ? <AnnotatedImage imgSrc="./assets/PNGs/annotatedSrcShots/FCGraphGraph.png" label="Fully Connected Layer" /> :
                            <AnnotatedImage imgSrc="./assets/PNGs/annotatedSrcShots/FCMatrixGraph.png" label="Fully Connected Layer" />) : <></>}
                        {props.modelMode == "graph classification" ? <AnnotatedImage imgSrc="./assets/PNGs/annotatedSrcShots/FCDetails.png" label="FC in Details" /> : <></>}

                        <span className={styles.tag}>Edge-Level Tasks </span>
                        <p>
                            GNNs can effectively predict edge properties within a graph.
                            In the Twitch dataset, for instance, the model&apos;s objective is to determine if two Twitch users are friends.
                            By employing multiple layers, the model combines the features of the two nodes associated with a specific edge using dot product multiplication.
                            Subsequently, a sigmoid function is applied to the resulting score, yielding a probability indicating the likelihood of a friendship between the two users.
                        </p>
                        {/* <p>The interactive visualization about edge classification is coming soon!</p> */}
                    </>
                </div>
                <div className="px-4">
                    <h1 className="text-3xl font-semibold text-3xl">About this website:</h1>
                    <p>
                        This website is developed and maintained by the UMN Visual
                        Intelligence Lab. The GNNs you interact with are inferenced
                        real-time on the your web browser, supported by the ONNX web
                        runtime.
                    </p>
                    🤸 Team Members:
                    <ul className="list-disc list-inside px-4">
                        <li>Yilin(Harry) Lu</li>
                        <li>Chongwei Chen</li>
                        <li>Kexin Huang</li>
                        <li>Marinka Zitnik</li>
                        <li>Matthew Xu</li>
                        <li>Qianwen Wang</li>
                    </ul>
                    📧 Contact: qianwen@umn.edu
                    <br />
                    💻 Source Code:
                    <a
                        href="https://github.com/Visual-Intelligence-UMN/web-gnn-vis"
                        target="_blank"
                    >
                        https://github.com/Visual-Intelligence-UMN/web-gnn-vis
                    </a>

                </div>

            </Scrollbar>
        </div>
    );
}
