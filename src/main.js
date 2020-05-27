import Vue from 'vue';
import App from './App.vue';
import Vuex from 'vuex';
import Vuetify from 'vuetify/lib'
import storeConfig from './vidyoConnectorStore.js';

import './style.scss';

Vue.use(Vuetify);
const vuetify = new Vuetify();

Vue.use(Vuex);
Vue.config.productionTip = false;

const store = new Vuex.Store(storeConfig);

new Vue({
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app');
