import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GeneticTree = ({ x, y, z, bestIndividual, accuracy }) => (
  <View style={styles.geneticTreeContainer}>
    <Text style={styles.resultItem}>Algoritmo Genético:</Text>
    <Text style={styles.resultItem}>x: {x}</Text>
    <Text style={styles.resultItem}>y: {y}</Text>
    <Text style={styles.resultItem}>z: {z}</Text>
    <Text style={styles.resultItem}>Melhor Indivíduo: {bestIndividual}</Text>
    {accuracy !== undefined && accuracy !== null ? (
      <Text style={styles.resultItem}>Acurácia: {accuracy.toFixed(2)}%</Text>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  geneticTreeContainer: {
    marginTop: 10,
  },
  resultItem: {
    fontSize: 16,
    marginBottom: 5,
  },
});

export default GeneticTree;
