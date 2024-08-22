#%%
from torch_geometric.datasets import Twitch
import os.path as osp

import torch
from sklearn.metrics import roc_auc_score

import torch_geometric.transforms as T
from torch_geometric.datasets import Planetoid
# from graphSAGE import ConvSAGE
from graphSAGE.CustomizedLayer import ConvSAGE
from torch_geometric.utils import negative_sampling

#%%

if torch.cuda.is_available():
    device = torch.device('cuda')
elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
    device = torch.device('mps')
else:
    device = torch.device('cpu')


#%%
dataset = Twitch(root='data/Twitch', name='EN')
print(dataset[0])
#
print()
print(f'Dataset: {dataset}:')
print('====================')
print(f'Number of graphs: {len(dataset)}')
print(f'Number of features: {dataset.num_features}')
print(f'Number of classes: {dataset.num_classes}')

#%%

from torch_geometric.utils import train_test_split_edges


data = train_test_split_edges(dataset[0])

print('Train edges:', data.train_pos_edge_index.size(1))
print('Validation edges (positive):', data.val_pos_edge_index.size(1))
print('Validation edges (negative):', data.val_neg_edge_index.size(1))
print('Test edges (positive):', data.test_pos_edge_index.size(1))
print('Test edges (negative):', data.test_neg_edge_index.size(1))

print(data)

#%%

from torch_geometric.data import Data
from torch_geometric.loader import NeighborLoader

gData = Data(x=data.x, edge_index=data.train_pos_edge_index)

train_loader = NeighborLoader(
    gData,
    num_neighbors=[15, 10],
    batch_size=32,
    input_nodes=None,
    shuffle=True
)

val_loader = NeighborLoader(
    Data(x=data.x, edge_index=data.val_pos_edge_index),
    num_neighbors=[15, 10],
    batch_size=32,
    input_nodes=None,
    shuffle=False
)

test_loader = NeighborLoader(
    Data(x=data.x, edge_index=data.test_pos_edge_index),
    num_neighbors=[15, 10],
    batch_size=32,
    input_nodes=None,
    shuffle=False
)

print(train_loader)

#%%

class SAGE(torch.nn.Module):
    def __init__(self, in_channels, hidden_channels, out_channels):
        super().__init__()
        self.conv1 = ConvSAGE(in_channels, hidden_channels)
        self.conv2 = ConvSAGE(hidden_channels, out_channels)

    def encode(self, x, edge_index):
        x = self.conv1(x, edge_index).relu()
        x = self.conv2(x, edge_index)
        return x

    def decode(self, z, edge_label_index):
        # edge_label_index = edge_label_index.to(torch.int)
        x = (z[edge_label_index[0]] * z[edge_label_index[1]])
        x = x.sum(dim=-1)
        return x

    def decode_all(self, z):
        prob_adj = z @ z.t()
        return (prob_adj > 0).nonzero(as_tuple=False).t()

    def forward(self, x, edge_index, edge_label_index):
        outputs = {}
        x = self.conv1(x, edge_index).relu()
        outputs["sage1"] = x
        z = self.conv2(x, edge_index)
        outputs["sage2"] = z

        x = (z[edge_label_index[0]] * z[edge_label_index[1]])
        outputs["decode_mul"] = x
        x = x.sum(dim=-1)
        outputs["decode_sum"] = x

        prob_adj = z @ z.t()
        outputs["prob_adj"] = prob_adj
        outputs["decode_all_final"] = (prob_adj > 0).nonzero(as_tuple=False).t()
        return outputs
        


model = SAGE(dataset.num_features, 64, 64).to(device)
optimizer = torch.optim.Adam(params=model.parameters(), lr=0.05)
criterion = torch.nn.BCEWithLogitsLoss()
print(device)

