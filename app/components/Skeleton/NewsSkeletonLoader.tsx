import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const NewsSkeletonLoader = () => {
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
      {/* Greeting Card Skeleton */}
      <View style={styles.greetingCard}>
        <View style={styles.greetingLeft}>
          <Animated.View style={[styles.greetingTitle, { opacity }]} />
          <Animated.View style={[styles.greetingDate, { opacity }]} />
        </View>
        <Animated.View style={[styles.adminBadge, { opacity }]} />
      </View>

      {/* Add Button Skeleton (optional, uncomment if admin) */}
      {/* <Animated.View style={[styles.addButtonSkeleton, { opacity }]} /> */}

      {/* Category Section Skeleton */}
      <View style={styles.categoryCard}>
        <Animated.View style={[styles.categoryTitleSkeleton, { opacity }]} />
        <View style={styles.categoryChipsRow}>
          {[1, 2, 3, 4, 5].map((item) => (
            <Animated.View 
              key={item} 
              style={[styles.categoryChipSkeleton, { opacity }]} 
            />
          ))}
        </View>
      </View>

      {/* News Count Skeleton */}
      <View style={styles.newsCountRow}>
        <Animated.View style={[styles.newsCountIcon, { opacity }]} />
        <Animated.View style={[styles.newsCountText, { opacity }]} />
      </View>

      {/* News Cards Skeleton */}
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.newsCard}>
          {/* Image Skeleton */}
          <Animated.View style={[styles.imageSkeleton, { opacity }]} />
          
          {/* Content */}
          <View style={styles.cardContent}>
            {/* Category Badge */}
            <Animated.View style={[styles.categoryBadgeSkeleton, { opacity }]} />
            
            {/* Title */}
            <Animated.View style={[styles.titleSkeleton, { opacity }]} />
            <Animated.View style={[styles.titleSkeleton2, { opacity }]} />
            
            {/* Description */}
            <Animated.View style={[styles.descSkeleton, { opacity }]} />
            <Animated.View style={[styles.descSkeleton2, { opacity }]} />
            
            {/* Footer with date and buttons */}
            <View style={styles.cardFooter}>
              <Animated.View style={[styles.dateSkeleton, { opacity }]} />
              <View style={styles.actionButtons}>
                <Animated.View style={[styles.buttonSkeleton, { opacity }]} />
                <Animated.View style={[styles.buttonSkeleton, { opacity }]} />
              </View>
            </View>
          </View>
        </View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  // Greeting Card
  greetingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  greetingLeft: {
    flex: 1,
  },
  greetingTitle: {
    width: '60%',
    height: 20,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginBottom: 8,
  },
  greetingDate: {
    width: '80%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  adminBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
  },

  // Add Button
  addButtonSkeleton: {
    height: 50,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    marginBottom: 16,
  },

  // Category Section
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  categoryTitleSkeleton: {
    width: 120,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginBottom: 12,
  },
  categoryChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChipSkeleton: {
    width: 70,
    height: 32,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },

  // News Count
  newsCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  newsCountIcon: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  newsCountText: {
    width: 80,
    height: 14,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },

  // News Card
  newsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageSkeleton: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
  },
  cardContent: {
    padding: 16,
  },
  categoryBadgeSkeleton: {
    width: 60,
    height: 22,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    marginBottom: 12,
  },
  titleSkeleton: {
    width: '95%',
    height: 18,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginBottom: 8,
  },
  titleSkeleton2: {
    width: '70%',
    height: 18,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginBottom: 12,
  },
  descSkeleton: {
    width: '100%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginBottom: 6,
  },
  descSkeleton2: {
    width: '85%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  dateSkeleton: {
    width: 100,
    height: 12,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  buttonSkeleton: {
    width: 60,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
});

export default NewsSkeletonLoader;
