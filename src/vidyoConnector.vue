<template>
  <div @mouseover="hover = true" @mouseleave="hover = false">
    <v-card>
      <v-overlay
        :zIndex="4"
        absolute
        :value="!callConnected"
      >
        <v-card light>
          <v-card-title class="pa-2 d-flex justify-center">
            Connect to the call?
          </v-card-title>
          <v-card-text class="pa-2 pt-0">
            <v-btn
              class="text-capitalize d-block"
              text
              title="Camera Privacy"
              @click="toggleCamera"
            >
              <div v-if="cameraOn">
                <v-icon color="success">
                  mdi-video
                </v-icon> Turn Off Video
              </div>
              <div v-else>
                <v-icon color="error">
                  mdi-video-off
                </v-icon> Start Video
              </div>
            </v-btn>
            <v-btn
              class="text-capitalize d-block"
              text
              title="Microphone Privacy"
              @click="toggleMicrophone"
            >
              <div v-if="microphoneOn">
                <v-icon color="success">
                  mdi-microphone
                </v-icon> Turn Off Microphone
              </div>
              <div v-else>
                <v-icon color="error">
                  mdi-microphone-off
                </v-icon> Start Microphone
              </div>
            </v-btn>
            <p v-if="errorConnecting" class="ma-0 error--text d-flex justify-center">
              Failed to connect
            </p>
          </v-card-text>
          <v-card-actions class="d-flex justify-center">
            <v-btn
              @click="cancelMeeting"
            >
              Cancel
            </v-btn>
            <v-btn
              color="success"
              :loading="connecting"
              @click="connectToCall"
            >
              Connect
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-overlay>
      <v-overlay
        :zIndex="4"
        absolute
        :value="confirmLeave"
      >
        <v-card light class="pa-2">
          <v-card-title>
            Leave the meeting?
          </v-card-title>
          <v-card-actions>
            <v-btn
              @click="confirmLeave = false"
            >
              Cancel
            </v-btn>
            <v-btn
              color="success"
              @click="cancelMeeting"
            >
              Leave Meeting
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-overlay>
      <div class="vidyo-top-toolbar">
        <v-btn
          large
          icon
          dark
          color="error"
          @click="closeVidyoCall"
        >
          <v-icon>
            mdi-close
          </v-icon>
        </v-btn>
      </div>
      <div :id="viewId" :style="{ height: `calc(${height} - ${showToolbar ? toolbarHeight : '0px' })` }"></div>
      <div class="pr-3 pl-3">
        <v-row v-if="isInitialized && showToolbar" class="black">
          <v-col class="white--text pa-0 pl-3 mt-2">
            <span v-if="!hideStatus">{{ participantStatus }}</span>
          </v-col>
          <v-col cols="4" class="d-flex justify-center pa-0">
            <v-btn
              fab
              icon
              dark
              title="Camera Privacy"
              @click="toggleCamera"
            >
              <v-icon v-if="cameraOn">
                mdi-video
              </v-icon>
              <v-icon v-else color="error">
                mdi-video-off
              </v-icon>
            </v-btn>
            <v-btn
              fab
              icon
              dark
              title="Microphone Privacy"
              @click="toggleMicrophone"
            >
              <v-icon v-if="microphoneOn">
                mdi-microphone
              </v-icon>
              <v-icon v-else color="error">
                mdi-microphone-off
              </v-icon>
            </v-btn>
            <v-btn
              fab
              icon
              dark
              :title="screenShareTitle"
              @click="toggleScreenShare"
            >
              <v-icon v-if="isScreenSharing" color="red">
                mdi-television-stop
              </v-icon>
              <v-icon v-else>
                mdi-television
              </v-icon>
            </v-btn>
          </v-col>
          <v-col cols="4" class="text-right white--text pa-0 pr-3 mt-2">
            <span v-if="!hideStatus">{{ connectionStatus }}</span>
          </v-col>
        </v-row>
      </div>
    </v-card>
  </div>
</template>
<script>
import { mapState } from 'vuex';

