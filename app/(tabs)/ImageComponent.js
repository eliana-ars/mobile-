import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const ImageComponent = () => {
  return (
    <View style={styles.container}>
      <Image
        style={styles.image}
        source={require('../../assets/images/favicon.png')} // Verifique se o caminho está correto
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
  },
});

export default ImageComponent;
