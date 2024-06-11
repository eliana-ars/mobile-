import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, TextInput, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';


class TreeNode {
  constructor(attribute, isLeaf = false, value = null) {
    this.attribute = attribute;
    this.children = {};
    this.isLeaf = isLeaf;
    this.value = value;
  }
}

function buildDecisionTree(trainX, trainY, attributes) {
  if (trainX.length === 0 || trainY.length === 0) {
    throw new Error('Não há dados de treinamento válidos.');
  }

  const root = buildTree(trainX, trainY, attributes.slice());

  return root;
}

function buildTree(data, labels, attributes) {
  if (labels.every(label => label === labels[0])) {
    return new TreeNode(null, true, labels[0]);
  }

  if (attributes.length === 0 || data.length === 0) {
    return new TreeNode(null, true, mostCommonLabel(labels));
  }

  const bestAttribute = findBestAttribute(data, labels, attributes);

  const tree = new TreeNode(bestAttribute);

  const attributeIndex = attributes.indexOf(bestAttribute);
  attributes.splice(attributeIndex, 1);

  const attributeValues = [...new Set(data.map(instance => instance[attributeIndex]))];

  attributeValues.forEach(value => {
    const filteredData = [];
    const filteredLabels = [];
    data.forEach((instance, index) => {
      if (instance[attributeIndex] === value) {
        filteredData.push(instance.filter((_, i) => i !== attributeIndex));
        filteredLabels.push(labels[index]);
      }
    });
    tree.children[value] = buildTree(filteredData, filteredLabels, attributes.slice());
  });

  return tree;
}

function mostCommonLabel(labels) {
  const labelCounts = labels.reduce((counts, label) => {
    counts[label] = (counts[label] || 0) + 1;
    return counts;
  }, {});

  let mostCommon = null;
  let maxCount = -1;

  for (const label in labelCounts) {
    if (labelCounts[label] > maxCount) {
      mostCommon = label;
      maxCount = labelCounts[label];
    }
  }

  return mostCommon;
}

function findBestAttribute(data, labels, attributes) {
  let bestAttribute = null;
  let bestGain = -1;

  attributes.forEach(attribute => {
    const gain = calculateInformationGain(data, labels, attributes, attribute); // Corrigido aqui
    if (gain > bestGain) {
      bestAttribute = attribute;
      bestGain = gain;
    }
  });

  return bestAttribute;
}

function calculateInformationGain(data, labels, attributes, attribute) {
  const attributeIndex = attributes.indexOf(attribute);
  const attributeValues = [...new Set(data.map(instance => instance[attributeIndex]))];

  let entropy = calculateEntropy(labels);

  attributeValues.forEach(value => {
    const filteredLabels = [];
    labels.forEach((label, index) => {
      if (data[index][attributeIndex] === value) {
        filteredLabels.push(label);
      }
    });
    const ratio = filteredLabels.length / labels.length;
    entropy -= ratio * calculateEntropy(filteredLabels);
  });

  return entropy;
}

