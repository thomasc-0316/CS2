import type { ComponentType, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  type PressableStateCallbackType,
} from 'react-native';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  IoHomeOutline,
  IoFlameOutline,
  IoLayersOutline,
  IoMapOutline,
  IoPeopleOutline,
  IoPersonCircleOutline,
  IoMenuOutline,
  IoClose,
  IoLogOutOutline,
  IoPencilOutline,
} from 'react-icons/io5';
import { colors, radii, spacing } from '../theme/tokens';
import { useAuth } from '@ctx/AuthContext.js';
import { MAPS } from '@data/maps.js';

type AppShellProps = {
  children: ReactNode;
};

const defaultMapId = MAPS[0]?.id || 'dust2';

type PressableState = PressableStateCallbackType & { hovered?: boolean };

const navItems = [
  { label: 'Home', to: '/', icon: IoHomeOutline },
  { label: 'Hot', to: '/hot', icon: IoFlameOutline },
  { label: 'Lineups', to: `/lineups/${defaultMapId}`, icon: IoMapOutline },
  { label: 'Tactics', to: '/tactics', icon: IoLayersOutline },
  { label: 'Room', to: '/room', icon: IoPeopleOutline, requiresAuth: true },
  { label: 'Profile', to: '/profile', icon: IoPersonCircleOutline, requiresAuth: true },
];

