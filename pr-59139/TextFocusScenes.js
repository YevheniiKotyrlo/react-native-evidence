import * as React from 'react';
import {useEffect, useState} from 'react';
import {Linking, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';

const SCROLL_VIEW_SCENE_URL = 'rntester://example/text-label-in-scroll-view';

function useFocusLog() {
  const [focused, setFocused] = useState('none');
  const track = name => ({
    onBlur: () => setFocused(current => (current === name ? 'none' : current)),
    onFocus: () => setFocused(name),
  });
  return [focused, track];
}

function FocusBox({name, track}) {
  return (
    <Pressable
      accessibilityLabel={name}
      onPress={() => {}}
      style={styles.box}
      testID={`evidence-box-${name}`}
      {...track(name)}>
      <Text style={styles.boxText}>{name}</Text>
    </Pressable>
  );
}

function PressableLabel({onPress}) {
  return (
    <Text
      focusable={false}
      onPress={onPress}
      style={styles.label}
      testID="evidence-label">
      {'Label with onPress, focusable={false}'}
    </Text>
  );
}

function usePressCount() {
  const [presses, setPresses] = useState(0);
  return [presses, () => setPresses(count => count + 1)];
}

function FocusStatus({focused, presses}) {
  return (
    <>
      <Text style={styles.status} testID="evidence-status">
        focused: {focused}
      </Text>
      <Text style={styles.presses} testID="evidence-presses">
        label presses: {presses}
      </Text>
    </>
  );
}

function TextLabelScene() {
  const [focused, track] = useFocusLog();
  const [presses, press] = usePressCount();
  return (
    <View style={styles.scene} testID="evidence-scene">
      <FocusBox name="First" track={track} />
      <PressableLabel onPress={press} />
      <FocusBox name="Last" track={track} />
      <FocusStatus focused={focused} presses={presses} />
    </View>
  );
}

function TextLabelInScrollViewScene() {
  const [focused, track] = useFocusLog();
  const [presses, press] = usePressCount();
  return (
    <View style={styles.scene} testID="evidence-scene">
      <ScrollView style={styles.scroller}>
        <FocusBox name="First" track={track} />
        <View>
          <PressableLabel onPress={press} />
        </View>
      </ScrollView>
      <FocusBox name="Last" track={track} />
      <FocusStatus focused={focused} presses={presses} />
    </View>
  );
}

export default function TextFocusScenes() {
  const [url, setUrl] = useState(undefined);
  useEffect(() => {
    Linking.getInitialURL().then(initialUrl => setUrl(initialUrl ?? ''));
  }, []);
  if (url === undefined) {
    return <View style={styles.root} />;
  }
  return (
    <View style={styles.root}>
      {url === SCROLL_VIEW_SCENE_URL ? (
        <TextLabelInScrollViewScene />
      ) : (
        <TextLabelScene />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    backgroundColor: '#e8eaf6',
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    marginVertical: 8,
  },
  boxText: {
    color: '#1a237e',
    fontSize: 18,
  },
  label: {
    color: '#424242',
    fontSize: 18,
    marginVertical: 8,
    paddingVertical: 12,
  },
  root: {
    backgroundColor: '#ffffff',
    flex: 1,
    paddingTop: 120,
  },
  scene: {
    padding: 16,
  },
  scroller: {
    borderColor: '#9e9e9e',
    borderWidth: 1,
    flexGrow: 0,
  },
  presses: {
    color: '#000000',
    fontSize: 18,
    marginTop: 8,
  },
  status: {
    color: '#000000',
    fontSize: 18,
    marginTop: 16,
  },
});