function calculateEntropy(labels) {
  const labelCounts = labels.reduce((counts, label) => {
    counts[label] = (counts[label] || 0) + 1;
    return counts;
  }, {});

  const totalCount = labels.length;

  let entropy = 0;
  for (const label in labelCounts) {
    const probability = labelCounts[label] / totalCount;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
}

function HomeScreen() {
  const navigation = useNavigation();

  const [selectedAlgorithm, setSelectedAlgorithm] = useState('knn');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [numGenerations, setNumGenerations] = useState(10);

  const handleFileSelection = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        setSelectedFile(fileUri);

        const content = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
        setFileContent(content);

        Alert.alert('Arquivo selecionado com sucesso', `URI: ${fileUri}`);
      } else {
        setSelectedFile(null);
        setFileContent(null);
      }
    } catch (err) {
      Alert.alert("Erro", "Não foi possível selecionar o arquivo.");
      console.error('Error selecting file:', err);
    }
  };

  const handleExecute = async () => {
    if (!selectedFile) {
      Alert.alert("Erro", "Por favor, selecione um arquivo primeiro.");
      return;
    }
  
    try {
      if (!fileContent) {
        Alert.alert("Erro", "O conteúdo do arquivo não foi carregado corretamente.");
        return;
      }
  
      let result;
      if (selectedAlgorithm === 'knn') {
        result = await processFileAndRunKNN(fileContent);
      } else if (selectedAlgorithm === 'genetic') {
        result = runGeneticAlgorithm(parseInt(numGenerations)); // Convertendo para número inteiro aqui
      } else if (selectedAlgorithm === 'decisionTree') {
        result = await processFileAndRunDecisionTree(fileContent);
      }
  
      navigation.navigate('ResultScreen', { result });
  
    } catch (err) {
      Alert.alert("Erro", "Ocorreu um erro ao processar o arquivo.");
      console.error('Error processing file:', err);
    }
  };  


  const euclideanDistance = (point1, point2) => {
    return Math.sqrt(point1.reduce((sum, value, index) => sum + Math.pow(value - point2[index], 2), 0));
  };

  const knn = (trainX, trainY, testX, k) => {
    const predictions = testX.map(testPoint => {
      const distances = trainX.map((trainPoint, index) => ({
        label: trainY[index],
        distance: euclideanDistance(trainPoint, testPoint)
      }));

      distances.sort((a, b) => a.distance - b.distance);
      const kNearestNeighbors = distances.slice(0, k);

      const classCounts = kNearestNeighbors.reduce((counts, neighbor) => {
        counts[neighbor.label] = (counts[neighbor.label] || 0) + 1;
        return counts;
      }, {});

      return Object.keys(classCounts).reduce((a, b) => classCounts[a] > classCounts[b] ? a : b);
    });

    return predictions;
  };

  const calculateAccuracy = (predictions, trueLabels) => {
    const correctPredictions = predictions.filter((prediction, index) => prediction === trueLabels[index]);
    return (correctPredictions.length / trueLabels.length) * 100;
  };

  const processFileAndRunKNN = async (fileContent) => {
    try {
      if (!fileContent || fileContent.trim() === '') {
        throw new Error('O conteúdo do arquivo está vazio ou não está no formato esperado.');
      }

      const lines = fileContent.split('\n');
      const data = lines.map(line => line.split(','));

      const x = [];
      const y = [];

      for (let i = 0; i < data.length; i++) {
        const instance = data[i];
        if (instance && instance.length > 1) {
          const cleanInstance = instance.map(value => value.trim());
          if (cleanInstance.every(field => field !== '')) {
            x.push(cleanInstance.slice(0, -1).map(value => parseFloat(value)));
            y.push(cleanInstance.slice(-1)[0]);
          }
        }
      }

      if (x.length === 0 || y.length === 0) {
        throw new Error('Não há dados válidos no arquivo.');
      }

      const splitIndex = Math.floor(x.length * 0.7);
      const trainX = x.slice(0, splitIndex);
      const trainY = y.slice(0, splitIndex);
      const testX = x.slice(splitIndex);
      const testY = y.slice(splitIndex);

      const k = 7;
      const predictions = knn(trainX, trainY, testX, k);
      const accuracy = calculateAccuracy(predictions, testY);

      const decisionTree = buildDecisionTree(trainX, trainY, Array.from({ length: trainX[0].length }, (_, i) => i));
      
      return {
        instances: x.length,
        classes: [...new Set(y)].length,
        attributes: x[0].map((_, index) => `Attribute_${index + 1}`), // Corrigido aqui
        algorithm: 'KNN',
        accuracy: accuracy,
        decisionTree: decisionTree,
      };
    } catch (error) {
      throw new Error('Erro ao processar o arquivo e executar o algoritmo KNN: ' + error.message);
    }
  };

  const processFileAndRunDecisionTree = async (fileContent) => {
    try {
      if (!fileContent || fileContent.trim() === '') {
        throw new Error('O conteúdo do arquivo está vazio ou não está no formato esperado.');
      }

      const lines = fileContent.split('\n');
      const data = lines.map(line => line.split(','));

      const x = [];
      const y = [];

      for (let i = 0; i < data.length; i++) {
        const instance = data[i];
        if (instance && instance.length > 1) {
          const cleanInstance = instance.map(value => value.trim());
          if (cleanInstance.every(field => field !== '')) {
            x.push(cleanInstance.slice(0, -1).map(value => parseFloat(value)));
            y.push(cleanInstance.slice(-1)[0]);
          }
        }
      }

      if (x.length === 0 || y.length === 0) {
        throw new Error('Não há dados válidos no arquivo.');
      }

      const splitIndex = Math.floor(x.length * 0.7);
      const trainX = x.slice(0, splitIndex);
      const trainY = y.slice(0, splitIndex);
      const testX = x.slice(splitIndex);
      const testY = y.slice(splitIndex);

      const decisionTree = buildDecisionTree(trainX, trainY, Array.from({ length: trainX[0].length }, (_, i) => i));
      
      return {
        instances: x.length,
        classes: [...new Set(y)].length,
        attributes: x[0].map((_, index) => `Attribute_${index + 1}`), // Corrigido aqui
        algorithm: 'Árvore de Decisão',
        decisionTree: decisionTree,
      };
    } catch (error) {
      throw new Error('Erro ao processar o arquivo e executar o algoritmo Árvore de Decisão: ' + error.message);
    }
  };

  const runGeneticAlgorithm = (numGenerations) => {
    const algorithmInstance = new GeneticAlgorithm(numGenerations);
    algorithmInstance.initExecution();
    const bestIndividual = algorithmInstance.getBestIndividual();
    return {
      ...bestIndividual,
      algorithm: 'GeneticAlgorithm',
    };
  };

  class GeneticAlgorithm {
    constructor(numGenerations) {
      this.populationSize = 20;
      this.population = [];
      this.numGenerations = numGenerations;
      this.numOffspring = 14;
      this.offspring = [];
      this.mutationRate = 1;
    }

    evaluateIndividual(x, y, z) {
      return (x * x) - (3 * y) + (4 * z);
    }

    createPopulation() {
      for (let i = 0; i < this.populationSize; i++) {
        const x = Math.floor(Math.random() * 21) - 10;
        const y = Math.floor(Math.random() * 13);
        const z = Math.floor(Math.random() * 41) - 20;
        const fitness = this.evaluateIndividual(x, y, z);
        const individual = [x, y, z, fitness];
        this.population.push(individual);
      }
    }

    selectParent() {
      const candidate1 = Math.floor(Math.random() * this.populationSize);
      const candidate2 = Math.floor(Math.random() * this.populationSize);
      return this.population[candidate1][3] > this.population[candidate2][3] ? candidate1 : candidate2;
    }

    mutate(individual) {
      const mutationChance = Math.floor(Math.random() * 101);
      if (mutationChance <= this.mutationRate) {
        individual[0] = Math.floor(Math.random() * 21) - 10;
      }
      if (mutationChance <= this.mutationRate) {
        individual[1] = Math.floor(Math.random() * 13);
      }
      if (mutationChance <= this.mutationRate) {
        individual[2] = Math.floor(Math.random() * 41) - 20;
      }
      individual[3] = this.evaluateIndividual(individual[0], individual[1], individual[2]);
      return individual;
    }

    reproduce() {
      for (let i = 0; i < this.numOffspring / 2; i++) {
        const parent1Index = this.selectParent();
        const parent2Index = this.selectParent();

        const parent1 = this.population[parent1Index];
        const parent2 = this.population[parent2Index];

        const child1 = [parent1[0], parent2[1], parent1[2], 0];
        const child2 = [parent2[0], parent1[1], parent2[2], 0];

        this.mutate(child1);
        this.mutate(child2);

        this.offspring.push(child1);
        this.offspring.push(child2);
      }
    }

    discardPopulation() {
      this.population = this.population.concat(this.offspring);
      this.population.sort((a, b) => b[3] - a[3]);
      this.population = this.population.slice(0, this.populationSize);
      this.offspring = [];
    }

    getBestIndividual() {
      const bestIndividual = this.population.reduce((best, current) => (current[3] > best[3] ? current : best));
      return {
        x: bestIndividual[0],
        y: bestIndividual[1],
        z: bestIndividual[2],
        fitness: bestIndividual[3],
      };
    }

    initExecution() {
      this.createPopulation();
      for (let generation = 0; generation < this.numGenerations; generation++) {
        this.reproduce();
        this.discardPopulation();
      }
    }
  }
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.tela}>
      <View style={styles.container}>
        <Text style={styles.title}>Escolha o algoritmo:</Text>
        <DropDownPicker
          open={open}
          value={selectedAlgorithm}
          items={[
            { label: 'KNN', value: 'knn' },
            { label: 'Algoritmo Genético', value: 'genetic' },
            { label: 'Árvore de Decisão', value: 'decisionTree' },
          ]}
          setOpen={setOpen}
          setValue={setSelectedAlgorithm}
          style={styles.picker}
          dropDownContainerStyle={styles.dropDownContainer}
          placeholder="Selecione um algoritmo"
        />

        {selectedAlgorithm === 'genetic' && (
          <View>
            <Text style={styles.title}>Digite o número de gerações:</Text>
            <TextInput
              style={styles.input}
              placeholder="Número de gerações"
              keyboardType="numeric"
              value={isNaN(numGenerations) ? '' : numGenerations.toString()} // Verifica se é NaN e limpa o valor
              onChangeText={text => setNumGenerations(parseInt(text))}
            />
          </View>
        )}
        
        <Text style={styles.title}>Escolha a base de dados:</Text>
        <TouchableOpacity style={styles.fileButton} onPress={handleFileSelection}>
          <Text style={styles.ButtonText}>Escolher Arquivo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.executarButton} onPress={handleExecute}>
          <Text style={styles.ButtonText}>Executar</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    marginTop: 20,
  },
  container: {
    width: "100%",
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
  },
  picker: {
    height: 60,
    width: '100%',
    marginBottom: 20,
    borderColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 30,
    elevation: 5,
  },
  dropDownContainer: {
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 10,
    elevation: 5,
  },
  fileButton: {
    backgroundColor: "#E49D31",
    width: "100%",
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#6666",
    elevation: 5,
  },
  executarButton: {
    backgroundColor: "#3ABB57",
    width: "100%",
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#6666",
    elevation: 5,
  },
  ButtonText: {
    color: "#FFF",
    fontSize: 18,
  },
  fileName: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default HomeScreen;