import React from 'react';
import { View, StyleSheet } from 'react-native';

const PLACEHOLDER_COUNT = 6;

export default function LineupGridSkeleton() {
  return (
    <View style={styles.grid}>
      {Array.from({ length: PLACEHOLDER_COUNT }).map((_, index) => (
        <View key={`skeleton-${index}`} style={styles.card}>
          <View style={styles.imageBlock} />
          <View style={styles.body}>
            <View style={[styles.textBlock, { width: '72%' }]} />
            <View style={[styles.textBlock, { width: '48%' }]} />
            <View style={styles.tagRow}>
              <View style={[styles.tag, { width: 44 }]} />
              <View style={[styles.tag, { width: 38 }]} />
              <View style={[styles.tag, { width: 52 }]} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  card: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#242424',
  },
  imageBlock: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#343434',
  },
  body: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
  },
  textBlock: {
    height: 10,
    borderRadius: 4,
    backgroundColor: '#393939',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    height: 16,
    borderRadius: 6,
    backgroundColor: '#3d3d3d',
  },
});
