/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as React from 'react';
import {useEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, Switch, Text, View} from 'react-native';

const VARIANT = 'unset';

function Row({
  label,
  children,
}: {
  label: string,
  children: React.Node,
}): React.Node {
  return (
    <View
      style={{flexDirection: 'row', alignItems: 'center', gap: 8, height: 30}}>
      <Text>{label}</Text>
      {children}
    </View>
  );
}

function IndicatorTurnedVisible(): React.Node {
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    const timeout = setTimeout(() => setHidden(false), 1500);
    return () => clearTimeout(timeout);
  }, []);
  return <ActivityIndicator aria-hidden={hidden} />;
}

export default function A11yProbe(): React.Node {
  return (
    <View style={{flex: 1, paddingTop: 60, paddingHorizontal: 16, gap: 6}}>
      <Text>{`probe ready: ${VARIANT}`}</Text>
      <Text>plain text</Text>
      <View aria-hidden={true}>
        <Text>text in a View with aria-hidden</Text>
      </View>
      <View accessibilityElementsHidden={true}>
        <Text>text in a View with accessibilityElementsHidden</Text>
      </View>
      <View aria-hidden={false} accessibilityElementsHidden={true}>
        <Text>text in a View with aria-hidden false over the iOS prop</Text>
      </View>
      <ScrollView style={{maxHeight: 30}}>
        <Text>text in a plain ScrollView</Text>
      </ScrollView>
      <ScrollView aria-hidden={true} style={{maxHeight: 30}}>
        <Text>text in a ScrollView with aria-hidden</Text>
      </ScrollView>
      <ScrollView
        aria-hidden={false}
        accessibilityElementsHidden={true}
        style={{maxHeight: 30}}>
        <Text>text in a ScrollView with aria-hidden false over the iOS prop</Text>
      </ScrollView>
      <Row label="row: indicator">
        <ActivityIndicator />
      </Row>
      <Row label="row: indicator with aria-hidden">
        <ActivityIndicator aria-hidden={true} />
      </Row>
      <Row label="row: indicator with aria-hidden false over the iOS prop">
        <ActivityIndicator aria-hidden={false} accessibilityElementsHidden={true} />
      </Row>
      <Row label="row: indicator whose aria-hidden turns off">
        <IndicatorTurnedVisible />
      </Row>
      <Switch testID="switch-plain" value={true} />
      <Switch testID="switch-aria-hidden" aria-hidden={true} value={true} />
      <Switch
        testID="switch-accessibility-elements-hidden"
        accessibilityElementsHidden={true}
        value={true}
      />
    </View>
  );
}
