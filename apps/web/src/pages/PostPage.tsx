import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigate } from 'react-router-dom';
import Surface from '../components/Surface';
import SectionHeading from '../components/SectionHeading';
import Pill from '../components/Pill';
import { colors, radii, spacing } from '../theme/tokens';
import { MAPS } from '@data/maps.js';
import { createLineupPost } from '@services/postService.js';
import { useAuth } from '@ctx/AuthContext.js';

type MapData = {
  id: string;
  name: string;
};

export default function PostPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [throwInstructions, setThrowInstructions] = useState('');
  const maps = MAPS as MapData[];
  const [mapId, setMapId] = useState(maps[0]?.id || 'dust2');
  const [side, setSide] = useState<'T' | 'CT'>('T');
  const [site, setSite] = useState('A');
  const [nadeType, setNadeType] = useState('Smoke');
  const [standImage, setStandImage] = useState<string | null>(null);
  const [aimImage, setAimImage] = useState<string | null>(null);
  const [landImage, setLandImage] = useState<string | null>(null);
  const [moreDetailsImage, setMoreDetailsImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const mapName = useMemo(
    () => maps.find((m) => m.id === mapId)?.name || 'Map',
    [mapId, maps],
  );

  const handleFile = async (event: ChangeEvent<HTMLInputElement>, setter: (uri: string) => void) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setter(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!title || !standImage || !aimImage || !landImage) {
      setError('Title and all core images are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const lineupId = await createLineupPost(
        {
          title,
          description,
          throwInstructions,
          mapId,
          side,
          site,
          nadeType,
          standImage,
          aimImage,
          landImage,
          moreDetailsImage: moreDetailsImage || undefined,
        },
        currentUser,
      );
      navigate(`/lineups/${mapId}/${lineupId}`);
    } catch (err: any) {
      console.error('Failed to post lineup', err);
      setError(err?.message || 'Failed to create lineup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.page}>
      <Surface>
        <SectionHeading title="Create lineup" subtitle="Upload images and details from desktop." />

        <View style={styles.form}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={colors.muted}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            multiline
            value={description}
            onChangeText={setDescription}
            placeholder="Add context for your team"
            placeholderTextColor={colors.muted}
          />

          <Text style={styles.label}>Throw instructions</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            multiline
            value={throwInstructions}
            onChangeText={setThrowInstructions}
            placeholder="Steps to execute"
            placeholderTextColor={colors.muted}
          />

          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Map</Text>
              <View style={styles.pillRow}>
                {maps.map((m) => (
                  <Pill key={m.id} label={m.name} active={mapId === m.id} onPress={() => setMapId(m.id)} />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Side</Text>
              <View style={styles.pillRow}>
                {(['T', 'CT'] as const).map((s) => (
                  <Pill key={s} label={s} active={side === s} onPress={() => setSide(s)} />
                ))}
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Site</Text>
              <View style={styles.pillRow}>
                {['A', 'Mid', 'B'].map((s) => (
                  <Pill key={s} label={s} active={site === s} onPress={() => setSite(s)} />
                ))}
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Grenade</Text>
              <View style={styles.pillRow}>
                {['Smoke', 'Flash', 'Molotov', 'HE'].map((s) => (
                  <Pill key={s} label={s} active={nadeType === s} onPress={() => setNadeType(s)} />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.uploadGrid}>
            <UploadBlock
              label="Stand image"
              value={standImage}
              required
              onChange={(e) => handleFile(e, (uri) => setStandImage(uri))}
            />
            <UploadBlock
              label="Aim image"
              value={aimImage}
              required
              onChange={(e) => handleFile(e, (uri) => setAimImage(uri))}
            />
            <UploadBlock
              label="Land image"
              value={landImage}
              required
              onChange={(e) => handleFile(e, (uri) => setLandImage(uri))}
            />
            <UploadBlock
              label="More details (optional)"
              value={moreDetailsImage}
              onChange={(e) => handleFile(e, (uri) => setMoreDetailsImage(uri))}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text
            onPress={handleSubmit}
            suppressHighlighting
            style={[styles.submit, loading ? styles.submitDisabled : null]}
          >
            {loading ? 'Uploading...' : `Publish to ${mapName}`}
          </Text>
        </View>
      </Surface>
    </View>
  );
}

function UploadBlock({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string | null;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) {
  return (
    <View style={styles.uploadCard}>
      <Text style={styles.uploadLabel}>
        {label} {required ? '*' : ''}
      </Text>
      <input type="file" accept="image/*" onChange={onChange} />
      {value ? (
        <img src={value} alt={label} style={{ marginTop: 8, borderRadius: 8, width: '100%' }} />
      ) : (
        <Text style={styles.uploadHint}>PNG/JPG</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },
  form: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  label: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  field: {
    flex: 1,
    minWidth: 220,
    gap: spacing.xs,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  uploadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  uploadCard: {
    flexBasis: '48%',
    minWidth: 260,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.sm,
    backgroundColor: colors.surface,
  },
  uploadLabel: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  uploadHint: {
    color: colors.muted,
    fontSize: 12,
  },
  error: {
    color: colors.danger,
    fontWeight: '700',
  },
  submit: {
    marginTop: spacing.md,
    textAlign: 'center',
    backgroundColor: colors.primary,
    color: '#0b0c10',
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    fontWeight: '800',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  submitDisabled: {
    opacity: 0.7,
  },
});
