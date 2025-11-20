import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useComments } from '../context/CommentsContext';
import { useProfile } from '../context/ProfileContext';

export default function CommentsModal({ visible, onClose, lineupId }) {
  const { addComment, addReply, deleteComment, deleteReply, getComments, toggleCommentLike, isCommentLiked, getCommentLikeCount } = useComments();
  const { profile } = useProfile();
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // { commentId, username }

  const comments = getComments(lineupId);

  const handleAddComment = () => {
    const text = commentText.trim();
    if (!text) return;

    if (replyingTo) {
      // Add as a reply
      addReply(lineupId, replyingTo.commentId, text, profile.username, profile.profilePicture);
      setReplyingTo(null);
    } else {
      // Add as a top-level comment
      addComment(lineupId, text, profile.username, profile.profilePicture);
    }
    setCommentText('');
  };

  const handleReply = (comment, parentCommentId = null) => {
    // If replying to a reply, use the parent comment ID, otherwise use the comment ID
    const targetCommentId = parentCommentId || comment.id;
    setReplyingTo({ commentId: targetCommentId, username: comment.username });
    setCommentText(`@${comment.username} `);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setCommentText('');
  };

  const handleDeleteComment = (commentId) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteComment(lineupId, commentId),
        },
      ]
    );
  };

  const handleDeleteReply = (parentCommentId, replyId) => {
    Alert.alert(
      'Delete Reply',
      'Are you sure you want to delete this reply?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteReply(lineupId, parentCommentId, replyId),
        },
      ]
    );
  };

  const formatTime = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return `${Math.floor(seconds / 604800)}w`;
  };

  const renderReply = (reply, parentCommentId) => {
    const isOwnReply = reply.username === profile.username;
    const liked = isCommentLiked(reply.id);
    const likeCount = getCommentLikeCount(reply);

    return (
      <View key={reply.id} style={styles.replyContainer}>
        <View style={styles.commentHeader}>
          <View style={styles.avatarPlaceholder}>
            {reply.profilePicture && typeof reply.profilePicture === 'string' && reply.profilePicture.trim() !== '' ? (
              <Image
                source={{ uri: reply.profilePicture }}
                style={styles.avatar28}
                contentFit="cover"
              />
            ) : (
              <Ionicons name="person-circle" size={28} color="#666" />
            )}
          </View>
          <View style={styles.commentContent}>
            <Text style={styles.username}>{reply.username}</Text>
            <Text style={styles.commentText}>{reply.text}</Text>
            <View style={styles.commentFooter}>
              <Text style={styles.timestamp}>{formatTime(reply.timestamp)}</Text>
              {likeCount > 0 && (
                <>
                  <Text style={styles.footerDot}>•</Text>
                  <Text style={styles.likesCount}>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</Text>
                </>
              )}
              <Text style={styles.footerDot}>•</Text>
              <TouchableOpacity onPress={() => handleReply(reply, parentCommentId)}>
                <Text style={styles.replyText}>Reply</Text>
              </TouchableOpacity>
              {isOwnReply && (
                <>
                  <Text style={styles.footerDot}>•</Text>
                  <TouchableOpacity onPress={() => handleDeleteReply(parentCommentId, reply.id)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => toggleCommentLike(reply.id)}
            style={styles.likeButton}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={12}
              color={liked ? '#FF6800' : '#666'}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderComment = ({ item }) => {
    const isOwnComment = item.username === profile.username;
    const liked = isCommentLiked(item.id);
    const likeCount = getCommentLikeCount(item);
    const replies = item.replies || [];

    return (
      <View style={styles.commentContainer}>
        <View style={styles.commentHeader}>
          <View style={styles.avatarPlaceholder}>
            {item.profilePicture && typeof item.profilePicture === 'string' && item.profilePicture.trim() !== '' ? (
              <Image
                source={{ uri: item.profilePicture }}
                style={styles.avatar32}
                contentFit="cover"
              />
            ) : (
              <Ionicons name="person-circle" size={32} color="#666" />
            )}
          </View>
          <View style={styles.commentContent}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.commentText}>{item.text}</Text>
            <View style={styles.commentFooter}>
              <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
              {likeCount > 0 && (
                <>
                  <Text style={styles.footerDot}>•</Text>
                  <Text style={styles.likesCount}>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</Text>
                </>
              )}
              <Text style={styles.footerDot}>•</Text>
              <TouchableOpacity onPress={() => handleReply(item)}>
                <Text style={styles.replyText}>Reply</Text>
              </TouchableOpacity>
              {isOwnComment && (
                <>
                  <Text style={styles.footerDot}>•</Text>
                  <TouchableOpacity onPress={() => handleDeleteComment(item.id)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => toggleCommentLike(item.id)}
            style={styles.likeButton}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={12}
              color={liked ? '#FF6800' : '#666'}
            />
          </TouchableOpacity>
        </View>

        {/* Render Replies */}
        {replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {replies.map(reply => renderReply(reply, item.id))}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Comments</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Comments List */}
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.commentsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={60} color="#666" />
              <Text style={styles.emptyText}>No comments yet</Text>
              <Text style={styles.emptySubtext}>Be the first to comment!</Text>
            </View>
          }
        />

        {/* Input Section */}
        <View style={styles.inputContainer}>
          {replyingTo && (
            <View style={styles.replyingToContainer}>
              <Text style={styles.replyingToText}>
                Replying to <Text style={styles.replyingToUsername}>@{replyingTo.username}</Text>
              </Text>
              <TouchableOpacity onPress={cancelReply}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputWrapper}>
            <View style={styles.avatarPlaceholderSmall}>
              {profile.profilePicture && typeof profile.profilePicture === 'string' && profile.profilePicture.trim() !== '' ? (
                <Image
                  source={{ uri: profile.profilePicture }}
                  style={styles.avatar28}
                  contentFit="cover"
                />
              ) : (
                <Ionicons name="person-circle" size={28} color="#666" />
              )}
            </View>
            <TextInput
              style={styles.input}
              placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Add a comment..."}
              placeholderTextColor="#666"
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            {commentText.trim().length > 0 && (
              <TouchableOpacity onPress={handleAddComment} style={styles.postButton}>
                <Text style={styles.postButtonText}>Post</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
    backgroundColor: '#0a0a0a',
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 38,
  },
  commentsList: {
    paddingVertical: 5,
  },
  commentContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarPlaceholder: {
    marginRight: 12,
  },
  avatar32: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3a3a3a',
  },
  avatar28: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3a3a3a',
  },
  commentContent: {
    flex: 1,
  },
  username: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 18,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  footerDot: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 8,
  },
  likesCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  deleteText: {
    fontSize: 12,
    color: '#FF6800',
    fontWeight: '600',
  },
  likeButton: {
    padding: 4,
    marginLeft: 8,
  },
  replyText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  repliesContainer: {
    marginLeft: 44,
    marginTop: 8,
  },
  replyContainer: {
    marginBottom: 10,
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  replyingToText: {
    fontSize: 13,
    color: '#aaa',
  },
  replyingToUsername: {
    fontWeight: '600',
    color: '#FF6800',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
    backgroundColor: '#0a0a0a',
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  avatarPlaceholderSmall: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    paddingTop: 8,
    color: '#fff',
    fontSize: 14,
    maxHeight: 100,
  },
  postButton: {
    marginLeft: 10,
    paddingBottom: 8,
  },
  postButtonText: {
    color: '#FF6800',
    fontSize: 15,
    fontWeight: '600',
  },
});
