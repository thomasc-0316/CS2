import React from 'react';
import { FlatList } from 'react-native';

export default function MasonryList({ data = [], renderItem, keyExtractor, numColumns = 2, ...rest }) {
  const extractor = keyExtractor || ((item, index) => (item?.id ? String(item.id) : String(index)));
  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={extractor}
      numColumns={numColumns}
      {...rest}
    />
  );
}
