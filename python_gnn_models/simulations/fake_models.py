#%%
import torch
import torch.nn as nn
import torch.nn.functional as F

class gnn_model(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim):
        super(gnn_model, self).__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, output_dim)

    def forward(self, x, edge_index):
        x = self.fc1(x)
        x = F.relu(x)
        x = self.fc2(x)
        return x

#%%
import numpy as np
import json 

with open(r"C:\Users\luyil\GNNVis\vis-ano\GNN-101\python_gnn_models\simulations\testing_graph.json", "r") as f:
    testing_graph = json.load(f)

x = torch.tensor(testing_graph["x"], dtype=torch.float32)  # shape: [num_nodes, feature_dim]
edge_index = torch.tensor(testing_graph["edge_index"], dtype=torch.long)


# %%
