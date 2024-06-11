import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TreeNode = ({ node, depth = 0, index = '0' }) => {
  if (!node) return null;

  const key = `${depth}-${index}`;

  const renderChildren = () => {
    if (node.isLeaf) {
      return <Text style={styles.treeLeaf}>Valor: {node.value}</Text>;
    } else {
      return (
        <View style={styles.treeNode}>
          {Object.keys(node.children).map((child, i) => (
            <View key={`${key}-${i}`} style={styles.treeChild}>
              <Text style={styles.treeAttribute}>Atributo: {child}</Text>
              <TreeNode node={node.children[child]} depth={depth + 1} index={`${index}-${i}`} />
            </View>
          ))}
        </View>
      );
    }
  };

  return (
    <View style={styles.treeNode}>
      <Text style={styles.treeAttribute}>Atributo: {node.attribute}</Text>
      {node.threshold !== undefined && (
        <Text style={styles.treeThreshold}>Limiar: {node.threshold}</Text>
      )}
      {renderChildren()}
    </View>
  );
};

const styles = StyleSheet.create({
  treeNode: {
    marginVertical: 5,
  },
  treeChild: {
    marginLeft: 20,
  },
  treeAttribute: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  treeThreshold: {
    marginLeft: 10,
    fontStyle: 'italic',
  },
  treeLeaf: {
    marginLeft: 20,
    fontStyle: 'italic',
  },
});

export default TreeNode;