export default {
  name: 'VidyoConnector',
  props: {
    viewId: {
      type: String,
      default: ''
    },
    height: {
      type: String,
      default: '90vh'
    },
    toolbarOnHover: {
      type: Boolean,
      default: false
    },
    hideStatus: Boolean
  },
  data: function () {
    return {
      hover: false,
      toolbarHeight: '56px',
      connecting: false,
      errorConnecting: '',
      confirmLeave: false
    };
  },
  methods: {
    connectorDisconnected: function (connectionStatus) {
      this.$store.commit('setCallConnected', false);
      this.$store.commit('setConnectionStatus', connectionStatus);
    },
    connectToCall: function () {
      if (this.vidyoConnector) {
        this.connecting = true;
        this.errorConnecting = '';
        this.vidyoConnector.Connect({
          host: 'prod.vidyo.io',
          token: this.token,
          displayName: this.displayName,
          resourceId: this.resourceId,

          onSuccess: () => {
            this.$store.commit('setConnectionStatus', 'Connected');
            this.$store.commit('setCallConnected', true);
            this.connecting = false;
          },
          onFailure: (reason) => {
            this.connectorDisconnected('Failed: ' + reason);
            this.connecting = false;
            this.errorConnecting = reason;
          },
          onDisconnected: (reason) => {
            this.connectorDisconnected('Disconnected');
          }
        });
      }
    },
    disconnectFromCall: function () {
      if (this.vidyoConnector && this.callConnected) {
        this.$store.commit('setConnectionStatus', 'Disconnecting...');
        this.vidyoConnector.Disconnect().then(() => {
          this.$store.commit('setCallConnected', false);
        });
      }
    },
    toggleScreenShare: function () {
      let share = null;
      if (!this.isScreenSharing) {
        const firstScreenShare = Object.keys(this.devices.screenShares)[0];
        share = this.devices.screenShares[firstScreenShare] || null;
      }

      if (this.vidyoConnector) {
        this.vidyoConnector.SelectLocalWindowShare({
          localWindowShare: share
        }).then((success) => {
          if (success) {
            this.$store.commit('setScreenSharing', !this.isScreenSharing);
          }
        });
      }
    },
    toggleCamera: function () {
      this.$store.commit('toggleCamera');
    },

    toggleMicrophone: function () {
      this.$store.commit('toggleMicrophone');
    },
    cancelMeeting: function () {
      this.confirmLeave = false;
      this.$store.dispatch('destroyVidyoConnector');
    },
    closeVidyoCall: function () {
      if (this.callConnected) {
        this.confirmLeave = true;
      } else {
        this.cancelMeeting();
      }
    }
  },
  computed: {
    showToolbar: function () {
      if (this.toolbarOnHover) {
        return this.hover;
      }
      return true;
    },
    screenShareTitle: function () {
      return this.isScreenSharing ? 'Stop Sharing' : 'Start Sharing';
    },
    callConnectionTitle: function () {
      return this.callConnected ? 'Leave Call' : 'Join Call';
    },
    ...mapState([
      'vidyoConnector',
      'participantStatus',
      'connectionStatus',
      'isScreenSharing',
      'devices',
      'isInitialized',
      'remoteParticipants',
      'inMeeting',
      'callConnected',
      'cameraOn',
      'microphoneOn',
      'token',
      'displayName',
      'resourceId'
    ])
  },
  mounted: function () {
    if (this.vidyoConnector && this.inMeeting) {
      this.vidyoConnector.AssignViewToCompositeRenderer({
        viewId: this.viewId,
        remoteParticipants: this.remoteParticipants,
        viewStyle: 'VIDYO_CONNECTORVIEWSTYLE_Default'
      });
    }
  },
  beforeDestroy: function () {
    if (this.vidyoConnector) {
      this.vidyoConnector.HideView({ viewId: this.viewId });
    }
  }
};
</script>
<style scoped>
.vidyo-top-toolbar {
  position: absolute;
  z-index: 5;
  right: 0;
}
</style>