#%%
def train():
    model.train()
    total_loss = 0
    for batch in train_loader:
        optimizer.zero_grad()
        z = model.encode(batch.x.to(device), batch.edge_index.to(device))

        pos_edge_index = batch.edge_index.to(device)
        pos_out = model.decode(z, pos_edge_index)
        pos_loss = criterion(pos_out, torch.ones(pos_out.size(0), device=device))

        neg_edge_index = negative_sampling(
            edge_index=batch.edge_index,
            num_nodes=batch.num_nodes,
            num_neg_samples=pos_edge_index.size(1)
        ).to(device)
        neg_out = model.decode(z, neg_edge_index)
        neg_loss = criterion(neg_out, torch.zeros(neg_out.size(0), device=device))

        loss = pos_loss + neg_loss
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
    
    return total_loss / len(train_loader)


#%%

def test(loader):
    model.eval()
    total_loss = 0
    correct = 0
    count = 0
    
    for batch in loader:
        with torch.no_grad():
            z = model.encode(batch.x.to(device), batch.edge_index.to(device))
        
        # 正样本边的预测
        pos_edge_index = batch.edge_index.to(device)
        pos_out = model.decode(z, pos_edge_index)
        pos_y = torch.ones(pos_out.size(0), device=device)

        # 负样本边的预测
        neg_edge_index = negative_sampling(
            edge_index=batch.edge_index,
            num_nodes=batch.num_nodes,
            num_neg_samples=pos_edge_index.size(1)
        ).to(device)
        neg_edge_index = neg_edge_index.to(torch.int)

        neg_out = model.decode(z, neg_edge_index)
        neg_y = torch.zeros(neg_out.size(0), device=device)

        # 合并正负样本
        y = torch.cat([pos_y, neg_y])
        pred = torch.cat([pos_out, neg_out])

        # 计算损失
        loss = criterion(pred, y).item()
        total_loss += loss

        # 计算准确率
        pred = torch.sigmoid(pred)
        pred = pred > 0.5
        correct += pred.eq(y).sum().item()
        count += y.size(0)
    
    # 返回平均损失和准确率
    avg_loss = total_loss / len(loader)
    accuracy = correct / count
    return avg_loss, accuracy


#%%

for epoch in range(1, 50):
    loss = train()
    val_loss, val_acc = test(val_loader)
    test_loss, test_acc = test(test_loader)
    print(f'Epoch: {epoch:03d}, Loss: {loss:.4f}, Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.4f}, Test Loss: {test_loss:.4f}, Test Acc: {test_acc:.4f}')

#%%

gData = dataset[0]
print(gData)


#%%
def get_neighbor_count(data, node_index):
    if node_index < 0 or node_index >= data.num_nodes:
        raise ValueError("exceed the dataset")
    
    edge_index = data.edge_index
    
    # First-level neighbors
    neighbors = edge_index[1][edge_index[0] == node_index]
    neighbor_of_neighbor_count = 0
    third_neighbors_set = set()
    
    # Iterate through first-level neighbors
    for neighbor in neighbors:
        # Second-level neighbors
        second_neighbors = edge_index[1][edge_index[0] == neighbor]
        neighbor_of_neighbor_count += second_neighbors.size(0)
        
        # Iterate through second-level neighbors
        for second_neighbor in second_neighbors:
            # Third-level neighbors
            third_neighbors = edge_index[1][edge_index[0] == second_neighbor]
            third_neighbors_set.update(third_neighbors.tolist())
    
    # Remove first-level and second-level neighbors from third-level neighbors set
    all_first_and_second_neighbors = set(neighbors.tolist())
    for neighbor in neighbors:
        second_neighbors = edge_index[1][edge_index[0] == neighbor]
        all_first_and_second_neighbors.update(second_neighbors.tolist())
    
    third_neighbors_set.difference_update(all_first_and_second_neighbors)
    
    third_neighbors_list = list(third_neighbors_set)
    third_neighbors_count = len(third_neighbors_list)
    
    return neighbors.size(0), neighbor_of_neighbor_count, third_neighbors_count

#%%

