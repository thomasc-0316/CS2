import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useDrafts } from '../context/DraftsContext';
import { useAuth } from '../context/AuthContext';
import { createLineupPost, updateLineupPost } from '../services/postService';

export default function PreviewPostScreen({ route, navigation }) {
  const { postData, isEditing, lineupId } = route.params;
  const { saveDraft } = useDrafts();
  const { currentUser } = useAuth();
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (posting) return;
    
    setPosting(true);
    
    try {
      if (isEditing) {
        // Update existing post
        await updateLineupPost(lineupId, postData, currentUser);
        
        setPosting(false);
        
        Alert.alert(
          'Success!',
          'Your lineup has been updated!',
          [
            {
              text: 'View Post',
              onPress: () => {
                navigation.navigate('Home');
                // Navigate to the updated post after a short delay
                setTimeout(() => {
                  navigation.navigate('LineupDetail', { lineupId });
                }, 100);
              },
            },
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('Profile');
              },
            },
          ]
        );
      } else {
        // Create new post
        const newLineupId = await createLineupPost(postData, currentUser);
        
        setPosting(false);
        
        Alert.alert(
          'Success!',
          'Your lineup has been posted!',
          [
            {
              text: 'View Post',
              onPress: () => {
                navigation.navigate('Home');
                // Navigate to the new post after a short delay
                setTimeout(() => {
                  navigation.navigate('LineupDetail', { lineupId: newLineupId });
                }, 100);
              },
            },
            {
              text: 'Post Another',
              onPress: () => {
                navigation.navigate('PostMain', { shouldReset: true });
              },
            },
          ]
        );
      }
    } catch (error) {
      setPosting(false);
      console.error('Error posting/updating lineup:', error);
      
      Alert.alert(
        isEditing ? 'Update Failed' : 'Post Failed',
        error.message || `Failed to ${isEditing ? 'update' : 'post'} your lineup. Please try again.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleSaveDraft = () => {
    saveDraft(postData);
    Alert.alert(
      'Draft Saved!',
      'Your lineup has been saved as a draft. You can find it in your profile.',
      [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('Profile');
          },
        },
      ]
    );
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header with Back and Action buttons */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={22} color="#FF6800" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Preview</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.draftButton} 
            onPress={handleSaveDraft}
            disabled={posting}
          >
            <Ionicons name="bookmark-outline" size={20} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.postButton, posting && styles.postButtonDisabled]} 
            onPress={handlePost}
            disabled={posting}
          >
            {posting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.postButtonText}>
                {isEditing ? 'Update' : 'Post'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Preview Content */}
      <ScrollView style={styles.content}>
        {/* Header Info */}
        <View style={styles.postHeader}>
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{postData.title}</Text>
            </View>
          </View>

          {postData.description ? (
            <Text style={styles.description}>{postData.description}</Text>
          ) : null}
          
          <View style={styles.tags}>
            <Text style={styles.tag}>{postData.side} Side</Text>
            <Text style={styles.tag}>{postData.site} Site</Text>
            <Text style={styles.tag}>{postData.nadeType}</Text>
          </View>
        </View>

        {/* Throw Instructions */}
        {postData.throwInstructions ? (
          <View style={styles.instructionBox}>
            <Text style={styles.instructionLabel}>How to Throw:</Text>
            <Text style={styles.instructionText}>{postData.throwInstructions}</Text>
          </View>
        ) : null}

        {/* Image 1: Where to Stand */}
        <View style={styles.imageSection}>
          <Text style={styles.imageTitle}>1. Where to Stand</Text>
          <Image source={{ uri: postData.standImage }} style={styles.image} contentFit="cover" />
        </View>

        {/* Image 2: Where to Aim */}
        <View style={styles.imageSection}>
          <Text style={styles.imageTitle}>2. Where to Aim</Text>
          <Image source={{ uri: postData.aimImage }} style={styles.image} contentFit="cover" />
        </View>

        {/* Image 3: Where It Lands */}
        <View style={styles.imageSection}>
          <Text style={styles.imageTitle}>3. Where It Lands</Text>
          <Image source={{ uri: postData.landImage }} style={styles.image} contentFit="cover" />
        </View>

        {/* Optional: More Details */}
        {(postData.moreDetailsImage || postData.thirdPersonImage) && (
          <View style={styles.imageSection}>
            <Text style={styles.imageTitle}>4. More Details</Text>
            <Image source={{ uri: postData.moreDetailsImage || postData.thirdPersonImage }} style={styles.image} contentFit="cover" />
          </View>
        )}

        {/* Bottom Padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  draftButton: {
    backgroundColor: '#2a2a2a',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postButton: {
    backgroundColor: '#FF6800',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  postButtonDisabled: {
    opacity: 0.6,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  postHeader: {
    padding: 20,
    backgroundColor: '#2a2a2a',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 22,
    marginBottom: 15,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#FF6800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  instructionBox: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6800',
  },
  instructionLabel: {
    fontSize: 14,
    color: '#FF6800',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  instructionText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  imageSection: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  imageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
  },
});