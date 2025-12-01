// components/DraftSelectionModal.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useDrafts } from '../context/DraftsContext';

/**
 * Draft selection modal
 * Shows when user taps Post tab - choose to load draft or create new
 * 
 * @param {boolean} visible - Modal visibility
 * @param {function} onSelectDraft - Callback with selected draft
 * @param {function} onCreateNew - Create new post callback
 * @param {function} onClose - Close modal callback
 */
export default function DraftSelectionModal({ visible, onSelectDraft, onCreateNew, onClose }) {
  const { drafts, deleteDraft } = useDrafts();

  // Sort drafts by updatedAt (newest first)
  const sortedDrafts = [...drafts].sort((a, b) => {
    const aDate = a.updatedAt || a.createdAt || 0;
    const bDate = b.updatedAt || b.createdAt || 0;
    return bDate - aDate;
  });

  const handleSelectDraft = (draft) => {
    onSelectDraft(draft);
    onClose();
  };

  const handleCreateNew = () => {
    onCreateNew();
    onClose();
  };

  const handleDeleteDraft = (draft, index) => {
    Alert.alert(
      'Delete Draft',
      'Are you sure you want to delete this draft?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteDraft(draft.id || index);
          },
        },
      ]
    );
  };

  const renderDraftItem = ({ item, index }) => {
    const thumbnail = item.standImage || item.aimImage || item.landImage;
    const hasContent = item.title || item.description;

    return (
      <TouchableOpacity
        style={styles.draftItem}
        onPress={() => handleSelectDraft(item)}
      >
        {/* Thumbnail or Placeholder */}
        <View style={styles.thumbnailContainer}>
          {thumbnail ? (
            <Image
              source={{ uri: thumbnail }}
              style={styles.thumbnail}
              contentFit="cover"
            />
          ) : (
            <View style={styles.placeholderThumbnail}>
              <Ionicons name="image-outline" size={30} color="#666" />
            </View>
          )}
        </View>

        {/* Draft Info */}
        <View style={styles.draftInfo}>
          <Text style={styles.draftTitle} numberOfLines={1}>
            {item.title || 'Untitled Draft'}
          </Text>
          
          {item.description && (
            <Text style={styles.draftDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.draftMeta}>
            {item.side && <Text style={styles.metaTag}>{item.side}</Text>}
            {item.site && <Text style={styles.metaTag}>{item.site}</Text>}
            {item.nadeType && <Text style={styles.metaTag}>{item.nadeType}</Text>}
          </View>

          <Text style={styles.draftDate}>
            {new Date(item.updatedAt || item.createdAt).toLocaleDateString()} at{' '}
            {new Date(item.updatedAt || item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteDraft(item, index);
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="bookmark-outline" size={80} color="#4a4a4a" />
      <Text style={styles.emptyText}>No drafts saved yet</Text>
      <Text style={styles.emptySubtext}>
        Drafts are saved automatically as you work
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Your Drafts</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Create New Button */}
          <TouchableOpacity style={styles.createNewButton} onPress={handleCreateNew}>
            <Ionicons name="add-circle" size={24} color="#FF6800" />
            <Text style={styles.createNewText}>Create New Lineup</Text>
          </TouchableOpacity>

          {/* Drafts List */}
          {sortedDrafts.length > 0 && (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Saved Drafts ({sortedDrafts.length})
              </Text>
            </View>
          )}

          <FlatList
            data={sortedDrafts}
            renderItem={renderDraftItem}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    marginTop: 100,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF6800',
    gap: 10,
  },
  createNewText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6800',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: 20,
  },
  draftItem: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  thumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  draftInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  draftTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  draftDescription: {
    fontSize: 13,
    color: '#999',
    marginBottom: 6,
  },
  draftMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  metaTag: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 11,
    color: '#FF6800',
    fontWeight: '600',
  },
  draftDate: {
    fontSize: 11,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});