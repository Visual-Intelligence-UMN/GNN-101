import onnxruntime as ort
import torch
import numpy as np

sess = ort.InferenceSession("gnn_model.onnx")

print("Model input names and shapes:")
for input_meta in sess.get_inputs():
    print(input_meta.name, input_meta.shape)

num_node_features = 7
num_nodes = 10
num_edges = 30

x_dummy = torch.randn(num_nodes, num_node_features).numpy().astype(np.float32)  
edge_index_dummy = torch.randint(0, num_nodes, (2, num_edges), dtype=torch.int32).numpy()  
batch_dummy = torch.zeros(num_nodes, dtype=torch.int32).numpy()  

# data preparation
inputs = {
    "x": x_dummy,
    "edge_index": edge_index_dummy,
    "batch": batch_dummy
}

# running model
outputs = sess.run(None, inputs)  

print()

# print output
for name, output in zip(sess.get_outputs(), outputs):
    print(f"{name.name}: {output}")

