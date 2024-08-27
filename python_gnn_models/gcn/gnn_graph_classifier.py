#%%

# https://colab.research.google.com/drive/1I8a0DfQ3fI7Njc62__mVXUlcAleUclnb?usp=sharing
# Install required packages.
import os
import torch
os.environ['TORCH'] = torch.__version__
print(torch.__version__)
#
# # pip install -q torch-scatter -f https://data.pyg.org/whl/torch-2.1.0.html
# # pip install -q torch-sparse -f https://data.pyg.org/whl/torch-2.1.0.html
# # pip install -q git+https://github.com/pyg-team/pytorch_geometric.git
#
# %%
from torch_geometric.datasets import TUDataset
#
dataset = TUDataset(root='data/TUDataset', name='MUTAG')
print(dataset[0])
#
print()
print(f'Dataset: {dataset}:')
print('====================')
print(f'Number of graphs: {len(dataset)}')
print(f'Number of features: {dataset.num_features}')
print(f'Number of classes: {dataset.num_classes}')

# data = dataset[0]  # Get the first graph object.

# print()
# print(data)
# print('=============================================================')

# # Gather some statistics about the first graph.
# print(f'Number of nodes: {data.num_nodes}')
# print(f'Number of edges: {data.num_edges}')
# print(f'Average node degree: {data.num_edges / data.num_nodes:.2f}')
# print(f'Has isolated nodes: {data.has_isolated_nodes()}')
# print(f'Has self-loops: {data.has_self_loops()}')
# print(f'Is undirected: {data.is_undirected()}')

torch.manual_seed(12345)
dataset = dataset.shuffle()
# for data in dataset:
#     data.edge_index = data.edge_index.to(torch.int32) # use int32 for ONNX

train_dataset = dataset[:150]
test_dataset = dataset[150:]

print(f'Number of training graphs: {len(train_dataset)}')
print(f'Number of test graphs: {len(test_dataset)}')

from torch_geometric.loader import DataLoader

train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=64, shuffle=False)

for step, data in enumerate(train_loader):
    print(f'Step {step + 1}:')
    print('=======')
    print(f'Number of graphs in the current batch: {data.num_graphs}')
    print(data)
    print()

from torch.nn import Linear
import torch.nn.functional as F
from torch_geometric.nn import GCNConv
from torch_geometric.nn import global_mean_pool


class GCN(torch.nn.Module):
    def __init__(self, hidden_channels):
        super(GCN, self).__init__()
        torch.manual_seed(12345)
        self.conv1 = GCNConv(dataset.num_node_features, hidden_channels)
        self.conv2 = GCNConv(hidden_channels, hidden_channels)
        self.conv3 = GCNConv(hidden_channels, hidden_channels)
        self.lin = Linear(hidden_channels, dataset.num_classes)

    def forward(self, x, edge_index, batch):
        outputs = {}
        # print("Input shapes:")
        # print("x:", x.shape)
        # print("edge_index:", edge_index.shape)
        # print("batch:", batch.shape)
        # 1. Obtain node embeddings
        edge_index = edge_index.to(torch.int64)
        batch = batch.to(torch.int64)
        x = self.conv1(x, edge_index)
        x = x.relu()
        outputs['conv1'] = x
        x = self.conv2(x, edge_index)
        x = x.relu()
        outputs['conv2'] = x
        x = self.conv3(x, edge_index)
        outputs['conv3'] = x
        # 2. Readout layer
        x = global_mean_pool(x, batch)  # [batch_size, hidden_channels]
        outputs["pooling"] = x
        # 3. Apply a final classifier
        x = F.dropout(x, p=0.5, training=self.training)
        outputs["dropout"] = x
        x = self.lin(x)
        outputs['final'] = x
        return outputs


model = GCN(hidden_channels=64)
print(model)

optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
criterion = torch.nn.CrossEntropyLoss()

def train():
    model.train()

    for data in train_loader:  # Iterate in batches over the training dataset.
         out = model(data.x, data.edge_index, data.batch)  # Perform a single forward pass.
         loss = criterion(out["final"], data.y)  # Compute the loss.
         loss.backward()  # Derive gradients.
         optimizer.step()  # Update parameters based on gradients.
         optimizer.zero_grad()  # Clear gradients.

def test(loader):
     model.eval()

     correct = 0
     for data in loader:  # Iterate in batches over the training/test dataset.
         out = model(data.x, data.edge_index, data.batch)
         # print(data.x)
         # print(data.edge_index)
         # print(data.)
         pred = out["final"].argmax(dim=1)  # Use the class with highest probability.
         correct += int((pred == data.y).sum())  # Check against ground-truth labels.
     return correct / len(loader.dataset)  # Derive ratio of correct predictions.

