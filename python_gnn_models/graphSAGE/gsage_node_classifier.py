#%%
# Install required packages.
import os
import torch
os.environ['TORCH'] = torch.__version__
print(torch.__version__)

# Helper function for visualization.
import networkx as nx
import matplotlib.pyplot as plt


def visualize_graph(G, color):
    plt.figure(figsize=(7,7))
    plt.xticks([])
    plt.yticks([])
    nx.draw_networkx(G, pos=nx.spring_layout(G, seed=42), with_labels=False,
                     node_color=color, cmap="Set2")
    plt.show()


def visualize_embedding(h, color, epoch=None, loss=None):
    plt.figure(figsize=(7,7))
    plt.xticks([])
    plt.yticks([])
    h = h.detach().cpu().numpy()
    plt.scatter(h[:, 0], h[:, 1], s=140, c=color, cmap="Set2")
    if epoch is not None and loss is not None:
        plt.xlabel(f'Epoch: {epoch}, Loss: {loss.item():.4f}', fontsize=16)
    plt.show()

#%%

from torch_geometric.datasets import KarateClub

dataset = KarateClub()
print(f'Dataset: {dataset}:')
print('======================')
print(f'Number of graphs: {len(dataset)}')
print(f'Number of features: {dataset.num_features}')
print(f'Number of classes: {dataset.num_classes}')
print("dataset", dataset)


#%%

data = dataset[0]  # Get the first graph object.

print(data)
print('==============================================================')

# Gather some statistics about the graph.
print(f'Number of nodes: {data.num_nodes}')
print(f'Number of edges: {data.num_edges}')
print(f'Average node degree: {data.num_edges / data.num_nodes:.2f}')
print(f'Number of training nodes: {data.train_mask.sum()}')
print(f'Training node label rate: {int(data.train_mask.sum()) / data.num_nodes:.2f}')
print(f'Has isolated nodes: {data.has_isolated_nodes()}')
print(f'Has self-loops: {data.has_self_loops()}')
print(f'Is undirected: {data.is_undirected()}')


#%%
edge_index = data.edge_index
print(edge_index.t())

#%%

from torch_geometric.utils import to_networkx

G = to_networkx(data, to_undirected=True)
visualize_graph(G, color=data.y)

#%%

import torch
from torch.nn import Linear
from torch_geometric.nn import SAGEConv


class SAGE(torch.nn.Module):
    def __init__(self):
        super().__init__()
        torch.manual_seed(1234)
        self.conv1 = SAGEConv(dataset.num_features, 4)
        self.conv2 = SAGEConv(4, 4)
        self.conv3 = SAGEConv(4, 2)
        self.classifier = Linear(2, dataset.num_classes)

    def forward(self, x, edge_index):
        # print("Input shapes:")
        # print("x:", x.shape)
        # print("edge_index:", edge_index.shape)
        outputs = {}
        h = self.conv1(x, edge_index)
        h = h.tanh()
        outputs["sage1"] = h
        h = self.conv2(h, edge_index)
        h = h.tanh()
        outputs["sage2"] = h
        h = self.conv3(h, edge_index)
        h = h.tanh()  # Final GNN embedding space.
        outputs["sage3"] = h
        # Apply a final (linear) classifier.
        out = self.classifier(h)
        outputs["final"] = out
        return outputs

model = SAGE()
print(model)

#%%

model = SAGE()

outputs = model(data.x, data.edge_index)

print(f'conv1 shape: {list(outputs['conv1'].shape)}')
print(f'conv2 shape: {list(outputs['conv2'].shape)}')
print(f'conv3 shape: {list(outputs['conv3'].shape)}')
print(f'final shape: {list(outputs['final'].shape)}')

# the data structure to stores all intermediate data output
print("output dictionary", outputs)

visualize_embedding(outputs['conv3'], color=data.y)

#%%

import time
model = SAGE()
criterion = torch.nn.CrossEntropyLoss()  # Define loss criterion.
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)  # Define optimizer.

def train(data):
    optimizer.zero_grad()  # Clear gradients.
    outputs = model(data.x, data.edge_index)  # Perform a single forward pass.
    out = outputs["final"]
    h = outputs["conv3"]
    loss = criterion(out[data.train_mask], data.y[data.train_mask])  # Compute the loss solely based on the training nodes.
    loss.backward()  # Derive gradients.
    optimizer.step()  # Update parameters based on gradients.
    return loss, h

