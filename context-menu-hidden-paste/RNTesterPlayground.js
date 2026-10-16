/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useState} from 'react';
import {StyleSheet, TextInput, View} from 'react-native';

function Playground() {
  const [hidden, setHidden] = useState('');
  const [shown, setShown] = useState('');
  return (
    <View style={styles.container}>
      <TextInput defaultValue="123456" style={styles.input} />
      <TextInput
        contextMenuHidden={true}
        onChangeText={setHidden}
        placeholder="contextMenuHidden"
        style={styles.input}
      />
      <TextInput
        onChangeText={setShown}
        placeholder="no contextMenuHidden"
        style={styles.input}
      />
      <RNTesterText>
        {`with the flag: ${JSON.stringify(hidden)}, without: ${JSON.stringify(shown)}`}
      </RNTesterText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  input: {
    borderColor: 'gray',
    borderWidth: 1,
    fontSize: 20,
    marginBottom: 10,
    padding: 10,
  },
});

export default {
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;
