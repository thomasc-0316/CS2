// components/FilterPanel.js
//
// Extracted from HomeScreen, where the same ~140-line filter panel JSX was
// duplicated verbatim twice (H9 in FULL_QA_AUDIT.md). Memoized so unrelated
// HomeScreen state changes do not force the panel to re-render.
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MAPS } from '../data/maps';

function FilterPanelInner({
  visible,
  slideAnim,
  tempFilters,
  setTempFilters,
  availableMaps,
  availableTypes,
  availableSides,
  onClose,
  onApply,
  onReset,
}) {
  const mapNameLookup = useMemo(() => {
    const lookup = {};
    MAPS.forEach((m) => {
      lookup[m.id] = m.name;
    });
    return lookup;
  }, []);

  if (!visible) return null;

  return (
    <View style={styles.filterPortal} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      />
      <Animated.View
        style={[
          styles.filterPanel,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.filterHeaderRow}>
          <Text style={styles.filterPanelTitle}>Filters</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Map</Text>
          <View style={styles.chipRow}>
            {availableMaps.map((id) => (
              <TouchableOpacity
                key={id}
                style={[styles.chip, tempFilters.map === id && styles.chipActive]}
                onPress={() => setTempFilters((prev) => ({ ...prev, map: id }))}
              >
                <Text
                  style={[
                    styles.chipText,
                    tempFilters.map === id && styles.chipTextActive,
                  ]}
                >
                  {id === 'all' ? 'All' : mapNameLookup[id] || id}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Type</Text>
          <View style={styles.chipRow}>
            {availableTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.chip, tempFilters.type === type && styles.chipActive]}
                onPress={() => setTempFilters((prev) => ({ ...prev, type }))}
              >
                <Text
                  style={[
                    styles.chipText,
                    tempFilters.type === type && styles.chipTextActive,
                  ]}
                >
                  {type === 'all' ? 'All' : type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Side</Text>
          <View style={styles.chipRow}>
            {availableSides.map((side) => (
              <TouchableOpacity
                key={side}
                style={[styles.chip, tempFilters.side === side && styles.chipActive]}
                onPress={() => setTempFilters((prev) => ({ ...prev, side }))}
              >
                <Text
                  style={[
                    styles.chipText,
                    tempFilters.side === side && styles.chipTextActive,
                  ]}
                >
                  {side === 'all' ? 'All' : side.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterActions}>
          <TouchableOpacity style={styles.clearButton} onPress={onReset}>
            <Text style={styles.clearButtonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={onApply}>
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const FilterPanel = React.memo(FilterPanelInner);
export default FilterPanel;

const styles = StyleSheet.create({
  filterPortal: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  filterPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 24,
  },
  filterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterPanelTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  filterRow: {
    marginBottom: 10,
  },
  filterLabel: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  chipActive: {
    borderColor: '#FF6800',
    backgroundColor: '#2a1a10',
  },
  chipText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  clearButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
    backgroundColor: '#222',
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  applyButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#FF6800',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
