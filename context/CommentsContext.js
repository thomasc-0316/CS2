import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CommentsContext = createContext();

export const CommentsProvider = ({ children }) => {
  // Structure: { lineupId: [{ id, text, username, timestamp, likes, likedBy: [] }] }
  const [comments, setComments] = useState({});
  const [commentLikes, setCommentLikes] = useState({});

  // Load comments from storage on app start
  useEffect(() => {
    loadComments();
    loadCommentLikes();
  }, []);

  const loadComments = async () => {
    try {
      const saved = await AsyncStorage.getItem('comments');
      if (saved) {
        setComments(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const loadCommentLikes = async () => {
    try {
      const saved = await AsyncStorage.getItem('commentLikes');
      if (saved) {
        setCommentLikes(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load comment likes:', error);
    }
  };

  const saveComments = async (newComments) => {
    try {
      await AsyncStorage.setItem('comments', JSON.stringify(newComments));
    } catch (error) {
      console.error('Failed to save comments:', error);
    }
  };

  const saveCommentLikes = async (newLikes) => {
    try {
      await AsyncStorage.setItem('commentLikes', JSON.stringify(newLikes));
    } catch (error) {
      console.error('Failed to save comment likes:', error);
    }
  };

  const addComment = (lineupId, text, username, profilePicture) => {
    const newComment = {
      id: Date.now().toString(),
      text,
      username,
      profilePicture,
      timestamp: Date.now(),
      likes: 0,
      replies: [],
    };

    setComments(prev => {
      const lineupComments = prev[lineupId] || [];
      const newComments = {
        ...prev,
        [lineupId]: [...lineupComments, newComment],
      };
      saveComments(newComments);
      return newComments;
    });
  };

  const addReply = (lineupId, parentCommentId, text, username, profilePicture) => {
    const newReply = {
      id: Date.now().toString(),
      text,
      username,
      profilePicture,
      timestamp: Date.now(),
      likes: 0,
    };

    setComments(prev => {
      const lineupComments = prev[lineupId] || [];
      const updatedComments = lineupComments.map(comment => {
        if (comment.id === parentCommentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply],
          };
        }
        return comment;
      });

      const newComments = {
        ...prev,
        [lineupId]: updatedComments,
      };
      saveComments(newComments);
      return newComments;
    });
  };

  const deleteComment = (lineupId, commentId) => {
    setComments(prev => {
      const lineupComments = prev[lineupId] || [];
      const newComments = {
        ...prev,
        [lineupId]: lineupComments.filter(c => c.id !== commentId),
      };
      saveComments(newComments);
      return newComments;
    });
  };

  const deleteReply = (lineupId, parentCommentId, replyId) => {
    setComments(prev => {
      const lineupComments = prev[lineupId] || [];
      const updatedComments = lineupComments.map(comment => {
        if (comment.id === parentCommentId) {
          return {
            ...comment,
            replies: (comment.replies || []).filter(r => r.id !== replyId),
          };
        }
        return comment;
      });

      const newComments = {
        ...prev,
        [lineupId]: updatedComments,
      };
      saveComments(newComments);
      return newComments;
    });
  };

  const toggleCommentLike = (commentId) => {
    setCommentLikes(prev => {
      const newLikes = { ...prev };
      if (newLikes[commentId]) {
        delete newLikes[commentId];
      } else {
        newLikes[commentId] = true;
      }
      saveCommentLikes(newLikes);
      return newLikes;
    });
  };

  const isCommentLiked = (commentId) => {
    return !!commentLikes[commentId];
  };

  const getCommentLikeCount = (comment) => {
    return comment.likes + (commentLikes[comment.id] ? 1 : 0);
  };

  const getComments = (lineupId) => {
    return comments[lineupId] || [];
  };

  const getCommentCount = (lineupId) => {
    return (comments[lineupId] || []).length;
  };

  return (
    <CommentsContext.Provider value={{
      addComment,
      addReply,
      deleteComment,
      deleteReply,
      getComments,
      getCommentCount,
      toggleCommentLike,
      isCommentLiked,
      getCommentLikeCount
    }}>
      {children}
    </CommentsContext.Provider>
  );
};

export const useComments = () => {
  const context = useContext(CommentsContext);
  if (!context) {
    throw new Error('useComments must be used within CommentsProvider');
  }
  return context;
};
