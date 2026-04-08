export const fakeUser = {
  uid: 'user-123',
  email: 'user@example.com',
  displayName: 'User One',
  profile: {
    username: 'userone',
    profilePicture: null,
    playerID: '111222333',
  },
};

export const fakeLineup = {
  id: 'lineup-1',
  title: 'A-site smoke',
  description: 'Default smoke',
  throwInstructions: 'Run throw',
  mapId: 'dust2',
  side: 'T',
  site: 'A',
  nadeType: 'smoke',
  standImage: 'file:///stand.jpg',
  aimImage: 'file:///aim.jpg',
  landImage: 'file:///land.jpg',
  moreDetailsImage: null,
  creatorId: 'user-123',
};

export const fakeTactic = {
  id: 'tactic-1',
  title: 'B take',
  description: 'Fast execute',
  mapId: 'dust2',
  side: 'T',
  lineupIds: ['lineup-1'],
  tags: ['execute'],
  isPublic: true,
  creatorId: 'user-123',
};

export const fakeRoom = {
  code: '123456',
  iglId: 'user-123',
  mapId: 'dust2',
  phase: 'MAP_SELECT',
  side: 'T',
  tacticSource: 'default',
  players: [{ uid: 'user-123', username: 'userone' }],
  tacticVotes: {},
  grenadeSelections: {},
};
