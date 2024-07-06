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
                <div style={{ padding: 20 }}>
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
                    <h1 className="text-2xl font-black text-3xl">Input Data of a GNN:</h1>
                    <p>
                        To start, let’s establish what a graph is. A graph represents the
                        relations (edges) between a collection of entities (nodes). For
                        example, the right panel shows a graph of a chemical compound, from
                        the{" "}
                        <a href="https://huggingface.co/datasets/graphs-datasets/MUTAG" target="__blank">
                            MUTAG
                        </a>{" "}
                        dataset. In this graph, nodes are atoms and edges are bonds between
                        atoms.
                    </p>

                    <p>
                        <button
                            className={styles.button}
                            onClick={() => props.setIsGraphView(!props.isGraphView)}
                        >
                            Click to show {props.isGraphView ? "Adjacency Matrix" : "Node Link Graph"}
                        </button>
                        <br />
                        A graph can be represented as either a node-link diagram or an adjacency matrix.
                        An adjacency matrix is a square matrix where the rows and columns of
                        <br />
                    </p>

                    <p>
                        <span className={styles.tag}>Node Features </span> The information of each graph node can be stored as embeddings.
                        For example, in the chemical compound graph, an one-hot
                        encoding is used to represent the atom type, whether it is a carbon,
                        oxygen, nitrogen, etc.
                        {/* TODO: maybe also show node features before clicking prediction */}
                    </p>
                    <h1 className="text-2xl font-black text-3xl">Layers inside a GNN:</h1>
                    <p>
                        A layer is a function that ... Depending on how we sort the nodes,
                        the same graph can be represented by adjacent matrixes that look
                        very different from each other. Layers in a GNN needs to be
                        permutation invariant
                    </p>
                    <p>
                        <span className={styles.tag}>GCNConv </span>
                        This is a paragraph explaining how to interact with the demo. The
                        quick brown fox jumps over the lazy dog. The quick brown fox jumps
                        over the lazy dog. The quick brown fox jumps over the lazy dog. The
                        quick brown fox jumps over the lazy dog. The quick brown fox jumps
                        over the lazy dog.
                    </p>
                    <p>
                        <span className={styles.tag}>Global Pooling </span>
                        This is a paragraph explaining how to interact with the demo. The
                        quick brown fox jumps over the lazy dog. The quick brown fox jumps
                        over the lazy dog. The quick brown fox jumps over the lazy dog. The
                        quick brown fox jumps over the lazy dog. The quick brown fox jumps
                        over the lazy dog.
                    </p>

                    <h1 className="text-2xl font-black text-3xl">
                        Tasks that GNNs can solve:
                    </h1>
                    <p>
                        This is a paragraph explaining how to interact with the demo. The
                        quick brown fox jumps over the lazy dog. The quick brown fox jumps
                        over the lazy dog. The quick brown fox jumps over the lazy dog. The
                        quick brown fox jumps over the lazy dog. The quick brown fox jumps
                        over the lazy dog.
                    </p>
                    <p>
                        This is a paragraph explaining the GNN model. The quick brown fox
                        jumps over the lazy dog. The quick brown fox jumps over the lazy
                        dog. The quick brown fox jumps over the lazy dog. The quick brown
                        fox jumps over the lazy dog. The quick brown fox jumps over the lazy
                        dog. The quick brown fox jumps over the lazy dog. The quick brown
                        fox jumps over the lazy dog.
                    </p>
                    <h1 className="text-2xl font-black text-3xl">About this website:</h1>
                    <p>
                        This website is developed and maintained by the UMN Visual
                        Intelligence Lab. The GNNs you interact with are inferenced
                        real-time on the your web browser, supported by the ONNX web
                        runtime.
                        <br />
                        Team Members:
                        <br />
                        Contact:
                        <br />
                        Source Code:
                    </p>
                </div>
            </Scrollbar>
        </div>
    );
}
