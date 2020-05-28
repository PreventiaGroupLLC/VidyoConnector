const state = {
  callConnected: false,
  inMeeting: false,
  vidyoConnector: null,
  cameraOn: false,
  microphoneOn: true,
  devices: {
    microphones: {},
    speakers: {},
    cameras: {},
    screenShares: {}
  },

  isInitialized: false,

  participantStatus: '',
  connectionStatus: '',

  isScreenSharing: false,

  remoteParticipants: 2,
  token: '',
  resourceId: '',
  displayName: '',

  vidyoclientListener: null
};

const mutations = {
  connect: function (state, vidyoConnector) {
    state.connectionStatus = 'Initializing...';
    state.vidyoConnector = vidyoConnector;
  },
  initialized: function (state) {
    state.isInitialized = true;
    state.connectionStatus = 'Ready to connect';
  },
  addDevice: function (state, { type, device }) {
    state.devices[type][device.id] = device;
  },
  removeDevice: function (state, { type, device }) {
    delete state.devices[type][device.id];
  },
  setParticipantStatus: function (state, status) {
    state.participantStatus = status;
  },
  setScreenSharing: function (state, bool) {
    state.isScreenSharing = bool;
  },
  setConnectionStatus: function (state, status) {
    state.connectionStatus = status;
  },
  setInMeeting: function (state, bool) {
    state.inMeeting = bool;
  },
  setCallConnected: function (state, bool) {
    state.callConnected = bool;
  },
  setVidyoConnectorEventListenter: function (state, fnc) {
    state.vidyoclientListener = fnc;
  },
  toggleCamera: function (state) {
    if (state.vidyoConnector) {
      state.vidyoConnector.SetCameraPrivacy({
        privacy: state.cameraOn
      });
    }
    state.cameraOn = !state.cameraOn;
  },
  toggleMicrophone: function (state) {
    if (state.vidyoConnector) {
      state.vidyoConnector.SetMicrophonePrivacy({
        privacy: state.microphoneOn
      });
    }
    state.microphoneOn = !state.microphoneOn;
  },
  setConnectInfo: function (state, connectInfo) {
    state.token = connectInfo.token;
    state.resourceId = connectInfo.resourceId;
    state.displayName = connectInfo.displayName;
  },
  resetData: function (state) {
    state.callConnected = false;
    state.inMeeting = false;
    state.vidyoConnector = null;
    state.cameraOn = false;
    state.microphoneOn = true;
    state.devices.microphones = {};
    state.devices.speakers = {};
    state.devices.cameras = {};
    state.devices.screenShares = {};
    state.isInitialized = false;
    state.participantStatus = '';
    state.connectionStatus = '';
    state.isScreenSharing = false;
    state.remoteParticipants = 2;
    state.vidyoclientListener = null;
    state.token = '';
    state.resourceId = '';
    state.displayName = '';
  }
};

const actions = {
  startVidyoCall: function (store, { viewId, token, resourceId, displayName }) {
    store.commit('setInMeeting', true);
    store.commit('setConnectInfo', { token, resourceId, displayName });
    if (window.VC) {
      store.dispatch('createVidyoConnector', { viewId });
    } else {
      const eventFnc = (event) => {
        store.dispatch('createVidyoConnector', { viewId, ...event });
      };
      store.commit('setVidyoConnectorEventListenter', eventFnc);
      document.addEventListener('vidyoclient:ready', eventFnc);
    }
  },
  createVidyoConnector: function (store, { detail, viewId }) {
    const VC = window.VC || detail;
    VC.CreateVidyoConnector({
      viewId,
      viewStyle: 'VIDYO_CONNECTORVIEWSTYLE_Default',
      remoteParticipants: store.state.remoteParticipants,
      logFileFilter: 'error',
      logFileName: '',
      userData: ''
    }).then((vidyoConnector) => {
      store.dispatch('initialize', vidyoConnector);
    }).catch(() => {
      store.commit('setInMeeting', false);
      console.error('CreateVidyoConnector Failed');
    });
  },

  initialize: async function (store, vidyoConnector) {
    store.commit('connect', vidyoConnector);
    if (vidyoConnector) {
      vidyoConnector.SetCameraPrivacy({
        privacy: true
      });
      await store.dispatch('registerCameras', vidyoConnector);
      await store.dispatch('registerMicrophones', vidyoConnector);
      await store.dispatch('registerSpeakers', vidyoConnector);
      await store.dispatch('registerParticipantsListener', vidyoConnector);
      store.dispatch('registerSharingListener', vidyoConnector);
    }
    store.commit('initialized');
  },
  registerCameras: function (store, vidyoConnector) {
    return vidyoConnector.RegisterLocalCameraEventListener({
      onAdded: (camera) => {
        store.commit('addDevice', { type: 'cameras', device: camera });
      },
      onRemoved: (camera) => {
        store.commit('removeDevice', { type: 'cameras', device: camera });
      },
      onSelected: () => {},
      onStateUpdated: () => {}
    });
  },
  registerMicrophones: function (store, vidyoConnector) {
    return vidyoConnector.RegisterLocalMicrophoneEventListener({
      onAdded: (microphone) => {
        store.commit('addDevice', { type: 'microphones', device: microphone });
      },
      onRemoved: (microphone) => {
        store.commit('removeDevice', { type: 'microphones', device: microphone });
      },
      onSelected: () => {},
      onStateUpdated: () => {}
    });
  },
  registerSpeakers: function (store, vidyoConnector) {
    return vidyoConnector.RegisterLocalSpeakerEventListener({
      onAdded: (speaker) => {
        store.commit('addDevice', { type: 'speakers', device: speaker });
      },
      onRemoved: (speaker) => {
        store.commit('removeDevice', { type: 'speakers', device: speaker });
      },
      onSelected: () => {},
      onStateUpdated: () => {}
    });
  },
  registerParticipantsListener: function (store, vidyoConnector) {
    const getParticipantName = (participant, cb) => {
      participant.GetName().then(name => cb(name));
    };

    return vidyoConnector.RegisterParticipantEventListener({
      onJoined: (participant) => {
        getParticipantName(participant, (name) => {
          store.commit('setParticipantStatus', `${name} Joined`);
        });
      },
      onLeft: (participant) => {
        getParticipantName(participant, (name) => {
          store.commit('setParticipantStatus', `${name} Left`);
        });
      },
      onLoudestChanged: (participant, audioOnly) => {
        getParticipantName(participant, (name) => {
          store.commit('setParticipantStatus', `${name} Speaking`);
        });
      },
      onDynamicChanged: () => {}
    });
  },
  registerSharingListener: function (store, vidyoConnector) {
    return vidyoConnector.RegisterLocalWindowShareEventListener({
      onAdded: (windowShare) => {
        if (windowShare.name !== '') {
          store.commit('addDevice', { type: 'screenShares', device: windowShare });
        }
      },
      onRemoved: (windowShare) => {
        store.commit('removeDevice', { type: 'screenShares', device: windowShare });
      },
      onSelected: (windowShare) => {
        store.commit('setScreenSharing', !!windowShare);
      },
      onStateUpdated: () => {}
    });
  },
  destroyVidyoConnector: function (store) {
    if (store.state.vidyoConnector) {
      store.state.vidyoConnector.Disable();
      document.removeEventListener('vidyoclient:ready', store.state.vidyoclientListener);
      store.commit('resetData');
    }
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions
};
