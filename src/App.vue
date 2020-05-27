<template>
  <v-app>
    <v-content
      id="main-content"
    >
      <v-card v-if="!inMeeting">
       <v-card-title>Setup Vidyo</v-card-title>
       <v-card-text>
         <v-text-field v-model="token" label="Token"></v-text-field>
         <v-text-field v-model="resourceId" label="Resource Id"></v-text-field>
         <v-text-field v-model="displayName" label="Display Name"></v-text-field>
       </v-card-text>
       <v-card-actions>
         <v-btn @click="setupVidyo">Setup</v-btn>
       </v-card-actions>
      </v-card>
      <vidyo-connector
        v-show="inMeeting"
        viewId="renderer"
      />
    </v-content>
  </v-app>
</template>

<script>
import VidyoConnector from './vidyoConnector.vue';
import { mapState } from 'vuex';

export default {
  name: 'App',
  components: {
    VidyoConnector
  },
  data: function () {
    return {
      token: '',
      resourceId: '',
      displayName: ''
    };
  },
  methods: {
    setupVidyo: function() {
      this.$store.dispatch('startVidyoCall', {
        viewId: 'renderer',
        token: this.token, 
        resourceId: this.resourceId, 
        displayName: this.displayName
      })
    }
  },
  computed: {
    ...mapState(['inMeeting'])
  },
  mounted: function () {
    const vidyoScript = document.createElement('script');
    vidyoScript.setAttribute('type', 'text/javascript');
    vidyoScript.setAttribute('src', 'https://static.vidyo.io/latest/javascript/VidyoClient/VidyoClient.js?onload=onVidyoClientLoaded');
    document.head.appendChild(vidyoScript);

    const vidyoLoadScript = document.createElement('script');
    vidyoLoadScript.setAttribute('type', 'text/javascript');
    vidyoLoadScript.text = `
    function onVidyoClientLoaded (status) {
      switch (status.state) {
          case "READY":             // The library is operating normally
              window.VC = new window.VidyoClientLib.VidyoClient('', () => {
                  //
              });
              let event = new CustomEvent('vidyoclient:ready', {detail: VC});
              document.dispatchEvent(event);
              break;
          case "RETRYING":          // The library operating is temporarily paused
              break;
          case "FAILED":            // The library operating has stopped
              break;
          case "FAILEDVERSION":     // The library operating has stopped
              break;
          case "NOTAVAILABLE":      // The library is not available
              break;
      }
      return true;                  // Return true to reload the plugins if not available
    }
    `;
    document.body.appendChild(vidyoLoadScript);
  }
};
</script>
