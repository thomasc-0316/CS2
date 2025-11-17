import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { MAPS } from '../data/maps';

export default function MapSelectionScreen({ navigation }) {
  const renderMapCard = ({ item }) => {
    return (
      <TouchableOpacity
        style={[
          styles.mapCard,
          { backgroundColor: item.isLocked ? '#cccccc' : item.color }
        ]}
        onPress={() => {
            if (!item.isLocked) {
              navigation.navigate('LineupGrid', { map: item });
            }
          }}
        disabled={item.isLocked}
      >
        <Text style={styles.mapName}>{item.name}</Text>
        {item.isLocked && (
          <View style={styles.lockContainer}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={MAPS}
        renderItem={renderMapCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.grid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  grid: {
    padding: 10,
  },
  mapCard: {
    flex: 1,
    margin: 10,
    height: 150,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  mapName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  lockContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  lockIcon: {
    fontSize: 30,
  },
});