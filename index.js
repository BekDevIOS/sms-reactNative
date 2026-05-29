/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {registerForegroundService} from './src/worker/foregroundService';

// Must run before the app renders, outside any React component, so Android can
// restart the foreground-service task after the process is killed.
registerForegroundService();

AppRegistry.registerComponent(appName, () => App);