# print out the size of the size graph
# node i - node j - subgraph size for node i - subgraph size for node j
# (the neighbors of the target node, the neibhors of the neighbors node)
# New algorithm to store sums and corresponding indices
results = []
max_sum = 0
max_node = 0

for i in range(1000):  # Assuming there are 5 nodes for the example
    a, b, c = get_neighbor_count(gData, i)
    sum_neighbors = a + b + c
    results.append((i, sum_neighbors, (a, b, c)))
    if max_sum < sum_neighbors:
        max_sum = sum_neighbors
        max_node = i
    print(i, (a, b, c), sum_neighbors)

# Sort the results based on the sum
results.sort(key=lambda x: x[1], reverse=True)

print("Sorted results based on sum:")
for result in results:
    print(f"Node {result[0]}: Sum {result[1]}")

print("Max node:", max_node, "Max sum:", max_sum)

#%%

print("Sorted results based on sum:")
for result in results:
    print(f"Node {result[0]}: Sum {result[1]} : Values {result[2]}")

#%%

def predict_edge(model, node_index1, node_index2):
    model.eval()
    with torch.no_grad():
        edge_label_index = torch.tensor([[node_index1], [node_index2]], device=device)
        prediction = model.forward(data.x.to(device), data.train_pos_edge_index.to(device), edge_label_index)
        return prediction

node_index1 = 45
node_index2 = 17

# for i in range(20):
#     for j in range(20):
#         if i != j:
#             prediction = predict_edge(model, i, j)
#             print(f"predict node {i} and node {j} probability that has an edge: {prediction}")

#%%
prediction = predict_edge(model, 12, 70)
print(prediction['decode_all_final'])

#%%

print(f'conv1 shape: {list(prediction['sage1'].shape)}')
print(f'conv2 shape: {list(prediction['sage2'].shape)}')
print(f'conv3 shape: {list(prediction['decode_mul'].shape)}')
print(f'final shape: {list(prediction['prob_adj'].shape)}')
print(f'final shape: {list(prediction['decode_all_final'].shape)}')

#%%

# dummy input
x = torch.randn(7126, 128)
edge_index = torch.randint(0, 7126, (2, 77774))
dummy_input = (x, edge_index, edge_index)
prediction = model.forward(x, edge_index, edge_index)

#%%

print(prediction)

#%%
# python model to ONNX model
torch.onnx.export(model,               # model being run
                  dummy_input,         # model input 
                  "sage_link_model.onnx",    # where to save the model
                  export_params=True,  # store the trained parameter weights inside the model file
                  opset_version=17,    # the ONNX version to export the model to
                #   do_constant_folding=True,  # whether to execute constant folding for optimization
                  input_names = ['x', 'edge_index', 'edge_label_index'],   # the model's input names
                  output_names=['sage1', 'sage2', 'decode_mul', 'decode_sum', 'prob_adj', 'decode_all_final'],
                  dynamic_axes={'x': {0: 'num_nodes'},
                                'edge_index': {1: 'num_edges'},
                                'output': {0: 'batch_size'}})  # which axes should be considered dynamic)

#%%
# export weights of the model
import onnx
import numpy as np
import json

model = onnx.load('./sage_link_model.onnx')

weights = {}

for tensor in model.graph.initializer:
    np_array = onnx.numpy_helper.to_array(tensor)
    weights[tensor.name] = np_array.tolist()

with open('sage_link_weights.json', 'w') as f:
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

with open("sage_link_weights.json", "r") as file:
    data = json.load(file)

print(data)

keys = extract_keys(data)

# print all keys in json
print("All keys:", keys)

for k in keys:
    d = np.array(data[k])
    print(k,d.shape)

# All keys: {'conv1.weight', 'conv2.bias', 'conv2.weight', 'conv1.bias'}
# conv1.weight (256, 64)
# conv2.bias (64,)
# conv2.weight (128, 64)
# conv1.bias (64,)


# %%