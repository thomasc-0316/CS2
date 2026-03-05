import type { ReactElement } from 'react';
import { FlatList } from 'react-native';

// Simple FlatList fallback for web; respects numColumns and contentContainerStyle.
export default function MasonryList<T>({
  data,
  renderItem,
  keyExtractor,
  numColumns = 2,
  contentContainerStyle,
  ...rest
}: {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => ReactElement | null;
  keyExtractor: (item: T, index: number) => string;
  numColumns?: number;
  contentContainerStyle?: any;
  [key: string]: any;
}) {
  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      contentContainerStyle={contentContainerStyle}
      {...rest}
    />
  );
}
