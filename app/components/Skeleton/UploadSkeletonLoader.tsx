// components/PDFSkeletonLoader.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const UploadSkeletonLoader = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <>
      {/* Search Bar Skeleton */}
      <View style={styles.searchCard}>
        <Animated.View style={[styles.searchIcon, { opacity }]} />
        <Animated.View style={[styles.searchInput, { opacity }]} />
      </View>

      {/* Filter Section Skeleton */}
      <View style={styles.filterCard}>
        <Animated.View style={[styles.filterTitle, { opacity }]} />
        <View style={styles.filterChipsRow}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Animated.View 
              key={item} 
              style={[styles.filterChip, { opacity }]} 
            />
          ))}
        </View>
      </View>

      {/* PDF List Section */}
      <View style={styles.listCard}>
        {/* List Title */}
        <Animated.View style={[styles.listTitle, { opacity }]} />

        {/* PDF Cards */}
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <View key={item} style={styles.pdfCard}>
            {/* PDF Icon */}
            <Animated.View style={[styles.pdfIcon, { opacity }]} />
            
            {/* PDF Info */}
            <View style={styles.pdfInfo}>
              <Animated.View style={[styles.pdfName, { opacity }]} />
              <Animated.View style={[styles.pdfMeta, { opacity }]} />
            </View>

            {/* Chevron */}
            <Animated.View style={[styles.chevron, { opacity }]} />
          </View>
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  // Search Bar
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },

  // Filter Section
  filterCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  filterTitle: {
    width: 120,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginBottom: 12,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    width: 80,
    height: 32,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },

  // List Section
  listCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  listTitle: {
    width: 180,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginBottom: 12,
  },

  // PDF Card
  pdfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pdfIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    marginRight: 12,
  },
  pdfInfo: {
    flex: 1,
  },
  pdfName: {
    width: '85%',
    height: 15,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginBottom: 8,
  },
  pdfMeta: {
    width: '50%',
    height: 12,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  chevron: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginLeft: 12,
  },
});

export default UploadSkeletonLoader;
