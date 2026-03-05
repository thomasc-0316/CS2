import { View, Image, Pressable, StyleSheet } from 'react-native';

type Props = {
  images: { uri: string }[];
  imageIndex?: number;
  visible: boolean;
  onRequestClose: () => void;
};

export default function ImageViewing({ images, visible, onRequestClose, imageIndex = 0 }: Props) {
  if (!visible) return null;
  const target = images[imageIndex] || images[0];
  if (!target?.uri) return null;

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onRequestClose} />
      <Image source={{ uri: target.uri }} style={styles.image as any} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  image: {
    maxWidth: '90vw' as any,
    maxHeight: '90vh' as any,
  },
});