function NavButton({
  label,
  to,
  icon: Icon,
  active,
  onPress,
}: {
  label: string;
  to: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  active: boolean;
  onPress: (to: string) => void;
}) {
  return (
    <Pressable
      onPress={() => onPress(to)}
      style={({ hovered }: PressableState) => [
        styles.navItem,
        active && styles.navItemActive,
        hovered && !active ? styles.navItemHover : null,
      ]}
    >
      <Icon size={18} color={active ? '#0b0c10' : colors.text} />
      <Text style={[styles.navText, active ? styles.navTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

function Sidebar({
  navigateTo,
  activePath,
  showAuthItems,
  onLogout,
  username,
}: {
  navigateTo: (to: string) => void;
  activePath: string;
  showAuthItems: boolean;
  onLogout: () => void;
  username?: string;
}) {
  const items = useMemo(
    () => navItems.filter((item) => (item.requiresAuth ? showAuthItems : true)),
    [showAuthItems],
  );

  return (
    <View style={styles.sidebar}>
      <View style={styles.brand}>
        <Text style={styles.brandAccent}>CS</Text>
        <Text style={styles.brandText}>Lineups</Text>
      </View>

      <View style={styles.sidebarNav}>
        {items.map((item) => (
          <NavButton
            key={item.to}
            label={item.label}
            to={item.to}
            icon={item.icon}
            active={activePath === item.to || activePath.startsWith(`${item.to}/`)}
            onPress={navigateTo}
          />
        ))}
      </View>

      <View style={styles.sidebarFooter}>
        {username ? (
          <View style={styles.userPill}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{username.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{username}</Text>
              <Text style={styles.userRole}>Signed in</Text>
            </View>
            <Pressable
              onPress={onLogout}
              style={({ hovered }: PressableState) => hovered && styles.logoutHover}
            >
              <IoLogOutOutline size={16} color={colors.muted} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => navigateTo('/signup')}
            style={({ hovered }: PressableState) => [
              styles.ctaButton,
              hovered ? styles.ctaButtonHover : null,
            ]}
          >
            <IoPencilOutline size={16} color="#0b0c10" />
            <Text style={styles.ctaText}>Join now</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { width } = useWindowDimensions();
  const [menuOpen, setMenuOpen] = useState(false);

  const isDesktop = width >= 1200;
  const isTablet = width >= 900;

  const activePath = location.pathname;

  const handleNavigate = (to: string) => {
    setMenuOpen(false);
    navigate(to);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <View style={styles.root}>
      {isDesktop && (
        <Sidebar
          navigateTo={handleNavigate}
          activePath={activePath}
          showAuthItems={!!currentUser}
          onLogout={handleLogout}
          username={currentUser?.profile?.username || currentUser?.displayName || undefined}
        />
      )}

      <View style={styles.contentArea}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {!isDesktop && (
              <Pressable
                style={styles.menuButton}
                onPress={() => setMenuOpen((prev) => !prev)}
              >
                {menuOpen ? (
                  <IoClose size={20} color={colors.text} />
                ) : (
                  <IoMenuOutline size={20} color={colors.text} />
                )}
              </Pressable>
            )}
            <Pressable onPress={() => handleNavigate('/')}>
              <Text style={styles.headerBrand}>CS2 Tactics</Text>
            </Pressable>
          </View>
          <View style={styles.headerActions}>
            {!isDesktop &&
              navItems
                .filter((item) => (item.requiresAuth ? !!currentUser : true))
                .map((item) => {
                  const Icon = item.icon;
                  const active =
                    activePath === item.to || activePath.startsWith(`${item.to}/`);
                  return (
                    <Pressable
                      key={item.to}
                      onPress={() => handleNavigate(item.to)}
                      style={({ hovered }: PressableState) => [
                        styles.headerIcon,
                        active && styles.headerIconActive,
                        hovered && !active ? styles.headerIconHover : null,
                      ]}
                    >
                      <Icon size={18} color={active ? '#0b0c10' : colors.text} />
                    </Pressable>
                  );
                })}
            {currentUser ? (
              <Pressable onPress={() => handleNavigate('/profile')} style={styles.profileChip}>
                <View style={styles.avatarSmall}>
                  <Text style={styles.avatarTextSmall}>
                    {(currentUser.profile?.username || 'You').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                {isTablet && (
                  <Text style={styles.profileChipText}>
                    {currentUser.profile?.username || 'Profile'}
                  </Text>
                )}
              </Pressable>
            ) : (
              <Pressable
                onPress={() => handleNavigate('/login')}
                style={({ hovered }: PressableState) => [
                  styles.signInButton,
                  hovered ? styles.signInButtonHover : null,
                ]}
              >
                <Text style={styles.signInText}>Sign in</Text>
              </Pressable>
            )}
          </View>
        </View>

        {!isDesktop && menuOpen ? (
          <View style={styles.mobileNav}>
            {navItems
              .filter((item) => (item.requiresAuth ? !!currentUser : true))
              .map((item) => {
                const Icon = item.icon;
                const active =
                  activePath === item.to || activePath.startsWith(`${item.to}/`);
                return (
                  <Pressable
                    key={item.to}
                    style={({ hovered }: PressableState) => [
                      styles.mobileNavItem,
                      active && styles.mobileNavItemActive,
                      hovered && !active ? styles.mobileNavItemHover : null,
                    ]}
                    onPress={() => handleNavigate(item.to)}
                  >
                    <Icon size={18} color={active ? '#0b0c10' : colors.text} />
                    <Text style={[styles.mobileNavText, active && styles.mobileNavTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
          </View>
        ) : null}

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.pageContainer, isDesktop ? styles.pageDesktop : null]}>
            {children}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  sidebar: {
    width: 250,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    gap: spacing.xl,
    position: 'sticky' as any,
    top: 0,
    height: '100vh' as any,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandAccent: {
    backgroundColor: colors.primary,
    color: '#0b0c10',
    fontWeight: '800',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    fontSize: 14,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
  },
  sidebarNav: {
    gap: spacing.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navItemHover: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  navItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  navText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  navTextActive: {
    color: '#0b0c10',
  },
  sidebarFooter: {
    marginTop: 'auto',
    gap: spacing.md,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 8 },
  },
  ctaButtonHover: {
    transform: [{ translateY: -1 }],
  },
  ctaText: {
    color: '#0b0c10',
    fontWeight: '800',
  },
  userPill: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.lg,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 12,
  },
  userName: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  userRole: {
    color: colors.muted,
    fontSize: 12,
  },
  logoutHover: {
    opacity: 0.7,
  },
  contentArea: {
    flex: 1,
    minHeight: '100vh' as any,
    flexDirection: 'column',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'rgba(12,15,22,0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky' as any,
    top: 0,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerBrand: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIcon: {
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  headerIconHover: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  headerIconActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  menuButton: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
  },
  avatarSmall: {
    width: 30,
    height: 30,
    borderRadius: radii.md,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarTextSmall: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 11,
  },
  profileChipText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  signInButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  signInButtonHover: {
    borderColor: colors.primary,
  },
  signInText: {
    color: colors.text,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  pageContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  pageDesktop: {
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  mobileNav: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mobileNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mobileNavItemHover: {
    backgroundColor: colors.surfaceAlt,
  },
  mobileNavItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  mobileNavText: {
    color: colors.text,
    fontWeight: '700',
  },
  mobileNavTextActive: {
    color: '#0b0c10',
  },
});
