import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const DecisionTree = ({ decisionTree, accuracy }) => (
  <View style={styles.decisionTreeContainer}>
    <Text style={styles.resultItem}>Árvore de Decisão:</Text>
    <ScrollView
      style={styles.decisionTree}
      contentContainerStyle={styles.decisionTreeContent}
    >
      <DecisionTreeNode node={decisionTree} />
    </ScrollView>
    {accuracy !== undefined && (
      <Text style={styles.resultItem}>Acurácia: {accuracy.toFixed(2)}%</Text>
    )}
  </View>
);

const DecisionTreeNode = ({ node, depth = 0, index = '0' }) => {
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
              <DecisionTreeNode node={node.children[child]} depth={depth + 1} index={`${index}-${i}`} />
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
  decisionTreeContainer: {
    marginTop: 10,
  },
  decisionTree: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
  },
  decisionTreeContent: {
    flexGrow: 1,
  },
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

export default DecisionTree;
