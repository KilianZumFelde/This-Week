// Manual mock for @expo/vector-icons — avoids native font loading in Jest.
const React = require('react');
const { Text } = require('react-native');
const Stub = () => React.createElement(Text, null, '');
Stub.displayName = 'VectorIconStub';

module.exports = {
  Feather: Stub,
  AntDesign: Stub,
  Entypo: Stub,
  FontAwesome: Stub,
  MaterialIcons: Stub,
  Ionicons: Stub,
};