#%%
for epoch in range(1, 171):
    train()
    train_acc = test(train_loader)
    test_acc = test(test_loader)
    print(f'Epoch: {epoch:03d}, Train Acc: {train_acc:.4f}, Test Acc: {test_acc:.4f}')

# %%
# dummy_input = torch.randn(1, 3, requires_grad=True)  # Example input; adjust as needed
# Assuming 'dataset' is your TUDataset instance
num_node_features = dataset.num_node_features
# Create a dummy input
num_nodes = 10  # Example: number of nodes in a graph, which varies from graph to graph
num_edges = 30  # Example: number of edges in a graph

x_dummy = torch.randn(num_nodes, num_node_features, requires_grad=True, dtype=torch.float32)
edge_index_dummy = torch.randint(0, num_nodes, (2, num_edges), dtype=torch.int32) # 0 low number bound, num_nodes high number bound
batch_dummy = torch.zeros(num_nodes, dtype=torch.int32)  # Assuming a single graph in the batch for simplicity

dummy_input = (x_dummy, edge_index_dummy, batch_dummy)

'''
x: Node Features Matrix
Structure: [num_nodes, num_node_features]
Meaning: This is a matrix where each row represents the feature vector of a node. num_nodes is the total number of nodes in the graph, and num_node_features is the dimensionality of the feature vector for each node. These features can represent various properties depending on the dataset (e.g., chemical properties in molecular graphs).
# 
edge_index: Graph Connectivity
Structure: [2, num_edges]
Meaning: This attribute defines the connections between nodes in the graph. It is a matrix with two rows, where each column represents an edge. The first row contains the source nodes' indices, and the second row contains the target nodes' indices. This format is known as COO (coordinate) format. Note that the graph could be undirected or directed, affecting how edges are interpreted.
# 
y: Graph or Node Labels
Structure: [num_graphs] or [num_nodes]
Meaning: The label for each graph or node, depending on the task. For graph classification tasks, y typically has a single label per graph, indicating the class to which the entire graph belongs. For node classification tasks, each node has its own label.
# 
edge_attr: Edge Attributes
Structure: [num_edges, num_edge_features] (optional)
Meaning: Similar to x but for edges, this is a matrix where each row contains the feature vector of an edge, and num_edge_features is the dimensionality of the edge feature vector. This attribute is not always present, depending on whether the edges in the dataset have associated features.
# 
y: graph labels
Structure: [num_graphs, *] 
# 
batch: Batch Index
Structure: [num_nodes] (generated by DataLoader)
Meaning: This attribute is not part of the original Data object but is added when using PyTorch Geometric's DataLoader to batch multiple graphs together for model training. It indicates to which graph in the batch a node belongs. This allows for efficient batch processing of graphs of different sizes.
'''

# Export the model
torch.onnx.export(model,               # model being run
                  dummy_input,         # model input 
                  "gnn_model.onnx",    # where to save the model
                  export_params=True,  # store the trained parameter weights inside the model file
                  opset_version=17,    # the ONNX version to export the model to
                #   do_constant_folding=True,  # whether to execute constant folding for optimization
                  input_names = ['x', 'edge_index', 'batch'],   # the model's input names
                  output_names=['conv1', 'conv2', 'conv3', 'pooling','dropout','final'],
                  dynamic_axes={'x': {0: 'num_nodes'},
                                'edge_index': {1: 'num_edges'},
                                'batch': {0: 'num_nodes'},
                                'output': {0: 'batch_size'}})  # which axes should be considered dynamic)
#%%
# ###########################
# Save one graph input as JSON
# ###########################
import json
def data_to_json(data):
    json_data = {}
    
    # Convert node features to a list of lists
    if data.x is not None:
        json_data['x'] = data.x.tolist()  # Assuming x is a tensor of node features
    
    # Convert edge index to a list of pairs/lists
    if data.edge_index is not None:
        edge_index_list = data.edge_index.tolist()  # Convert to [2] and then to list
        json_data['edge_index'] = edge_index_list

    if data.edge_attrs is not None:
        edge_attr_list = data.edge_attr.tolist()
        json_data['edge_attr'] = edge_attr_list    
    
    # Convert labels to a list
    if data.y is not None:
        json_data['y'] = data.y.tolist()  
    num_nodes = data.x.size(0)
    batch = torch.zeros(num_nodes, dtype=torch.int32)
    json_data['batch'] = batch.tolist()
    
    
    return json_data




json_data = data_to_json(dataset[0])
with open(f'temp/public/json_data/input_graph{0}.json', 'w') as f:
    json.dump(json_data, f, indent=4)
# %%
