import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ImageBackground } from 'react-native';
import { MAPS } from '../data/maps';

export default function TacticsMapSelectScreen({ navigation }) {
  const [filter, setFilter] = useState('all'); // all | active | reserve

  const filteredMaps = useMemo(() => {
    if (filter === 'active') {
      return MAPS.filter((map) => map.isActiveDuty);
    }
    if (filter === 'reserve') {
      return MAPS.filter((map) => !map.isActiveDuty);
    }
    return MAPS;
  }, [filter]);

  const renderMapCard = ({ item }) => (
    <TouchableOpacity
      style={styles.mapCard}
      onPress={() => !item.isLocked && navigation.navigate('TacticsMain', { map: item })}
      disabled={item.isLocked}
      activeOpacity={0.9}
    >
      <ImageBackground
        source={item.background}
        style={styles.mapBackground}
        imageStyle={styles.mapBackgroundImage}
      >
        <View style={styles.darkOverlay} />
        {item.isLocked && <View style={styles.lockedOverlay} />}

        <View style={styles.iconContainer}>
          <ImageBackground source={item.icon} style={styles.mapIcon} resizeMode="contain" />
        </View>

        {item.isLocked ? (
          <View style={styles.lockContainer}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        ) : null}
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, filter === 'all' && styles.toggleButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.toggleText, filter === 'all' && styles.toggleTextActive]}>All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleButton, filter === 'active' && styles.toggleButtonActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.toggleText, filter === 'active' && styles.toggleTextActive]}>
            Active Duty
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleButton, filter === 'reserve' && styles.toggleButtonActive]}
          onPress={() => setFilter('reserve')}
        >
          <Text style={[styles.toggleText, filter === 'reserve' && styles.toggleTextActive]}>
            Reserve
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredMaps}
        renderItem={renderMapCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={4}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0e14',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#0c0e14',
    gap: 12,
  },
  toggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333',
  },
  toggleButtonActive: {
    backgroundColor: '#FF6800',
    borderColor: '#FF6800',
  },
  toggleText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  grid: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mapCard: {
    width: '23%',
    aspectRatio: 5 / 6,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1f2430',
    backgroundColor: '#0d1017',
  },
  mapBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapBackgroundImage: {
    borderRadius: 15,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  iconContainer: {
    zIndex: 10,
  },
  mapIcon: {
    width: 60,
    height: 60,
  },
  lockContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  lockIcon: {
    fontSize: 30,
  },
});
