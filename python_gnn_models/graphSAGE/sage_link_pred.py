from torch_geometric.datasets import Twitch
import os.path as osp

import torch
from sklearn.metrics import roc_auc_score

import torch_geometric.transforms as T
from torch_geometric.datasets import Planetoid
# from graphSAGE import ConvSAGE
from CustomizedLayer import ConvSAGE
from torch_geometric.utils import negative_sampling


if torch.cuda.is_available():
    device = torch.device('cuda')
elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
    device = torch.device('mps')
else:
    device = torch.device('cpu')



dataset = Twitch(root='data/Twitch', name='EN')
print(dataset[0])
#
print()
print(f'Dataset: {dataset}:')
print('====================')
print(f'Number of graphs: {len(dataset)}')
print(f'Number of features: {dataset.num_features}')
print(f'Number of classes: {dataset.num_classes}')


from torch_geometric.utils import train_test_split_edges


data = train_test_split_edges(dataset[0])

print('Train edges:', data.train_pos_edge_index.size(1))
print('Validation edges (positive):', data.val_pos_edge_index.size(1))
print('Validation edges (negative):', data.val_neg_edge_index.size(1))
print('Test edges (positive):', data.test_pos_edge_index.size(1))
print('Test edges (negative):', data.test_neg_edge_index.size(1))

print(data)


from torch_geometric.data import Data
from torch_geometric.loader import NeighborLoader

gData = Data(x=data.x, edge_index=data.train_pos_edge_index)

train_loader = NeighborLoader(
    gData,  # 训练数据
    num_neighbors=[15, 10], 
    batch_size=64, 
    input_nodes=data.train_pos_edge_index[0],  # 训练节点
    shuffle=True
)

val_loader = NeighborLoader(
    gData,  # 验证数据
    num_neighbors=[15, 10], 
    batch_size=64, 
    input_nodes=data.val_pos_edge_index[0],  # 验证节点
    shuffle=False
)

test_loader = NeighborLoader(
    gData,  # 测试数据
    num_neighbors=[15, 10], 
    batch_size=64, 
    input_nodes=data.test_pos_edge_index[0],  # 测试节点
    shuffle=False
)

print(train_loader)


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


print("start training")
for epoch in range(1, 50):
    loss = train()
    val_loss, val_acc = test(val_loader)
    test_loss, test_acc = test(test_loader)
    print(f'Epoch: {epoch:03d}, Loss: {loss:.4f}, Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.4f}, Test Loss: {test_loss:.4f}, Test Acc: {test_acc:.4f}')
