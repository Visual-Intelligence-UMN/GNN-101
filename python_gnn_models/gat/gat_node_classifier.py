#%%
import os
import torch
os.environ['TORCH'] = torch.__version__
print(torch.__version__)

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

import torch
from torch.nn import Linear
from torch_geometric.nn import GATConv


class GAT(torch.nn.Module):
    def __init__(self):
        super().__init__()
        torch.manual_seed(1234)
        self.conv1 = GATConv(dataset.num_features, 4)
        self.conv2 = GATConv(4, 4)
        self.conv3 = GATConv(4, 2)
        self.classifier = Linear(2, dataset.num_classes)

    def forward(self, x, edge_index):
        # print("Input shapes:")
        # print("x:", x.shape)
        # print("edge_index:", edge_index.shape)
        outputs = {}
        h = self.conv1(x, edge_index)
        h = h.tanh()
        outputs["gat1"] = h
        h = self.conv2(h, edge_index)
        h = h.tanh()
        outputs["gat2"] = h
        h = self.conv3(h, edge_index)
        h = h.tanh()  # Final GNN embedding space.
        outputs["gat3"] = h
        # Apply a final (linear) classifier.
        out = self.classifier(h)
        outputs["final"] = out
        return outputs

model = GAT()
print(model)

#%%

import time
model = GAT()
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

for epoch in range(101):
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
                  "gat_node_model.onnx",    # where to save the model
                  export_params=True,  # store the trained parameter weights inside the model file
                  opset_version=17,    # the ONNX version to export the model to
                #   do_constant_folding=True,  # whether to execute constant folding for optimization
                  input_names = ['x', 'edge_index'],   # the model's input names
                  output_names=['gat1', 'gat2', 'gat3', 'final'],
                  dynamic_axes={'x': {0: 'num_nodes'},
                                'edge_index': {1: 'num_edges'},
                                'output': {0: 'batch_size'}})  # which axes should be considered dynamic)