for epoch in range(401):
    print("epoch", epoch)
    loss, h = train(data)
    # if epoch % 10 == 0:
    #     visualize_embedding(h, color=data.y, epoch=epoch, loss=loss)
    #     time.sleep(0.3)

#%%

# dummy data testing
x_dummy = torch.rand(34, 34)
print(f"x: {x_dummy.size()}")

edge_index_dummy = torch.randint(0, 34, (2, 156))  
print(f"edge_index: {edge_index_dummy.size()}")

dummy_input = (x_dummy, edge_index_dummy)
print("simulation dummy input", dummy_input)

#%%

# python model to ONNX model
torch.onnx.export(model,               # model being run
                  dummy_input,         # model input 
                  "sage_node_model.onnx",    # where to save the model
                  export_params=True,  # store the trained parameter weights inside the model file
                  opset_version=17,    # the ONNX version to export the model to
                #   do_constant_folding=True,  # whether to execute constant folding for optimization
                  input_names = ['x', 'edge_index'],   # the model's input names
                  output_names=['sage1', 'sage2', 'sage3', 'final'],
                  dynamic_axes={'x': {0: 'num_nodes'},
                                'edge_index': {1: 'num_edges'},
                                'output': {0: 'batch_size'}})  # which axes should be considered dynamic)

#%%
# export data from dataset
import json, torch
def data_to_json(data):
    json_data = {}
    
    # Convert node features to a list of lists
    if data.x is not None:
        json_data['x'] = data.x.tolist()  # Assuming x is a tensor of node features
    
    # Convert edge index to a list of pairs/lists
    if data.edge_index is not None:
        edge_index_list = data.edge_index.tolist()  # Convert to [2] and then to list
        json_data['edge_index'] = edge_index_list 
    
    # Convert labels to a list
    if data.y is not None:
        json_data['y'] = data.y.tolist()  
    num_nodes = data.x.size(0)
    batch = torch.zeros(num_nodes, dtype=torch.int32)
    json_data['batch'] = batch.tolist()

    if data.train_mask is not None:
        json_data['train_mask'] = data.train_mask.tolist()
        train_nodes = torch.where(data.train_mask == True)[0].tolist()
        json_data["train_nodes"] = train_nodes
    
    return json_data

json_data = data_to_json(dataset[0])
with open(f'karate_dataset1.json', 'w') as f:
    json.dump(json_data, f, indent=4)

#%%

# test the ONNX model
import numpy as np

def softmax(x):
    exp_x = np.exp(x - np.max(x, axis=-1, keepdims=True))
    return exp_x / np.sum(exp_x, axis=-1, keepdims=True)

import onnx
import onnxruntime as ort

data = dataset[0]

x = data.x.numpy().astype('float32')
edge_index = data.edge_index.numpy().astype('int64')

edge_attr = torch.ones(edge_index.shape[1], 1).numpy().astype('float32')
onnx_model_path = "sage_node_model.onnx"
onnx_model = onnx.load(onnx_model_path)
onnx.checker.check_model(onnx_model)

ort_session = ort.InferenceSession(onnx_model_path)

ort_inputs = {
    'x': x,
    'edge_index': edge_index
}

ort_outputs = ort_session.run(None, ort_inputs)

print("ort outputs",ort_outputs)

logits = ort_outputs[0]
probs = softmax(logits)
print("probs", probs, probs.shape)
predicted_classes = logits.argmax(axis=1)

print("predicted classes", predicted_classes, predicted_classes.shape)

#%%
# export weights of the model
import onnx
import numpy as np
import json

weights = {}


with open('sage_node_weights11111.json', 'w') as f:
    json.dump(weights, f)


#%%
# weights analysis
import json
import numpy as np

def extract_keys(data, keys_set=None):
    if keys_set is None:
        keys_set = set()
    
    if isinstance(data, dict):
        for key, value in data.items():
            keys_set.add(key)
            extract_keys(value, keys_set)
    elif isinstance(data, list):
        for item in data:
            extract_keys(item, keys_set)
    
    return keys_set

with open("sage_node_weights.json", "r") as file:
    data = json.load(file)

print(data)

keys = extract_keys(data)

# print all keys in json
print("All keys:", keys)

for k in keys:
    d = np.array(data[k])
    print(k,d.shape)

# weights data file analysis




