import '@abraham/reflection'
import Vue from 'vue'
import { initDevtool } from '@sigi/devtool'

import Commits from './commits.vue'

const vm = new Vue({
  el: '#app',

  render: (createElement) => createElement(Commits),
})

vm.$mount()

initDevtool()
