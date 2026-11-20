import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import {
  findNodeHandle,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';

const VARIANT = 'unnamed';

function useFocusTracker() {
  const [focused, setFocused] = useState('none');
  const track = name => ({
    onBlur: () => setFocused(current => (current === name ? 'none' : current)),
    onFocus: () => setFocused(name),
  });
  return [focused, track];
}

function Box({name, track, tabIndex, focusable, innerRef, onPress, ...rest}) {
  return (
    <Pressable
      accessibilityLabel={name}
      focusable={focusable}
      onPress={onPress ?? (() => {})}
      ref={innerRef}
      style={styles.box}
      tabIndex={tabIndex}
      testID={`audit-${name}`}
      {...rest}
      {...track(name)}>
      <Text style={styles.boxText}>{name}</Text>
    </Pressable>
  );
}

function AnnouncedNode({name, track, focusable}) {
  return (
    <View
      accessibilityLabel={name}
      accessible={true}
      focusable={focusable}
      style={styles.announced}
      testID={`audit-${name}`}
      {...track(name)}>
      <Text style={styles.boxText}>{`${name} (focusable: ${String(focusable)})`}</Text>
    </View>
  );
}

function TouchOnlyButton({label, onPress}) {
  return (
    <Pressable
      accessible={false}
      focusable={false}
      onPress={onPress}
      style={styles.touchOnly}
      testID={`touch-${label}`}>
      <Text style={styles.touchOnlyText}>{label}</Text>
    </Pressable>
  );
}

function TabIndexScene({track}) {
  return (
    <>
      <Box name="First" track={track} />
      <Box name="Middle" tabIndex={-1} track={track} />
      <Box name="Last" track={track} />
    </>
  );
}

function AnnouncedScene({track}) {
  return (
    <>
      <Box name="First" track={track} />
      <AnnouncedNode focusable={false} name="Announced" track={track} />
      <Box name="Last" track={track} />
    </>
  );
}

function RemovalScene({track}) {
  const [targetFocusable, setTargetFocusable] = useState(undefined);
  return (
    <>
      <View style={styles.row}>
        <TouchOnlyButton label="set-true" onPress={() => setTargetFocusable(true)} />
        <TouchOnlyButton label="set-false" onPress={() => setTargetFocusable(false)} />
        <TouchOnlyButton label="set-unset" onPress={() => setTargetFocusable(undefined)} />
      </View>
      <Box name="First" track={track} />
      <AnnouncedNode focusable={targetFocusable} name="Target" track={track} />
      <Box name="Last" track={track} />
    </>
  );
}

function RefFocusScene({track}) {
  const excludedRef = useRef(null);
  return (
    <>
      <Box name="FocusIt" onPress={() => excludedRef.current?.focus()} track={track} />
      <Box innerRef={excludedRef} name="Excluded" tabIndex={-1} track={track} />
      <Box name="Last" track={track} />
    </>
  );
}

function ScrollScene({track}) {
  return (
    <>
      <ScrollView style={styles.outlined}>
        <Box name="First" track={track} />
        <View>
          <Box name="Middle" tabIndex={-1} track={track} />
        </View>
      </ScrollView>
      <Box name="Last" track={track} />
    </>
  );
}

function HorizontalScene({track}) {
  return (
    <>
      <ScrollView horizontal={true} style={styles.outlined}>
        <View style={styles.column}>
          <Box name="First" track={track} />
        </View>
        <View style={styles.column}>
          <Box name="Middle" tabIndex={-1} track={track} />
        </View>
      </ScrollView>
      <Box name="Last" track={track} />
    </>
  );
}

const CLIPPED_ROWS = ['Row1', 'Row2', 'Row3', 'Row4', 'Row5', 'Row6', 'Row7', 'Row8'];
const EXCLUDED_ROWS = new Set(['Row3', 'Row4', 'Row5']);

function ClippedScene({track}) {
  return (
    <>
      <ScrollView removeClippedSubviews={true} style={styles.clipped}>
        {CLIPPED_ROWS.map(name => (
          <View key={name} style={styles.tallRow}>
            <Box
              name={name}
              tabIndex={EXCLUDED_ROWS.has(name) ? -1 : undefined}
              track={track}
            />
          </View>
        ))}
      </ScrollView>
      <Box name="Last" track={track} />
    </>
  );
}

function NextFocusScene({track}) {
  const excludedRef = useRef(null);
  const [excludedTag, setExcludedTag] = useState(undefined);
  useEffect(() => {
    setExcludedTag(findNodeHandle(excludedRef.current) ?? undefined);
  }, []);
  return (
    <>
      <Box
        name="First"
        nextFocusDown={excludedTag}
        nextFocusForward={excludedTag}
        track={track}
      />
      <Box innerRef={excludedRef} name="Excluded" tabIndex={-1} track={track} />
      <Box name="Last" track={track} />
    </>
  );
}

function TouchablesScene({track}) {
  return (
    <>
      <Box name="First" track={track} />
      <TouchableOpacity
        accessibilityLabel="OpacityDisabled"
        disabled={true}
        onPress={() => {}}
        style={styles.box}
        {...track('OpacityDisabled')}>
        <Text style={styles.boxText}>OpacityDisabled</Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityLabel="OpacityNoOnPress"
        style={styles.box}
        {...track('OpacityNoOnPress')}>
        <Text style={styles.boxText}>OpacityNoOnPress</Text>
      </TouchableOpacity>
      <TouchableHighlight
        accessibilityLabel="Highlight"
        onPress={() => {}}
        style={styles.box}
        {...track('Highlight')}>
        <Text style={styles.boxText}>Highlight</Text>
      </TouchableHighlight>
      <Box disabled={true} name="PressableDisabled" track={track} />
      <Box name="Last" track={track} />
    </>
  );
}

function ContainerScene({track}) {
  return (
    <>
      <Box name="First" track={track} />
      <View
        accessibilityLabel="Container"
        accessible={true}
        focusable={false}
        style={styles.container}
        testID="audit-Container"
        {...track('Container')}>
        <Box name="Inner1" track={track} />
        <Box name="Inner2" track={track} />
      </View>
      <Box name="Last" track={track} />
    </>
  );
}

const SCENES = {
  'tab-index': TabIndexScene,
  announced: AnnouncedScene,
  removal: RemovalScene,
  'ref-focus': RefFocusScene,
  scroll: ScrollScene,
  horizontal: HorizontalScene,
  clipped: ClippedScene,
  'next-focus': NextFocusScene,
  touchables: TouchablesScene,
  container: ContainerScene,
};

export default function FocusableAudit() {
  const [scene, setScene] = useState('tab-index');
  const [focused, track] = useFocusTracker();
  const Scene = SCENES[scene];
  return (
    <View style={styles.root}>
      <View style={styles.picker}>
        {Object.keys(SCENES).map(name => (
          <TouchOnlyButton key={name} label={name} onPress={() => setScene(name)} />
        ))}
      </View>
      <Text style={styles.status} testID="audit-status">
        {`variant: ${VARIANT} | scene: ${scene} | focused: ${focused}`}
      </Text>
      <View key={scene} style={styles.scene} testID={`audit-scene-${scene}`}>
        <Scene track={track} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  announced: {
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    marginVertical: 6,
  },
  box: {
    alignItems: 'center',
    backgroundColor: '#e8eaf6',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    marginVertical: 6,
  },
  boxText: {
    color: '#1a237e',
    fontSize: 16,
  },
  clipped: {
    borderColor: '#5c6bc0',
    borderWidth: 2,
    flexGrow: 0,
    height: 200,
  },
  column: {
    width: 160,
  },
  container: {
    borderColor: '#ef6c00',
    borderWidth: 2,
    padding: 6,
  },
  outlined: {
    borderColor: '#5c6bc0',
    borderWidth: 2,
    flexGrow: 0,
  },
  picker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  root: {
    flex: 1,
    padding: 12,
    paddingTop: 48,
  },
  row: {
    flexDirection: 'row',
  },
  scene: {
    marginTop: 8,
  },
  status: {
    color: '#000000',
    fontSize: 14,
    marginTop: 8,
  },
  tallRow: {
    height: 120,
    justifyContent: 'center',
  },
  touchOnly: {
    backgroundColor: '#eeeeee',
    borderRadius: 4,
    margin: 3,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  touchOnlyText: {
    color: '#424242',
    fontSize: 12,
  },
});
