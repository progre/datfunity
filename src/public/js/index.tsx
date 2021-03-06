// tslint:disable-next-line:no-implicit-dependencies
import electron from 'electron';
import i18next from 'i18next';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import * as redux from 'redux';
import * as reduxPersist from 'redux-persist';
import { addError, setMessage } from './actions/actions';
import App from './containers/App';
import reducer from './reducers/reducer';
import { createInitialState, State } from './state';

async function main() {
  i18next.init({
    lng: 'jp',
    resources: {
      jp: {
        translation: {
          'Invalid url': 'URLが無効です',
        },
      },
    },
  });
  const store = redux.createStore<State>(
    reducer,
    {} as any,
    reduxPersist.autoRehydrate({
      stateReconciler: (_/*state*/: any, inboundState: any, __/*reducedState*/: any) =>
        createInitialState(inboundState),
    }),
  );
  await new Promise(resolve => reduxPersist.persistStore(store, {}, resolve));
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementsByTagName('main')[0],
  );
  listenIPC(store);
}

function listenIPC(store: redux.Store<State>) {
  electron.ipcRenderer.on('getConfiguration', (_: any, arg: { id: string }) => {
    if (arg.id == null) { throw new Error('logic error'); }
    electron.ipcRenderer.send(arg.id, {
      configuration: store.getState().configuration,
    });
  });
  electron.ipcRenderer.on('message', (_: any, arg: { message: string }) => {
    if (arg.message == null) { throw new Error('logic error'); }
    store.dispatch(setMessage(arg.message));
  });
  electron.ipcRenderer.on('addError', (_: any, arg: { message: string }) => {
    if (arg.message == null) { throw new Error('logic error'); }
    store.dispatch(addError(arg.message));
  });
}

main().catch((e) => { console.error(e.stack || e); });
