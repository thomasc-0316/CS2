import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { MAPS } from '../../data/maps';

const defaultMapId = MAPS[0]?.id || 'default';

export function pathForRoute(name, params = {}) {
  switch (name) {
    case 'TacticDetail':
      return `/tactics/${params?.tactic?.id || params?.id || params?.tacticId || ''}`;
    case 'TacticsMain':
    case 'TacticsMapSelect':
    case 'CreateTacticFromFavorites':
      return '/tactics';
    case 'LineupGrid': {
      const mapId = params?.map?.id || params?.mapId || defaultMapId;
      return `/lineups/${mapId}`;
    }
    case 'LineupDetail': {
      const mapId = params?.map?.id || params?.mapId || defaultMapId;
      const lineupId = params?.lineupId || params?.id || '';
      return `/lineups/${mapId}/${lineupId}`;
    }
    case 'UserProfile':
      return params?.userId ? `/users/${params.userId}` : '/profile';
    case 'Profile':
    case 'ProfileMain':
      return '/profile';
    case 'Login':
      return '/login';
    case 'Signup':
      return '/signup';
    case 'SearchLineups':
    case 'PlayerSearch':
      return '/search';
    case 'Room':
    case 'RoomMain':
      return '/room';
    case 'PostMain':
      return '/post';
    case 'PreviewPost':
      return '/post/preview';
    case 'Hot':
      return '/hot';
    case 'HomeMain':
    case 'Home':
    default:
      return '/';
  }
}

export function useWebNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  return useMemo(
    () => ({
      navigate: (name, params = {}) => navigate(pathForRoute(name, params), { state: { params } }),
      push: (name, params = {}) => navigate(pathForRoute(name, params), { state: { params } }),
      replace: (name, params = {}) =>
        navigate(pathForRoute(name, params), { state: { params }, replace: true }),
      goBack: () => navigate(-1),
      canGoBack: () => true,
      setOptions: () => {},
      setParams: (nextParams = {}) =>
        navigate(location.pathname, {
          replace: true,
          state: { ...(location.state || {}), params: { ...(location.state?.params || {}), ...nextParams } },
        }),
    }),
    [navigate, location],
  );
}

export function useRouteParams(buildParams) {
  const params = useParams();
  const location = useLocation();
  const stateParams = location.state?.params || {};

  const computed = buildParams
    ? buildParams({ params, stateParams, location })
    : {};

  return { ...params, ...stateParams, ...computed };
}

export function createWebScreen(Component, routeName, buildParams) {
  return function WrappedScreen() {
    const navigation = useWebNavigation();
    const params = useRouteParams(buildParams);
    const route = { key: routeName, name: routeName, params };
    return <Component navigation={navigation} route={route} />;
  };
}
