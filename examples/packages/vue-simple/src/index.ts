import '@abraham/reflection'
import { initDevtool } from '@sigi/devtool'
import Vue from 'vue'

import Commits from './commits.vue'

const vm = new Vue({
  el: '#app',

  render: (createElement) => createElement(Commits),
})

vm.$mount()

initDevtool()
