#%%
import os
import torch
os.environ['TORCH'] = torch.__version__
print(torch.__version__)

#%%

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

#%%

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
    
#%%

from torch.nn import Linear
import torch.nn.functional as F
from torch_geometric.nn import GATConv
from torch_geometric.nn import global_mean_pool


class GAT(torch.nn.Module):
    def __init__(self, hidden_channels):
        super(GAT, self).__init__()
        torch.manual_seed(12345)
        self.conv1 = GATConv(dataset.num_node_features, hidden_channels)
        self.conv2 = GATConv(hidden_channels, hidden_channels)
        self.conv3 = GATConv(hidden_channels, hidden_channels)
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
        outputs['gat1'] = x
        x = self.conv2(x, edge_index)
        x = x.relu()
        outputs['gat2'] = x
        x = self.conv3(x, edge_index)
        outputs['gat3'] = x
        # 2. Readout layer
        x = global_mean_pool(x, batch)  # [batch_size, hidden_channels]
        outputs["pooling"] = x
        # 3. Apply a final classifier
        x = F.dropout(x, p=0.5, training=self.training)
        outputs["dropout"] = x
        x = self.lin(x)
        outputs['final'] = x
        return outputs

#%%
model = GAT(hidden_channels=64)
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
for epoch in range(1, 100):
    train()
    train_acc = test(train_loader)
    test_acc = test(test_loader)
    print(f'Epoch: {epoch:03d}, Train Acc: {train_acc:.4f}, Test Acc: {test_acc:.4f}')

#%%

num_node_features = dataset.num_node_features
# Create a dummy input
num_nodes = 10  # Example: number of nodes in a graph, which varies from graph to graph
num_edges = 30  # Example: number of edges in a graph

x_dummy = torch.randn(num_nodes, num_node_features, requires_grad=True, dtype=torch.float32)
edge_index_dummy = torch.randint(0, num_nodes, (2, num_edges), dtype=torch.int32) # 0 low number bound, num_nodes high number bound
batch_dummy = torch.zeros(num_nodes, dtype=torch.int32)  # Assuming a single graph in the batch for simplicity

dummy_input = (x_dummy, edge_index_dummy, batch_dummy)

# %%
torch.onnx.export(model,               # model being run
                  dummy_input,         # model input 
                  "gat_graph_model.onnx",    # where to save the model
                  export_params=True,  # store the trained parameter weights inside the model file
                  opset_version=17,    # the ONNX version to export the model to
                #   do_constant_folding=True,  # whether to execute constant folding for optimization
                  input_names = ['x', 'edge_index', 'batch'],   # the model's input names
                  output_names=['gat1', 'gat2', 'gat3', 'pooling','dropout','final'],
                  dynamic_axes={'x': {0: 'num_nodes'},
                                'edge_index': {1: 'num_edges'},
                                'batch': {0: 'num_nodes'},
                                'output': {0: 'batch_size'}})  # which axes should be considered dynamic)

